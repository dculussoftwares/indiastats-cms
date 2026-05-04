/**
 * index.ts — Azure Timer-triggered Function
 *
 * Runs every 5 minutes. Scrapes all 234 TN constituencies from ECI
 * in batches of 20, then writes directly to PostgreSQL.
 *
 * Schedule: every 5 minutes (cron: 0 *\/5 * * * *)
 */
import { app, InvocationContext, Timer } from '@azure/functions'
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
