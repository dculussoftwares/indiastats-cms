#!/usr/bin/env tsx
/**
 * ECI Scrape + Push
 * Usage: pnpm eci:push
 *
 * Scrapes all 234 Tamil Nadu constituency results from ECI website
 * using Playwright (real browser, bypasses Akamai WAF), then writes
 * the data directly to PostgreSQL.
 *
 * Requires: chromium installed (pnpm exec playwright install chromium)
 */

import { chromium } from 'playwright'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { Pool } = require('../functions/node_modules/pg')

const CONN = process.env.DATABASE_URI ||
  'postgresql://dculus_admin:REDACTED_PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=require'

const PARTY_NAME_MAP: Record<string, string> = {
  'Tamilaga Vettri Kazhagam': 'TVK',
  'Dravida Munnetra Kazhagam': 'DMK',
  'All India Anna Dravida Munnetra Kazhagam': 'AIADMK',
  'Indian National Congress': 'INC',
  'Bharatiya Janata Party': 'BJP',
  'Pattali Makkal Katchi': 'PMK',
  'Viduthalai Chiruthaigal Katchi': 'VCK',
  'Indian Union Muslim League': 'IUML',
  'Communist Party of India (Marxist)': 'CPIM',
  'Communist Party of India': 'CPI',
  'Amma Makkal Munnettra Kazagam': 'AMMK',
  'Desiya Murpokku Dravida Kazhagam': 'DMDK',
  'Naam Tamilar Katchi': 'NTK',
  'Makkal Needhi Maiam': 'MNM',
}

type Candidate = { name: string; candidateName: string; votes: number }
type ConstResult = {
  constNo: number
  top: Candidate[]
  nota: number
  totalVotes: number
  currentRound: number
  totalRounds: number
  status: string
}

// ── Scrape ──────────────────────────────────────────────────────────────────

async function scrapeAll(): Promise<ConstResult[]> {
  console.log('🌐 Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })
  const page = await ctx.newPage()

  const results: ConstResult[] = []

  for (let n = 1; n <= 234; n++) {
    const url = `https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22${n}.htm`
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(800)

      const text = await page.evaluate(() => document.body.innerText)
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

      // Parse round info (handles both "Round: 20 of 23" and "Round: 20/23" formats)
      const roundMatch = text.match(/Round[^:]*:\s*(\d+)\s*(?:\/|of)\s*(\d+)/i)
      const currentRound = roundMatch ? parseInt(roundMatch[1]) : 1
      const totalRounds = roundMatch ? parseInt(roundMatch[2]) : 1
      const status = currentRound >= totalRounds ? 'declared' : 'counting'

      // Parse candidates
      const candidates: Candidate[] = []
      const voteRegex = /^([\d,]+)\s*\(\s*[+\-\s][\d,\s]+\)$/
      let nota = 0
      let totalVotes = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.toUpperCase() === 'NOTA') {
          const nextLine = lines[i + 1] || ''
          const m = nextLine.replace(/,/g, '').match(/^(\d+)/)
          if (m) nota = parseInt(m[1])
        }
        if (line.toLowerCase().includes('total votes') || line.toLowerCase().includes('total valid votes')) {
          const nextLine = lines[i + 1] || ''
          const m = nextLine.replace(/,/g, '').match(/^(\d+)/)
          if (m) totalVotes = parseInt(m[1])
        }
      }

      // Parse candidate rows: new ECI format is votes → candidate name → party name
      for (let i = 0; i < lines.length - 2; i++) {
        const voteLine = lines[i]
        if (!voteRegex.test(voteLine)) continue
        const rawVotes = voteLine.split('(')[0].replace(/,/g, '').trim()
        const votes = parseInt(rawVotes)
        if (isNaN(votes) || votes < 0) continue

        const candidateName = lines[i + 1]
        const partyName = lines[i + 2]
        if (!partyName || !candidateName || partyName.match(/^\d/) || candidateName.match(/^\d/)) continue

        candidates.push({ name: partyName, candidateName, votes })
        i += 2
      }

      candidates.sort((a, b) => b.votes - a.votes)
      const top = candidates.slice(0, 5)

      if (!totalVotes && candidates.length) {
        totalVotes = candidates.reduce((s, c) => s + c.votes, 0) + nota
      }

      results.push({ constNo: n, top, nota, totalVotes, currentRound, totalRounds, status })

      if (n % 20 === 0) console.log(`  Scraped ${n}/234...`)
    } catch (e) {
      console.warn(`  ⚠️  Failed to scrape n=${n}: ${(e as Error).message}`)
      results.push({ constNo: n, top: [], nota: 0, totalVotes: 0, currentRound: 1, totalRounds: 1, status: 'counting' })
    }
  }

  await browser.close()
  console.log(`✅ Scraped ${results.length} constituencies`)
  return results
}

