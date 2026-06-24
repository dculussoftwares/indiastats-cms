/**
 * Seed script for UP election history — 2012, 2017, 2022 from CSV.
 * Run: pnpm exec tsx scripts/seed-up-election-history.mts
 * Optional flags:
 *   --year=2022          Only seed a specific year
 *   --dry-run            Print counts, don't write to DB
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const yearFilter = args.find((a) => a.startsWith('--year='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

type CsvRow = {
  '#': string
  AC_NAME: string
  AC_NO: string
  NAME: string
  PARTY: string
  VOTES: string
  YEAR: string
  polled_votes: string
  vote_percent: string
}

// Party shortcode normalization
const PARTY_MAP: Record<string, string> = {
  IND: 'IND',
  NOTA: 'NOTA',
  BJP: 'BJP',
  SP: 'SP',
  BSP: 'BSP',
  INC: 'INC',
  RLD: 'RLD',
  SBSP: 'SBSP',
  NISHAD: 'NISHAD',
  'APDA(S)': 'ApnaDal(S)',
  'ADS': 'ApnaDal(S)',
  AIMIM: 'AIMIM',
  AAP: 'AAP',
  'JD(U)': 'JD(U)',
  JD: 'JD',
  NCP: 'NCP',
  RJD: 'RJD',
  LJP: 'LJP',
}

function normalizeParty(party: string): string {
  const p = party.trim().toUpperCase()
  return PARTY_MAP[p] ?? party.trim()
}

async function readCsv(filePath: string): Promise<CsvRow[]> {
  const rows: CsvRow[] = []
  const rl = createInterface({ input: createReadStream(filePath, { encoding: 'utf-8' }) })
  let headers: string[] = []
  let first = true

  await new Promise<void>((resolve, reject) => {
    rl.on('line', (line) => {
      const cols = line.split(',')
      if (first) {
        headers = cols.map((h) => h.trim())
        first = false
        return
      }
      if (cols.length < headers.length) return
      const row: Record<string, string> = {}
      headers.forEach((h, i) => (row[h] = (cols[i] ?? '').trim()))
      // Skip rows with invalid year (malformed CSV lines)
      const year = parseInt(row['YEAR'] ?? '', 10)
      if (![2012, 2017, 2022, 2007, 2002, 1996, 1993, 1991, 1989, 1985].includes(year)) return
      rows.push(row as CsvRow)
    })
    rl.on('close', resolve)
    rl.on('error', reject)
  })

  return rows
}

async function main() {
  const csvPath = path.resolve(
    __dirname,
    '../up/data-analytics.github.io/Election_Data_2022/Uttar_Pradesh.csv',
  )

  console.log('Reading CSV...')
  const allRows = await readCsv(csvPath)

  const rows = yearFilter
    ? allRows.filter((r) => r.YEAR === yearFilter)
    : allRows

  // Group by year for progress reporting
  const byYear = rows.reduce<Record<string, CsvRow[]>>((acc, r) => {
    ;(acc[r.YEAR] ??= []).push(r)
    return acc
  }, {})

  console.log('Row counts by year:')
  for (const [yr, yrows] of Object.entries(byYear)) {
    console.log(`  ${yr}: ${yrows.length} candidates`)
  }

  if (dryRun) {
    console.log('\nDry run — exiting without DB writes')
    process.exit(0)
  }

  const payload = await getPayload({ config })

  // Delete existing UP election history first (idempotent re-seed)
  console.log('\nDeleting existing UP election history...')
  let deleted = 0
  const pageSize = 500
  while (true) {
    const existing = await payload.find({
      collection: 'election-history',
      where: {
        stateCode: { equals: 'UP' },
        ...(yearFilter ? { electionYear: { equals: Number(yearFilter) } } : {}),
      },
      limit: pageSize,
      pagination: false,
    })
    if (existing.docs.length === 0) break
    for (const doc of existing.docs) {
      await payload.delete({ collection: 'election-history', id: doc.id })
      deleted++
    }
    if (deleted % 1000 === 0) console.log(`  deleted ${deleted}...`)
  }
  console.log(`  deleted ${deleted} existing records`)

  // Insert in batches
  console.log('\nInserting election history...')
  let inserted = 0
  const BATCH = 100

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    await Promise.all(
      batch.map((row) => {
        const acNo = parseInt(row.AC_NO, 10)
        const assemblyId = `up-ac${String(acNo).padStart(3, '0')}`
        return payload.create({
          collection: 'election-history',
          data: {
            stateCode: 'UP',
            assemblyId,
            assemblyName: row.AC_NAME,
            assemblyNo: acNo,
            electionYear: parseInt(row.YEAR, 10),
            votesPolled: parseInt(row.polled_votes, 10) || 0,
            totalVoters: 0,
            candidateName: row.NAME,
            candidateParty: normalizeParty(row.PARTY),
            candidateVotes: parseInt(row.VOTES, 10) || 0,
          },
        })
      }),
    )
    inserted += batch.length
    if (inserted % 1000 === 0 || inserted === rows.length) {
      console.log(`  ${inserted}/${rows.length} records inserted`)
    }
  }

  console.log('\n✓ UP election history seeded successfully')
  console.log(`  Total inserted: ${inserted}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
