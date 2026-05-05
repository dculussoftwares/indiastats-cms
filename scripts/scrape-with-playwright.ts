/**
 * scrape-with-playwright.ts
 *
 * Scrapes all 234 ECI constituency pages using a real Chromium browser
 * (bypasses Akamai bot detection) and writes directly to PostgreSQL.
 *
 * Run: DATABASE_URI=... npx tsx scripts/scrape-with-playwright.ts
 * Or:  ./scripts/run-scraper.sh  (sets DATABASE_URI from .env.local)
 */
import { chromium } from 'playwright'
import { createRequire } from 'module'
const { Pool } = createRequire(import.meta.url)(
  '../functions/node_modules/pg',
) as typeof import('pg')

const ECI_BASE = 'https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22'
const TOTAL = 234
const CONCURRENCY = 5 // browser tabs in parallel

const pool = new Pool({
  connectionString: process.env['DATABASE_URI'],
  ssl: { rejectUnauthorized: false },
  max: 5,
})

async function scrapePage(page: import('playwright').Page, n: number) {
  const url = `${ECI_BASE}${n}.htm`
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    const data = await page.evaluate(() => {
      const bodyText = document.body.innerText

      // Round info from body text
      const roundMatch = bodyText.match(/Status (?:as on|of EVM) Round[:\s,]+(\d+)\s*\/\s*(\d+)/i)
      const currentRound = roundMatch ? parseInt(roundMatch[1]!) : 0
      const totalRounds = roundMatch ? parseInt(roundMatch[2]!) : 0

      // Votes: extract all numbers followed by (+/-delta) pattern
      // Format in body: "62081 (+ 19483)"  or "42598 ( -19483)"
      const voteMatches = [...bodyText.matchAll(/(\d[\d,]+)\s*\(\s*[+\-]\s*[\d,]+\)/g)]
      const votes = voteMatches.map((m) => parseInt(m[1]!.replace(/,/g, '')))
      const leadingVotes = votes[0] ?? 0
      const trailingVotes = votes[1] ?? 0
      const margin = leadingVotes - trailingVotes

      // NOTA votes: last number before "None of the Above"
      const notaMatch = bodyText.match(/(\d[\d,]+)\s*\(\s*[+\-][^)]+\)[^]*?None of the Above/i)
      const notaVotes = notaMatch ? parseInt(notaMatch[1]!.replace(/,/g, '')) : 0

      const lastUpdatedMatch = bodyText.match(/Last Updated at .+/i)
      return {
        currentRound,
        totalRounds,
        margin,
        notaVotes,
        eciLastUpdatedAt: lastUpdatedMatch ? lastUpdatedMatch[0].trim() : '',
      }
    })

    if (!data.currentRound) return { n, ok: false, reason: 'no round data' }

    const status = data.currentRound >= data.totalRounds ? 'declared' : 'counting'
    const assemblyId = `ac${String(n).padStart(3, '0')}`

    const res = await pool.query(
      `UPDATE election_results_2026
         SET current_round=$1, total_rounds=$2, status=$3, margin=$4,
             nota_votes=$5, eci_last_updated_at=$6, last_scraped_at=NOW(), updated_at=NOW()
       WHERE assembly_id=$7`,
      [
        data.currentRound,
        data.totalRounds,
        status,
        data.margin || null,
        data.notaVotes || null,
        data.eciLastUpdatedAt || null,
        assemblyId,
      ],
    )
    return {
      n,
      ok: (res.rowCount ?? 0) > 0,
      status,
      round: `${data.currentRound}/${data.totalRounds}`,
    }
  } catch (e) {
    return { n, ok: false, reason: String(e).slice(0, 80) }
  }
}

async function runOnce(browser: import('playwright').Browser) {
  const start = Date.now()
  let updated = 0,
    failed = 0

  // Process in batches of CONCURRENCY
  for (let i = 1; i <= TOTAL; i += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, TOTAL - i + 1) }, (_, k) => i + k)
    const pages = await Promise.all(batch.map(() => browser.newPage()))

    const results = await Promise.all(batch.map((n, idx) => scrapePage(pages[idx]!, n)))

    await Promise.all(pages.map((p) => p.close()))

    for (const r of results) {
      if (r.ok) {
        updated++
        if (updated <= 5 || updated % 50 === 0) {
          console.log(`  ✅ ac${String(r.n).padStart(3, '0')} ${r.status} round ${r.round}`)
        }
      } else {
        failed++
        if (r.n <= 3) console.log(`  ❌ ac${String(r.n).padStart(3, '0')} ${(r as any).reason}`)
      }
    }

    process.stdout.write(
      `\r  Progress: ${Math.min(i + CONCURRENCY - 1, TOTAL)}/${TOTAL} (${updated} updated)`,
    )
  }

  const dur = ((Date.now() - start) / 1000).toFixed(1)
  console.log(
    `\n[${new Date().toISOString()}] Done in ${dur}s — updated=${updated} failed=${failed}`,
  )
  return updated
}

async function main() {
  if (!process.env['DATABASE_URI']) {
    console.error('DATABASE_URI not set')
    process.exit(1)
  }

  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })

  const INTERVAL_MS = 5 * 60 * 1000

  try {
    while (true) {
      console.log(`\n[${new Date().toISOString()}] Starting scrape of ${TOTAL} constituencies...`)
      await runOnce(browser)
      console.log(`Sleeping 5 minutes...`)
      await new Promise((r) => setTimeout(r, INTERVAL_MS))
    }
  } finally {
    await browser.close()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
