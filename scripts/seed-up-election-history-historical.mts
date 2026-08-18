/**
 * Seed script for UP election history — 1951 through 2007, extracted from official ECI
 * Statistical Report PDFs (scripts/up-election-pipeline/data/extracted/up_<year>.json).
 * 2012/2017/2022 are already seeded separately via seed-up-election-history.mts.
 *
 * Historical constituencies use a year-scoped assemblyId (up-<year>-ac<NNN>) since delimitation
 * changed constituency boundaries/numbering multiple times across this range — old AC numbers
 * do not map 1:1 to today's 403-seat assemblies collection. Current-UP-footprint only: rows for
 * constituencies now in Uttarakhand (pre-2000 undivided UP) were already excluded at extraction
 * time.
 *
 * Run: pnpm exec tsx scripts/seed-up-election-history-historical.mts
 * Optional flags:
 *   --year=1951           Only seed a specific year
 *   --dry-run             Print counts, don't write to DB
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const yearFilter = args.find((a) => a.startsWith('--year='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

const YEARS = [1951, 1957, 1962, 1967, 1969, 1974, 1977, 1980, 1985, 1989, 1991, 1993, 1996, 2002, 2007]

type ExtractedRow = {
  stateCode: string
  electionYear: number
  constituencyNo: number
  constituencyName: string
  seats: number
  candidateName: string
  candidateSex: string
  candidateParty: string
  candidateVotes: number
  candidateVotePct: number | null
  totalVoters: number
  votesPolled: number
  validVotes: number
}

function loadYear(year: number): ExtractedRow[] {
  const p = path.resolve(
    __dirname,
    `up-election-pipeline/data/extracted/up_${year}.json`,
  )
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

async function main() {
  const years = yearFilter ? [Number(yearFilter)] : YEARS

  console.log('Row counts by year:')
  let grandTotal = 0
  const allRows: ExtractedRow[] = []
  for (const year of years) {
    const rows = loadYear(year)
    allRows.push(...rows)
    grandTotal += rows.length
    console.log(`  ${year}: ${rows.length} candidates`)
  }
  console.log(`  TOTAL: ${grandTotal}`)

  if (dryRun) {
    console.log('\nDry run — exiting without DB writes')
    process.exit(0)
  }

  const payload = await getPayload({ config })

  console.log('\nDeleting existing historical UP election history (idempotent re-seed)...')
  let deleted = 0
  for (const year of years) {
    const pageSize = 500
    while (true) {
      const existing = await payload.find({
        collection: 'election-history',
        where: {
          stateCode: { equals: 'UP' },
          electionYear: { equals: year },
        },
        limit: pageSize,
        pagination: false,
      })
      if (existing.docs.length === 0) break
      for (const doc of existing.docs) {
        await payload.delete({ collection: 'election-history', id: doc.id })
        deleted++
      }
    }
  }
  console.log(`  deleted ${deleted} existing records for years: ${years.join(', ')}`)

  console.log('\nInserting election history...')
  let inserted = 0
  const BATCH = 50

  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH)
    await Promise.all(
      batch.map((row) => {
        const assemblyId = `up-${row.electionYear}-ac${String(row.constituencyNo).padStart(3, '0')}`
        return payload.create({
          collection: 'election-history',
          data: {
            stateCode: 'UP',
            assemblyId,
            assemblyName: row.constituencyName,
            assemblyNo: row.constituencyNo,
            electionYear: row.electionYear,
            totalVoters: row.totalVoters,
            votesPolled: row.votesPolled,
            candidateName: row.candidateName,
            candidateParty: row.candidateParty,
            candidateVotes: row.candidateVotes,
          },
        })
      }),
    )
    inserted += batch.length
    if (inserted % 1000 === 0 || inserted === allRows.length) {
      console.log(`  ${inserted}/${allRows.length} records inserted`)
    }
  }

  console.log('\n✓ Historical UP election history seeded successfully')
  console.log(`  Total inserted: ${inserted}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
