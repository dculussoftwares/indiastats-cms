/**
 * Import AI-generated descriptions into the Districts collection.
 * Reads from data/district-descriptions.json and updates each district.
 *
 * Run: DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-district-descriptions.ts
 */

import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'

interface DescriptionEntry {
  districtId: string
  metaDescription: string
  description: string
}

async function importDescriptions() {
  console.log('Starting district descriptions import...\n')

  const payload = await getPayload({ config })

  const jsonPath = path.resolve(process.cwd(), 'data/district-descriptions.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const descriptions: DescriptionEntry[] = JSON.parse(rawData)
  console.log(`Found ${descriptions.length} descriptions to import\n`)

  const districts = await payload.find({
    collection: 'districts',
    limit: 100,
    pagination: false,
  })

  const districtMap = new Map<string, number>()
  for (const doc of districts.docs) {
    districtMap.set(doc.districtId, doc.id)
  }

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const entry of descriptions) {
    const docId = districtMap.get(entry.districtId)
    if (!docId) {
      console.log(`  NOT FOUND: ${entry.districtId}`)
      notFound++
      continue
    }
    if (!entry.description || !entry.metaDescription) {
      console.log(`  SKIPPED (empty): ${entry.districtId}`)
      skipped++
      continue
    }

    await payload.update({
      collection: 'districts',
      id: docId,
      data: {
        description: entry.description,
        metaDescription: entry.metaDescription,
      },
    })
    updated++
    console.log(`  Updated: ${entry.districtId}`)
  }

  console.log(`\nImport complete!`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Not found: ${notFound}`)

  process.exit(0)
}

importDescriptions().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
