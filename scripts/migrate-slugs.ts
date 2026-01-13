/**
 * Migration script to populate slug fields for Districts and Assemblies
 * 
 * This script:
 * 1. Fetches all districts and generates slugs from districtName
 * 2. Fetches all assemblies and generates slugs from name
 * 3. Also populates districtId on assemblies based on districtName matching
 * 
 * Run with: npx tsx scripts/migrate-slugs.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

function generateSlug(name: string): string {
    // Handle bilingual names - try to extract the English portion
    let englishName = name

    if (name.includes(' / ')) {
        const parts = name.split(' / ')
        // Try first part, if it's empty after processing, try second part
        const firstPart = parts[0].trim()
        const secondPart = parts[1]?.trim() || ''

        // Check if first part contains only non-ASCII (Tamil) characters
        const firstPartCleaned = firstPart.replace(/[^a-zA-Z0-9\s-]/g, '').trim()
        const secondPartCleaned = secondPart.replace(/[^a-zA-Z0-9\s-]/g, '').trim()

        // Use whichever part has English content
        englishName = firstPartCleaned.length > 0 ? firstPart : secondPart
    }

    const slug = englishName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

    // Fallback to full name if still empty
    if (!slug) {
        return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'unknown'
    }

    return slug
}

async function migrateSlug() {
    console.log('🚀 Starting slug migration...\n')

    const payload = await getPayload({ config })

    // Step 1: Migrate Districts
    console.log('📍 Migrating Districts...')
    const districts = await payload.find({
        collection: 'districts',
        limit: 100,
        pagination: false,
    })

    const districtMap = new Map<string, { id: string; districtId: string; slug: string }>()
    let districtUpdates = 0

    for (const district of districts.docs) {
        const districtDoc = district as any
        const slug = generateSlug(districtDoc.districtName)

        districtMap.set(districtDoc.districtName, {
            id: districtDoc.id,
            districtId: districtDoc.districtId,
            slug,
        })

        // Only update if slug is not already set
        if (!districtDoc.slug) {
            await payload.update({
                collection: 'districts',
                id: districtDoc.id,
                data: { slug },
            })
            districtUpdates++
            console.log(`  ✓ ${districtDoc.districtName} → ${slug}`)
        } else {
            console.log(`  ⏭ ${districtDoc.districtName} already has slug: ${districtDoc.slug}`)
        }
    }

    console.log(`\n✅ Districts: ${districtUpdates} updated\n`)

    // Step 2: Migrate Assemblies
    console.log('🏛️ Migrating Assemblies...')
    const assemblies = await payload.find({
        collection: 'assemblies',
        limit: 300,
        pagination: false,
    })

    let assemblyUpdates = 0
    const slugCounts = new Map<string, number>()

    for (const assembly of assemblies.docs) {
        const assemblyDoc = assembly as any
        let slug = generateSlug(assemblyDoc.name)

        // Handle duplicate slugs by appending assemblyId
        const existingCount = slugCounts.get(slug) || 0
        if (existingCount > 0) {
            slug = `${slug}-${assemblyDoc.assemblyId}`
            console.log(`  ⚠️ Duplicate slug detected, using: ${slug}`)
        }
        slugCounts.set(slug, existingCount + 1)

        // Get districtId from districtName mapping
        const districtInfo = districtMap.get(assemblyDoc.districtName)
        const districtId = districtInfo?.districtId || assemblyDoc.districtId

        // Only update if slug or districtId is missing
        if (!assemblyDoc.slug || !assemblyDoc.districtId) {
            const updateData: any = {}
            if (!assemblyDoc.slug) updateData.slug = slug
            if (!assemblyDoc.districtId && districtId) updateData.districtId = districtId

            if (Object.keys(updateData).length > 0) {
                await payload.update({
                    collection: 'assemblies',
                    id: assemblyDoc.id,
                    data: updateData,
                })
                assemblyUpdates++
                console.log(`  ✓ ${assemblyDoc.name} → ${slug} (district: ${districtId || 'N/A'})`)
            }
        } else {
            console.log(`  ⏭ ${assemblyDoc.name} already has slug: ${assemblyDoc.slug}`)
        }
    }

    console.log(`\n✅ Assemblies: ${assemblyUpdates} updated`)
    console.log('\n🎉 Migration complete!')

    process.exit(0)
}

migrateSlug().catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
})
