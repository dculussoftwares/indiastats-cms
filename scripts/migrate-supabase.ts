#!/usr/bin/env npx tsx
/**
 * Migration script to copy data from Supabase to PayloadCMS
 * 
 * Usage:
 *   pnpm exec tsx scripts/migrate-supabase.ts
 * 
 * Required environment variables (add to .env):
 *   SUPABASE_URL=your_supabase_url
 *   SUPABASE_ANON_KEY=your_supabase_anon_key
 */

// Load environment variables FIRST before any other imports
import 'dotenv/config'

import { getPayload } from 'payload'
import payloadConfig from '../src/payload.config'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateAssemblies(payload: any) {
    console.log('\n📦 Migrating Assemblies...')

    const { data: assemblies, error } = await supabase
        .from('AssemblyDataTable')
        .select('*')

    if (error) {
        console.error('❌ Error fetching assemblies:', error)
        return
    }

    console.log(`Found ${assemblies?.length || 0} assemblies to migrate`)

    let successCount = 0
    let errorCount = 0

    for (const assembly of assemblies || []) {
        try {
            // Check if already exists
            const existing = await payload.find({
                collection: 'assemblies',
                where: { assemblyId: { equals: assembly.assemblyId } },
                limit: 1
            })

            if (existing.docs.length > 0) {
                // Update existing
                await payload.update({
                    collection: 'assemblies',
                    id: existing.docs[0].id,
                    data: {
                        assemblyId: assembly.assemblyId,
                        name: assembly.name,
                        districtName: assembly.districtName,
                        noOfBooths: assembly.noOfBooths || 0,
                        electedMla: assembly.electedMla,
                        voters: assembly.voters,
                        lastElectionVoters: assembly.lastElectionVoters,
                    }
                })
            } else {
                // Create new
                await payload.create({
                    collection: 'assemblies',
                    data: {
                        assemblyId: assembly.assemblyId,
                        name: assembly.name,
                        districtName: assembly.districtName,
                        noOfBooths: assembly.noOfBooths || 0,
                        electedMla: assembly.electedMla,
                        voters: assembly.voters,
                        lastElectionVoters: assembly.lastElectionVoters,
                    }
                })
            }
            successCount++
        } catch (err) {
            console.error(`❌ Error migrating assembly ${assembly.assemblyId}:`, err)
            errorCount++
        }
    }

    console.log(`✅ Assemblies: ${successCount} success, ${errorCount} errors`)
}

async function migrateDistricts(payload: any) {
    console.log('\n📦 Migrating Districts...')

    // Get unique districts from assemblies
    const { data: assemblies, error } = await supabase
        .from('AssemblyDataTable')
        .select('districtName')

    if (error) {
        console.error('❌ Error fetching districts:', error)
        return
    }

    // Extract unique districts with their IDs
    const districtMap = new Map<string, string>()
    assemblies?.forEach((a: any) => {
        const districtName = a.districtName
        if (!districtMap.has(districtName)) {
            // Generate districtId from index (dt1, dt2, etc.)
            const id = `dt${districtMap.size + 1}`
            districtMap.set(districtName, id)
        }
    })

    console.log(`Found ${districtMap.size} unique districts`)

    let successCount = 0
    let errorCount = 0

    for (const [districtName, districtId] of districtMap) {
        try {
            // Check if already exists
            const existing = await payload.find({
                collection: 'districts',
                where: { districtId: { equals: districtId } },
                limit: 1
            })

            if (existing.docs.length === 0) {
                await payload.create({
                    collection: 'districts',
                    data: {
                        districtId,
                        districtName,
                    }
                })
                successCount++
            } else {
                successCount++ // Already exists
            }
        } catch (err) {
            console.error(`❌ Error migrating district ${districtName}:`, err)
            errorCount++
        }
    }

    console.log(`✅ Districts: ${successCount} success, ${errorCount} errors`)
}

