/**
 * run-local.ts
 *
 * Local scraper runner — fetches ECI pages directly from the Mac (not blocked by Akamai).
 * Runs every 5 minutes in a loop. Writes results directly to PostgreSQL.
 *
 * Usage:  cd functions && npx tsx eci-scraper/run-local.ts
 */
import { scrapeConstituencyDirect } from './scraper-direct'
import { writeResultToDB, closePool } from './db-writer'

const BATCH = 20
const TOTAL = 234
const INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

async function runOnce() {
  const start = Date.now()
  let scraped = 0,
    updated = 0,
    failed = 0

  for (let i = 1; i <= TOTAL; i += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, TOTAL - i + 1) }, (_, k) => i + k)
    const results = await Promise.all(batch.map(scrapeConstituencyDirect))
    for (const result of results) {
      if (!result) {
        failed++
        continue
      }
      scraped++
      const ok = await writeResultToDB(result)
      if (ok) updated++
    }
  }

  const dur = ((Date.now() - start) / 1000).toFixed(1)
  console.log(
    `[${new Date().toISOString()}] done in ${dur}s — scraped=${scraped} updated=${updated} failed=${failed}`,
  )
}

async function main() {
  console.log(`[local-scraper] Started. DATABASE_URI set: ${!!process.env['DATABASE_URI']}`)
  while (true) {
    await runOnce().catch((e) => console.error('[local-scraper] run error:', e))
    console.log(`[local-scraper] Sleeping 5 min...`)
    await new Promise((r) => setTimeout(r, INTERVAL_MS))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => closePool())
