/**
 * Import business/industry data into the Assemblies collection.
 * Reads from data/assembly-businesses.json and updates the knownBusinesses JSON field.
 *
 * Run: DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-assembly-businesses.ts
 */

import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'

async function importBusinesses() {
  console.log('Starting assembly businesses import...\n')

  const payload = await getPayload({ config })

  const jsonPath = path.resolve(process.cwd(), 'data/assembly-businesses.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const entries = JSON.parse(rawData)
  console.log(`Found ${entries.length} entries to import\n`)

  const assemblies = await payload.find({
    collection: 'assemblies',
    limit: 300,
    pagination: false,
  })

  const assemblyMap = new Map<string, number>()
  for (const doc of assemblies.docs) {
    assemblyMap.set(doc.assemblyId, doc.id)
  }

  let updated = 0
  let notFound = 0

  for (const entry of entries) {
    const docId = assemblyMap.get(entry.assemblyId)
    if (!docId) {
      console.log(`  NOT FOUND: ${entry.assemblyId}`)
      notFound++
      continue
    }

    // Store the structured business data as JSON
    const knownBusinesses = {
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
    }

    await payload.update({
      collection: 'assemblies',
      id: docId,
      data: { knownBusinesses },
    })
    updated++
    if (updated % 20 === 0) console.log(`  Progress: ${updated}/${entries.length}`)
  }

  console.log(`\nImport complete! Updated: ${updated} | Not found: ${notFound}`)
  process.exit(0)
}

importBusinesses().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
