/**
 * Migration Script: Add stateCode to Existing Tamil Nadu Data
 * 
 * This script updates all existing records in the database to have stateCode = 'TN'
 * Run this after adding the stateCode field to collections.
 * 
 * Usage: npx tsx scripts/migrate-state-code.ts
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'

const COLLECTIONS_TO_MIGRATE = [
    'districts',
    'assemblies',
    'booths',
    'election-history',
    'alliances',
    'caste-census',
] as const

async function migrateStateCode() {
    console.log('🚀 Starting stateCode migration...\n')

    const payload = await getPayload({ config })

    for (const collectionSlug of COLLECTIONS_TO_MIGRATE) {
        console.log(`📦 Migrating ${collectionSlug}...`)

        try {
            // Count records that need migration
            const records = await payload.find({
                collection: collectionSlug,
                where: {
                    or: [
                        { stateCode: { exists: false } },
                        { stateCode: { equals: '' } },
                        { stateCode: { equals: null } },
                    ],
                },
                limit: 0, // Just get count
            })

            const totalToUpdate = records.totalDocs
            console.log(`   Found ${totalToUpdate} records without stateCode`)

            if (totalToUpdate === 0) {
                console.log(`   ✅ No migration needed\n`)
                continue
            }

            // Update in batches
            const BATCH_SIZE = 100
            let updated = 0

            while (updated < totalToUpdate) {
                const batch = await payload.find({
                    collection: collectionSlug,
                    where: {
                        or: [
                            { stateCode: { exists: false } },
                            { stateCode: { equals: '' } },
                            { stateCode: { equals: null } },
                        ],
                    },
                    limit: BATCH_SIZE,
                })

                for (const doc of batch.docs) {
                    await payload.update({
                        collection: collectionSlug,
                        id: doc.id,
                        data: {
                            stateCode: 'TN',
                        },
                    })
                    updated++
                }

                console.log(`   Updated ${updated}/${totalToUpdate}`)
            }

            console.log(`   ✅ Completed ${collectionSlug}\n`)
        } catch (error) {
            console.error(`   ❌ Error migrating ${collectionSlug}:`, error)
        }
    }

    console.log('🎉 Migration complete!')
    process.exit(0)
}

// Create initial Tamil Nadu state record
async function createTamilNaduState() {
    console.log('\n📍 Creating Tamil Nadu state record...')

    const payload = await getPayload({ config })

    try {
        // Check if already exists
        const existing = await payload.find({
            collection: 'states',
            where: { stateCode: { equals: 'TN' } },
            limit: 1,
        })

        if (existing.docs.length > 0) {
            console.log('   ✅ Tamil Nadu state record already exists\n')
            return
        }

        await payload.create({
            collection: 'states',
            data: {
                stateCode: 'TN',
                slug: 'tamil-nadu',
                name: 'Tamil Nadu',
                majorParties: [
                    { partyCode: 'DMK' },
                    { partyCode: 'AIADMK' },
                    { partyCode: 'PMK' },
                    { partyCode: 'BJP' },
                    { partyCode: 'INC' },
                ],
                blocs: [
                    {
                        blocName: 'DMK Bloc',
                        parties: [
                            { partyCode: 'DMK' },
                            { partyCode: 'INC' },
                            { partyCode: 'VCK' },
                            { partyCode: 'CPI' },
                            { partyCode: 'CPI(M)' },
                            { partyCode: 'MDMK' },
                        ],
                        leaderImage: '/images/Stalin.png',
                        color: '#E7191E',
                    },
                    {
                        blocName: 'AIADMK Bloc',
                        parties: [
                            { partyCode: 'AIADMK' },
                            { partyCode: 'BJP' },
                            { partyCode: 'PMK' },
                            { partyCode: 'DMDK' },
                        ],
                        leaderImage: '/images/EPS.jpg',
                        color: '#10663D',
                    },
                ],
                partyColors: {
                    DMK: '#E7191E',
                    AIADMK: '#10663D',
                    BJP: '#FF9933',
                    INC: '#00BFFF',
                    PMK: '#FFCC00',
                    CPI: '#CC0000',
                    VCK: '#FFA500',
                },
                leaderImages: {
                    DMK: '/images/Stalin.png',
                    AIADMK: '/images/EPS.jpg',
                    BJP: '/images/modi.png',
                    INC: '/images/karkae.jpg',
                },
                mapGeoJson: '/geojson/tamil-nadu-assemblies.json',
            },
        })

        console.log('   ✅ Tamil Nadu state record created\n')
    } catch (error) {
        console.error('   ❌ Error creating Tamil Nadu state:', error)
    }
}

// Main execution
async function main() {
    await migrateStateCode()
    await createTamilNaduState()
}

main().catch(console.error)
