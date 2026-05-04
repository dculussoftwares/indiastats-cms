/**
 * seed-election-results-2026.mts
 *
 * Seeds the `election-results-2026` collection with all 234 TN assembly
 * constituencies. Cross-references the `assemblies` collection to pull
 * districtName. Voting trends data (electors, votes, turnoutPercent) comes
 * from public/data/tn-2026-voting-trends.json.
 *
 * Run:
 *   pnpm exec tsx scripts/seed-election-results-2026.mts
 *
 * Safe to re-run — uses upsert-by-assemblyId logic (delete + create).
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface VotingTrendEntry {
  assemblyId: string
  acNumber: number  // from JSON only — not stored in DB
  assemblyName: string
  electors: number
  votes: number
  turnoutPercent: number
}

interface AssemblyDoc {
  id: string | number
  assemblyId?: string
  districtName?: string
  name?: string
}

async function main() {
  console.log('🔌 Connecting to Payload...')
  const payload = await getPayload({ config })

  // ── 1. Load voting trends JSON ──────────────────────────────────────────────
  const jsonPath = path.resolve(__dirname, '../public/data/tn-2026-voting-trends.json')
  const trendsRaw = fs.readFileSync(jsonPath, 'utf8')
  const trends: VotingTrendEntry[] = JSON.parse(trendsRaw)
  console.log(`📂 Loaded ${trends.length} entries from tn-2026-voting-trends.json`)

  // ── 2. Build assemblyId → districtName lookup from Assemblies collection ────
  console.log('📋 Fetching assembly–district mapping...')
  const { docs: assemblyDocs } = await payload.find({
    collection: 'assemblies',
    where: { stateCode: { equals: 'TN' } },
    limit: 300,
    pagination: false,
    depth: 0,
  })

  const districtMap: Record<string, string> = {}
  for (const doc of assemblyDocs as AssemblyDoc[]) {
    if (doc.assemblyId && doc.districtName) {
      // districtName in DB is bilingual "Tamil / ENGLISH" — extract English part
      const parts = doc.districtName.split('/')
      const english = (parts[1] ?? parts[0] ?? '').trim()
      districtMap[doc.assemblyId] = english || doc.districtName
    }
  }
  console.log(`✅ District map built for ${Object.keys(districtMap).length} assemblies`)

  // ── 3. Upsert each entry ────────────────────────────────────────────────────
  let created = 0
  let updated = 0
  let errors = 0

  for (const entry of trends) {
    try {
      const districtName = districtMap[entry.assemblyId] ?? ''

      // Check if a doc already exists
      const existing = await payload.find({
        collection: 'election-results-2026',
        where: { assemblyId: { equals: entry.assemblyId } },
        limit: 1,
        depth: 0,
      })

      const docData = {
        stateCode: 'TN',
        assemblyId: entry.assemblyId,
        assemblyName: entry.assemblyName,
        districtName,
        electors: entry.electors,
        votes: entry.votes,
        turnoutPercent: entry.turnoutPercent,
        totalRounds: 0,
        currentRound: 0,
        status: 'pending' as const,
        parties: [],
      }

      if (existing.docs.length > 0) {
        // Update existing — preserve live counting fields if already set
        const existingDoc = existing.docs[0] as Record<string, unknown>
        await payload.update({
          collection: 'election-results-2026',
          id: existingDoc.id as string,
          data: {
            // Always update reference data from ECI
            assemblyName: docData.assemblyName,
            districtName: docData.districtName,
            electors: docData.electors,
            votes: docData.votes,
            turnoutPercent: docData.turnoutPercent,
            // Don't overwrite live counting data if already populated
            // (only seed totalRounds/currentRound/status/parties if not started)
            ...(existingDoc.status === 'pending' && {
              totalRounds: 0,
              currentRound: 0,
              status: 'pending',
              parties: [],
            }),
          },
        })
        updated++
      } else {
        await payload.create({
          collection: 'election-results-2026',
          data: docData,
        })
        created++
      }

      if ((created + updated) % 50 === 0) {
        console.log(`  … ${created + updated}/${trends.length} processed`)
      }
    } catch (err) {
      console.error(`  ❌ Error on ${entry.assemblyId} (${entry.assemblyName}):`, err)
      errors++
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Created : ${created}`)
  console.log(`   Updated : ${updated}`)
  console.log(`   Errors  : ${errors}`)

  process.exit(errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
