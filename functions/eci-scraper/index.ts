/**
 * index.ts — Azure Timer-triggered Function
 *
 * Runs every 5 minutes. Scrapes all 234 TN constituencies from ECI
 * in batches of 20, then writes directly to PostgreSQL.
 *
 * Schedule: every 5 minutes (cron: 0 *\/5 * * * *)
 */
import { app, InvocationContext, Timer, HttpRequest, HttpResponseInit } from '@azure/functions'
import { scrapeConstituency } from './scraper'
import { writeResultToDB, closePool } from './db-writer'

const TOTAL_CONSTITUENCIES = 234
const BATCH_SIZE = 20
const BATCH_DELAY_MS = 500

/** Sleep for `ms` milliseconds between batches */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Run one batch of assembly numbers in parallel */
async function processBatch(
  numbers: number[],
  context: InvocationContext,
): Promise<{ scraped: number; updated: number; failed: number }> {
  const results = await Promise.allSettled(numbers.map((n) => scrapeConstituency(n)))

  let scraped = 0
  let updated = 0
  let failed = 0

  for (const result of results) {
    if (result.status === 'rejected' || result.value === null) {
      failed++
      continue
    }
    scraped++
    const ok = await writeResultToDB(result.value)
    if (ok) updated++
    else failed++
  }

  return { scraped, updated, failed }
}

export async function eciScraperTimer(timer: Timer, context: InvocationContext): Promise<void> {
  context.log('ECI Scraper started')
  context.log(`DATABASE_URI set: ${!!process.env['DATABASE_URI']}`)
  const startTime = Date.now()

  let totalScraped = 0
  let totalUpdated = 0
  let totalFailed = 0

  // Build array of assembly numbers 1–234
  const allNumbers = Array.from({ length: TOTAL_CONSTITUENCIES }, (_, i) => i + 1)

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < allNumbers.length; i += BATCH_SIZE) {
    const batch = allNumbers.slice(i, i + BATCH_SIZE)
    const { scraped, updated, failed } = await processBatch(batch, context)

    totalScraped += scraped
    totalUpdated += updated
    totalFailed += failed

    context.log(
      `Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allNumbers.length / BATCH_SIZE)}: ` +
        `scraped=${scraped}, updated=${updated}, failed=${failed}`,
    )

    // Delay between batches to avoid hammering ECI servers
    if (i + BATCH_SIZE < allNumbers.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  await closePool()

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  context.log(
    `ECI Scraper complete in ${duration}s — ` +
      `scraped=${totalScraped}, updated=${totalUpdated}, failed=${totalFailed}`,
  )
}

// Register the timer trigger
app.timer('eci-scraper', {
  schedule: '0 */5 * * * *', // every 5 minutes
  handler: eciScraperTimer,
})

/** HTTP test endpoint: scrape a single constituency and return result as JSON */
app.http('eci-test', {
  methods: ['GET'],
  authLevel: 'function',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const n = parseInt(req.query.get('n') ?? '1', 10)
    const url = `https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22${n}.htm`
    // Raw fetch diagnostic
    let httpStatus = 0
    let bodySnippet = ''
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: 'https://results.eci.gov.in/',
          Connection: 'keep-alive',
        },
        signal: AbortSignal.timeout(15_000),
      })
      httpStatus = res.status
      const text = await res.text()
      bodySnippet = text.slice(0, 500)
    } catch (e) {
      return { status: 200, jsonBody: { error: String(e), url } }
    }
    if (httpStatus !== 200) {
      return { status: 200, jsonBody: { httpStatus, url, bodySnippet } }
    }
    const result = await scrapeConstituency(n)
    return { status: 200, jsonBody: result ?? { error: 'parse returned null', httpStatus, url, bodySnippet } }
  },
})
