/**
 * Import AI-generated descriptions into the Assemblies collection.
 * Reads from data/assembly-descriptions.json and updates each assembly
 * with `description` and `metaDescription` fields.
 *
 * Run with: pnpm exec tsx scripts/import-assembly-descriptions.ts
 */

// NOTE: Run with DOTENV_CONFIG_PATH=.env.local prefix:
//   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-assembly-descriptions.ts
import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'

interface DescriptionEntry {
  assemblyId: string
  metaDescription: string
  description: string
}

async function importDescriptions() {
  console.log('Starting assembly descriptions import...\n')

  const payload = await getPayload({ config })

  // Read JSON data
  const jsonPath = path.resolve(process.cwd(), 'data/assembly-descriptions.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const descriptions: DescriptionEntry[] = JSON.parse(rawData)
  console.log(`Found ${descriptions.length} descriptions to import\n`)

  // Fetch all assemblies
  const assemblies = await payload.find({
    collection: 'assemblies',
    limit: 300,
    pagination: false,
  })

  // Build lookup: assemblyId -> doc.id
  const assemblyMap = new Map<string, number>()
  for (const doc of assemblies.docs) {
    assemblyMap.set(doc.assemblyId, doc.id)
  }

  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const entry of descriptions) {
    const docId = assemblyMap.get(entry.assemblyId)
    if (!docId) {
      console.log(`  NOT FOUND: ${entry.assemblyId}`)
      notFound++
      continue
    }

    if (!entry.description || !entry.metaDescription) {
      console.log(`  SKIPPED (empty): ${entry.assemblyId}`)
      skipped++
      continue
    }

    await payload.update({
      collection: 'assemblies',
      id: docId,
      data: {
        description: entry.description,
        metaDescription: entry.metaDescription,
      },
    })
    updated++
    if (updated % 20 === 0) {
      console.log(`  Progress: ${updated}/${descriptions.length}`)
    }
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
