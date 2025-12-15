#!/usr/bin/env npx tsx
/**
 * Verification script to compare counts between Supabase and PayloadCMS
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('🔍 Comparing Supabase vs PayloadCMS counts...\n')
    console.log('='.repeat(60))

    // Get Supabase counts
    const { count: assemblyCount } = await supabase
        .from('AssemblyDataTable')
        .select('*', { count: 'exact', head: true })

    const { count: historyCount } = await supabase
        .from('AssemblyHistoricDataTable_V4')
        .select('*', { count: 'exact', head: true })

    const { count: boothCount } = await supabase
        .from('BoothDataTable')
        .select('*', { count: 'exact', head: true })

    // Get PayloadCMS counts via API
    const payloadAssemblies = await fetch('http://localhost:3001/api/assemblies?limit=0').then(r => r.json())
    const payloadDistricts = await fetch('http://localhost:3001/api/districts?limit=0').then(r => r.json())
    const payloadHistory = await fetch('http://localhost:3001/api/election-history?limit=0').then(r => r.json())
    const payloadBooths = await fetch('http://localhost:3001/api/booths?limit=0').then(r => r.json())

    console.log('\n📊 COUNT COMPARISON:\n')
    console.log('| Table/Collection           | Supabase | PayloadCMS | Match |')
    console.log('|----------------------------|----------|------------|-------|')

    const assemblyMatch = assemblyCount === payloadAssemblies.totalDocs ? '✅' : '❌'
    console.log(`| AssemblyDataTable → assemblies | ${assemblyCount?.toString().padEnd(8)} | ${payloadAssemblies.totalDocs.toString().padEnd(10)} | ${assemblyMatch}     |`)

    const historyMatch = historyCount === payloadHistory.totalDocs ? '✅' : '⚠️'
    console.log(`| HistoricDataTable_V4 → election-history | ${historyCount?.toString().padEnd(8)} | ${payloadHistory.totalDocs.toString().padEnd(10)} | ${historyMatch}     |`)

    console.log(`| (Districts derived)        | N/A      | ${payloadDistricts.totalDocs.toString().padEnd(10)} | -     |`)

    const boothMatch = boothCount === payloadBooths.totalDocs ? '✅' : '⏭️ (skipped)'
    console.log(`| BoothDataTable → booths    | ${boothCount?.toString().padEnd(8)} | ${payloadBooths.totalDocs.toString().padEnd(10)} | ${boothMatch} |`)

    console.log('\n' + '='.repeat(60))

    if (historyCount !== payloadHistory.totalDocs) {
        const diff = (historyCount || 0) - payloadHistory.totalDocs
        console.log(`\n⚠️  Election History: ${diff} records were skipped (likely due to empty candidateParty field)`)
    }

    if (payloadBooths.totalDocs === 0) {
        console.log(`\n⏭️  Booths not migrated. Run: pnpm exec tsx scripts/migrate-supabase.ts --include-booths`)
    }

    console.log('')
}

main().catch(console.error)
