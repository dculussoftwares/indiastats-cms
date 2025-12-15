#!/usr/bin/env npx tsx
/**
 * Script to migrate missing election history records (with empty candidateParty)
 * and then migrate all booths
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import payloadConfig from '../src/payload.config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateMissingHistory(payload: any) {
    console.log('\n📦 Finding and migrating missing election history records...')

    // Find records with empty or null candidate_party
    const { data: records, error } = await supabase
        .from('AssemblyHistoricDataTable_V4')
        .select('*')
        .or('candidate_party.is.null,candidate_party.eq.')

    if (error) {
        console.error('❌ Error fetching records:', error)
        return
    }

    console.log(`Found ${records?.length || 0} records with empty candidateParty`)

    let successCount = 0
    let errorCount = 0

    for (const record of records || []) {
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
                    candidateParty: record.candidate_party || '', // Allow empty
                    candidateVotes: record.candidate_votes,
                }
            })
            successCount++
        } catch (err: any) {
            errorCount++
            console.error(`❌ Error:`, err.message || err)
        }
    }

    console.log(`✅ Missing History: ${successCount} success, ${errorCount} errors`)
}

async function migrateBooths(payload: any) {
    console.log('\n📦 Migrating Booths (68k+ records)...')
    console.log('This may take several minutes...\n')

    const BATCH_SIZE = 1000
    let offset = 0
    let successCount = 0
    let errorCount = 0
    let skipCount = 0
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

        for (const booth of booths) {
            try {
                // Check if booth already exists
                const existing = await payload.find({
                    collection: 'booths',
                    where: {
                        and: [
                            { boothId: { equals: booth.boothId } },
                            { assemblyId: { equals: booth.assemblyId } }
                        ]
                    },
                    limit: 1
                })

                if (existing.docs.length > 0) {
                    skipCount++
                    continue
                }

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
                errorCount++
            }
        }

        offset += BATCH_SIZE

        // Progress update every 5000
        if (offset % 5000 === 0) {
            console.log(`  Progress: ${totalFetched} processed, ${successCount} created, ${skipCount} skipped`)
        }
    }

    console.log(`\n✅ Booths: ${successCount} created, ${skipCount} skipped, ${errorCount} errors (${totalFetched} total)`)
}

async function main() {
    console.log('🚀 Completing Data Migration\n')
    console.log('='.repeat(50))

    const payload = await getPayload({ config: payloadConfig })

    // First, migrate missing election history
    await migrateMissingHistory(payload)

    // Then migrate booths
    await migrateBooths(payload)

    console.log('\n' + '='.repeat(50))
    console.log('✅ Migration complete!')

    process.exit(0)
}

main().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