// ── Push to DB ───────────────────────────────────────────────────────────────

async function pushToDB(data: ConstResult[]) {
  console.log('🗄️  Connecting to PostgreSQL...')
  const pool = new Pool({ connectionString: CONN, ssl: { rejectUnauthorized: false } })
  const client = await pool.connect()

  const { rows: parentRows } = await client.query(
    'SELECT id, assembly_id FROM election_results_2026 WHERE state_code = $1',
    ['TN']
  )
  const idMap: Record<string, string> = {}
  for (const r of parentRows) idMap[r.assembly_id] = r.id

  let updated = 0, skipped = 0

  for (const row of data) {
    const assemblyId = `ac${String(row.constNo).padStart(3, '0')}`
    const parentId = idMap[assemblyId]
    if (!parentId) { skipped++; continue }

    await client.query('DELETE FROM election_results_2026_parties WHERE _parent_id = $1', [parentId])

    for (let i = 0; i < row.top.length; i++) {
      const c = row.top[i]
      const partyCode = PARTY_NAME_MAP[c.name] || c.name
      const uuid = crypto.randomUUID()
      await client.query(
        'INSERT INTO election_results_2026_parties (_order, _parent_id, id, name, candidate_name, votes) VALUES ($1,$2,$3,$4,$5,$6)',
        [i + 1, parentId, uuid, partyCode, c.candidateName, c.votes]
      )
    }

    const newStatus = row.status === 'declared' ? 'declared' : 'leading'
    await client.query(
      `UPDATE election_results_2026
       SET current_round=$1, total_rounds=$2,
           status=$3::enum_election_results_2026_status,
           votes=$4, nota_votes=$5,
           updated_at=NOW(), eci_last_updated_at=NOW()
       WHERE id=$6`,
      [row.currentRound, row.totalRounds, newStatus, row.totalVotes, row.nota || 0, parentId]
    )
    updated++
  }

  client.release()
  await pool.end()
  console.log(`✅ Updated ${updated} constituencies, skipped ${skipped}`)

  // Summary
  const pool2 = new Pool({ connectionString: CONN, ssl: { rejectUnauthorized: false } })
  const { rows } = await pool2.query(
    `SELECT status, count(*) FROM election_results_2026 WHERE state_code='TN' GROUP BY status ORDER BY count DESC`
  )
  const { rows: partyRows } = await pool2.query(
    `SELECT p.name, count(*) as seats
     FROM election_results_2026_parties p
     JOIN election_results_2026 e ON e.id = p._parent_id
     WHERE e.state_code='TN' AND p._order=1
     GROUP BY p.name ORDER BY seats DESC LIMIT 8`
  )
  await pool2.end()

  console.log('\nStatus:', rows.map((r: any) => `${r.status}:${r.count}`).join(', '))
  console.log('Leading party:', partyRows.map((r: any) => `${r.name}:${r.seats}`).join(', '))
}

// ── Main ─────────────────────────────────────────────────────────────────────

const data = await scrapeAll()
await pushToDB(data)