async function migrateBooths(payload: any) {
    console.log('\n📦 Migrating Booths...')

    // Fetch booths in batches due to large dataset
    const BATCH_SIZE = 1000
    let offset = 0
    let successCount = 0
    let errorCount = 0
    let totalFetched = 0

    while (true) {
        const { data: booths, error } = await supabase
            .from('BoothDataTable')
            .select('*')
            .range(offset, offset + BATCH_SIZE - 1)

        if (error) {
            console.error('❌ Error fetching booths:', error)
            break
        }

        if (!booths || booths.length === 0) {
            break
        }

        totalFetched += booths.length
        console.log(`Processing batch: ${offset} - ${offset + booths.length}`)

        for (const booth of booths) {
            try {
                // Create booth (no unique check to speed up migration)
                await payload.create({
                    collection: 'booths',
                    data: {
                        boothId: booth.boothId,
                        assemblyId: booth.assemblyId,
                        districtId: booth.districtId,
                        wardAddress: booth.wardAddress,
                        pdfLink: booth.pdfLink,
                        streetName: booth.streetName,
                    }
                })
                successCount++
            } catch (err: any) {
                // Silently skip duplicates
                if (!err.message?.includes('duplicate')) {
                    errorCount++
                }
            }
        }

        offset += BATCH_SIZE

        // Progress update
        if (offset % 10000 === 0) {
            console.log(`  Progress: ${totalFetched} booths processed`)
        }
    }

    console.log(`✅ Booths: ${successCount} success, ${errorCount} errors (${totalFetched} total fetched)`)
}

async function migrateElectionHistory(payload: any) {
    console.log('\n📦 Migrating Election History (from AssemblyHistoricDataTable_V4)...')

    // Fetch election history in batches
    const BATCH_SIZE = 1000
    let offset = 0
    let successCount = 0
    let errorCount = 0
    let totalFetched = 0

    while (true) {
        const { data: records, error } = await supabase
            .from('AssemblyHistoricDataTable_V4')
            .select('*')
            .range(offset, offset + BATCH_SIZE - 1)

        if (error) {
            console.error('❌ Error fetching election history:', error)
            break
        }

        if (!records || records.length === 0) {
            break
        }

        totalFetched += records.length
        console.log(`Processing batch: ${offset} - ${offset + records.length}`)

        for (const record of records) {
            try {
                await payload.create({
                    collection: 'election-history',
                    data: {
                        assemblyId: record.assembly_id,
                        assemblyName: record.assembly_name,
                        assemblyNo: record.assembly_no,
                        electionYear: record.election_year,
                        totalVoters: record.total_voters,
                        votesPolled: record.votes_polled,
                        candidateName: record.candidate_name,
                        candidateParty: record.candidate_party,
                        candidateVotes: record.candidate_votes,
                    }
                })
                successCount++
            } catch (err: any) {
                errorCount++
                if (errorCount < 5) {
                    console.error(`❌ Error creating election history record:`, err.message || err)
                }
            }
        }

        offset += BATCH_SIZE

        // Progress update
        if (offset % 5000 === 0) {
            console.log(`  Progress: ${totalFetched} records processed`)
        }
    }

    console.log(`✅ Election History: ${successCount} success, ${errorCount} errors (${totalFetched} total fetched)`)
}

async function main() {
    console.log('🚀 Starting Supabase to PayloadCMS Migration\n')
    console.log('='.repeat(50))

    // Initialize Payload
    const payload = await getPayload({ config: payloadConfig })

    // Run migrations
    await migrateAssemblies(payload)
    await migrateDistricts(payload)
    await migrateElectionHistory(payload)

    // Ask before migrating booths (large dataset)
    const args = process.argv.slice(2)
    if (args.includes('--include-booths')) {
        await migrateBooths(payload)
    } else {
        console.log('\n⚠️  Skipping booths migration (large dataset). Use --include-booths flag to include.')
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Migration complete!')

    process.exit(0)
}

main().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
