#!/usr/bin/env tsx

/**
 * Database Comparison Script
 * Compares Neon DB (production) with Azure DB to ensure Azure DB is up-to-date
 *
 * Usage: NEON_DATABASE_URI="..." AZURE_DATABASE_URI="..." pnpm exec tsx scripts/compare-databases.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

interface TableComparison {
  table_name: string
  neon_count: number
  azure_count: number
  status: 'MATCH' | 'MISMATCH' | 'MISSING' | 'EXTRA'
  difference: number
}

interface ColumnComparison {
  table_name: string
  column_name: string
  neon_type: string
  azure_type: string
  status: 'MATCH' | 'MISMATCH' | 'EXTRA_IN_AZURE' | 'MISSING_IN_AZURE'
}

const NEON_DATABASE_URI = process.env.NEON_DATABASE_URI
const AZURE_DATABASE_URI = process.env.AZURE_DATABASE_URI

if (!NEON_DATABASE_URI || !AZURE_DATABASE_URI) {
  console.error('❌ Missing environment variables:')
  console.error('   NEON_DATABASE_URI - Connection string for Neon DB')
  console.error('   AZURE_DATABASE_URI - Connection string for Azure DB')
  console.error('')
  console.error('Usage:')
  console.error('   NEON_DATABASE_URI="..." AZURE_DATABASE_URI="..." pnpm exec tsx scripts/compare-databases.ts')
  process.exit(1)
}

async function getTableCounts(
  connectionString: string,
  dbName: string
): Promise<Map<string, number>> {
  const client = postgres(connectionString)

  try {
    const result = await client`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
    `

    const counts = new Map<string, number>()

    for (const row of result) {
      const tablename = (row as any).tablename
      const countResult = await client`SELECT COUNT(*) as count FROM ${client(tablename)}`
      const count = (countResult[0] as any).count
      counts.set(tablename, count)
    }

    return counts
  } finally {
    await client.end()
  }
}

async function getTableColumns(connectionString: string): Promise<Map<string, Array<{ name: string; type: string }>>> {
  const client = postgres(connectionString)

  try {
    const result = await client`
      SELECT
        t.tablename,
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as column_type
      FROM pg_tables t
      JOIN pg_class c ON c.relname = t.tablename
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE t.schemaname = 'public'
        AND t.tablename NOT LIKE 'pg_%'
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY t.tablename, a.attnum
    `

    const columns = new Map<string, Array<{ name: string; type: string }>>()

    for (const row of result) {
      const { tablename, column_name, column_type } = row as any
      if (!columns.has(tablename)) {
        columns.set(tablename, [])
      }
      columns.get(tablename)!.push({ name: column_name, type: column_type })
    }

    return columns
  } finally {
    await client.end()
  }
}

async function main() {
  console.log('🔍 Database Comparison Tool')
  console.log('='.repeat(70))

  try {
    // Test connections
    console.log('\n📡 Testing connections...')
    try {
      const neonClient = postgres(NEON_DATABASE_URI)
      await neonClient`SELECT 1`
      await neonClient.end()
      console.log('✅ Neon DB connection: OK')
    } catch (e) {
      console.error('❌ Neon DB connection failed:', (e as Error).message)
      process.exit(1)
    }

    try {
      const azureClient = postgres(AZURE_DATABASE_URI)
      await azureClient`SELECT 1`
      await azureClient.end()
      console.log('✅ Azure DB connection: OK')
    } catch (e) {
      console.error('❌ Azure DB connection failed:', (e as Error).message)
      process.exit(1)
    }

    // Compare table row counts
    console.log('\n📊 Comparing Table Row Counts...')
    console.log('-'.repeat(70))

    const neonCounts = await getTableCounts(NEON_DATABASE_URI, 'Neon')
    const azureCounts = await getTableCounts(AZURE_DATABASE_URI, 'Azure')

    const tableComparisons: TableComparison[] = []
    const allTables = new Set([...neonCounts.keys(), ...azureCounts.keys()])

    for (const table of Array.from(allTables).sort()) {
      const neonCount = neonCounts.get(table) ?? 0
      const azureCount = azureCounts.get(table) ?? 0

      let status: 'MATCH' | 'MISMATCH' | 'MISSING' | 'EXTRA' = 'MATCH'
      if (neonCount === 0 && azureCount === 0) {
        status = 'MATCH'
      } else if (!neonCounts.has(table)) {
        status = 'EXTRA'
      } else if (!azureCounts.has(table)) {
        status = 'MISSING'
      } else if (neonCount !== azureCount) {
        status = 'MISMATCH'
      }

      tableComparisons.push({
        table_name: table,
        neon_count: neonCount,
        azure_count: azureCount,
        status,
        difference: azureCount - neonCount,
      })
    }

    // Display table results
    for (const comp of tableComparisons) {
      const icon = comp.status === 'MATCH' ? '✅' : comp.status === 'MISMATCH' ? '⚠️' : '❌'
      console.log(
        `${icon} ${comp.table_name.padEnd(35)} Neon: ${comp.neon_count.toString().padStart(6)} | Azure: ${comp.azure_count.toString().padStart(6)} (Δ ${comp.difference > 0 ? '+' : ''}${comp.difference})`
      )
    }

    // Compare columns
    console.log('\n🗂️  Comparing Column Schemas...')
    console.log('-'.repeat(70))

    const neonColumns = await getTableColumns(NEON_DATABASE_URI)
    const azureColumns = await getTableColumns(AZURE_DATABASE_URI)

    const columnMismatches: ColumnComparison[] = []

    for (const [table, neonCols] of neonColumns) {
      const azureCols = azureColumns.get(table) ?? []

      // Check for missing or mismatched columns
      for (const neonCol of neonCols) {
        const azureCol = azureCols.find(c => c.name === neonCol.name)
        if (!azureCol) {
          columnMismatches.push({
            table_name: table,
            column_name: neonCol.name,
            neon_type: neonCol.type,
            azure_type: 'MISSING',
            status: 'MISSING_IN_AZURE',
          })
        } else if (neonCol.type !== azureCol.type) {
          columnMismatches.push({
            table_name: table,
            column_name: neonCol.name,
            neon_type: neonCol.type,
            azure_type: azureCol.type,
            status: 'MISMATCH',
          })
        }
      }

      // Check for extra columns in Azure
      for (const azureCol of azureCols) {
        const neonCol = neonCols.find(c => c.name === azureCol.name)
        if (!neonCol) {
          columnMismatches.push({
            table_name: table,
            column_name: azureCol.name,
            neon_type: 'MISSING',
            azure_type: azureCol.type,
            status: 'EXTRA_IN_AZURE',
          })
        }
      }
    }

    if (columnMismatches.length === 0) {
      console.log('✅ All column schemas match perfectly!')
    } else {
      for (const mismatch of columnMismatches) {
        const icon = mismatch.status === 'MISMATCH' ? '⚠️' : '❌'
        console.log(`\n${icon} ${mismatch.table_name}.${mismatch.column_name}`)
        console.log(`   Neon:  ${mismatch.neon_type}`)
        console.log(`   Azure: ${mismatch.azure_type}`)
      }
    }

    // Summary
    console.log('\n📈 Summary')
    console.log('='.repeat(70))

    const matchCount = tableComparisons.filter(t => t.status === 'MATCH').length
    const mismatchCount = tableComparisons.filter(t => t.status === 'MISMATCH').length
    const missingCount = tableComparisons.filter(t => t.status === 'MISSING').length
    const extraCount = tableComparisons.filter(t => t.status === 'EXTRA').length

    console.log(`Total Tables: ${tableComparisons.length}`)
    console.log(`✅ Matching tables: ${matchCount}`)
    if (mismatchCount > 0) console.log(`⚠️  Mismatched row counts: ${mismatchCount}`)
    if (missingCount > 0) console.log(`❌ Missing in Azure: ${missingCount}`)
    if (extraCount > 0) console.log(`❌ Extra in Azure: ${extraCount}`)
    if (columnMismatches.length > 0) console.log(`❌ Column schema issues: ${columnMismatches.length}`)

    const isReady = mismatchCount === 0 && missingCount === 0 && extraCount === 0 && columnMismatches.length === 0
    console.log(`\n${isReady ? '✅ READY: Azure DB is in sync with Neon DB!' : '❌ NOT READY: Azure DB needs attention before switching'}`)

    if (!isReady) {
      console.log('\n📋 Next Steps:')
      if (missingCount > 0) {
        console.log('  1. Tables missing in Azure - May need schema sync')
      }
      if (mismatchCount > 0) {
        console.log('  2. Row counts differ - Need to sync data')
      }
      if (columnMismatches.length > 0) {
        console.log('  3. Column mismatches - May need schema migrations')
      }
    }

    process.exit(isReady ? 0 : 1)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
