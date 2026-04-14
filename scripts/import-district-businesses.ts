/**
 * Import business/industry data into the Districts collection.
 * Run: DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-district-businesses.ts
 */

import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'

async function importBusinesses() {
  console.log('Starting district businesses import...\n')
  const payload = await getPayload({ config })

  const jsonPath = path.resolve(process.cwd(), 'data/district-businesses.json')
  const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`Found ${entries.length} entries to import\n`)

  const districts = await payload.find({ collection: 'districts', limit: 100, pagination: false })
  const districtMap = new Map<string, number>()
  for (const doc of districts.docs) districtMap.set(doc.districtId, doc.id)

  let updated = 0, notFound = 0
  for (const entry of entries) {
    const docId = districtMap.get(entry.districtId)
    if (!docId) { console.log(`  NOT FOUND: ${entry.districtId}`); notFound++; continue }

    await payload.update({
      collection: 'districts', id: docId,
      data: {
        knownBusinesses: {
          economicMix: entry.economicMix || [],
          majorIndustries: entry.majorIndustries || [],
          topEmployers: entry.topEmployers || [],
          localBusinessTypes: entry.localBusinessTypes || [],
          commercialLandmarks: entry.commercialLandmarks || [],
          education: entry.education || [],
          healthcare: entry.healthcare || [],
          transport: entry.transport || [],
          landmarks: entry.landmarks || [],
          businessSummary: entry.businessSummary || '',
        },
      },
    })
    updated++
    console.log(`  Updated: ${entry.districtId}`)
  }

  console.log(`\nImport complete! Updated: ${updated} | Not found: ${notFound}`)
  process.exit(0)
}

importBusinesses().catch((e) => { console.error('Import failed:', e); process.exit(1) })
