import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { Pool } = require('../functions/node_modules/pg')

const CONN = process.env.DATABASE_URI ||
  'postgresql://dculus_admin:REDACTED_PASSWORD@dculus-shared-postgres.postgres.database.azure.com/indiastats_cms_db?sslmode=require'

const pool = new Pool({ connectionString: CONN, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

async function step(label: string, sql: string, params?: any[]) {
  process.stdout.write(`  ${label}... `)
  try {
    const r = await client.query(sql, params)
    console.log('ok', r.rowCount != null ? `(${r.rowCount} rows)` : '')
  } catch (e: any) {
    if (e.message.includes('already exists') || e.message.includes('does not exist')) {
      console.log('skipped:', e.message.split('\n')[0])
    } else {
      throw e
    }
  }
}

console.log('🔄 Migrating election_results_2026 → live_election_results\n')

await step('Create parent table', `CREATE TABLE live_election_results AS SELECT * FROM election_results_2026 WHERE 1=0`)
await step('Add year column', `ALTER TABLE live_election_results ADD COLUMN year int NOT NULL DEFAULT 2026`)
await step('Copy 2026 data', `INSERT INTO live_election_results SELECT * FROM election_results_2026`)
await step('Add PK', `ALTER TABLE live_election_results ADD PRIMARY KEY (id)`)
await step('Unique index (assembly+year+state)', `CREATE UNIQUE INDEX ler_asy_yr_st ON live_election_results (assembly_id, year, state_code)`)
await step('Index year', `CREATE INDEX ler_year ON live_election_results (year)`)
await step('Index state_code', `CREATE INDEX ler_state ON live_election_results (state_code)`)
await step('Rename enum', `ALTER TYPE enum_election_results_2026_status RENAME TO enum_live_election_results_status`)

await step('Create parties table', `CREATE TABLE live_election_results_parties AS SELECT * FROM election_results_2026_parties WHERE 1=0`)
await step('Copy party rows', `INSERT INTO live_election_results_parties SELECT * FROM election_results_2026_parties`)
await step('Parties PK', `ALTER TABLE live_election_results_parties ADD PRIMARY KEY (id)`)
await step('Parties parent index', `CREATE INDEX lerp_parent ON live_election_results_parties (_parent_id)`)
await step('Parties order index', `CREATE INDEX lerp_order ON live_election_results_parties (_order)`)
await step('Parties FK', `ALTER TABLE live_election_results_parties ADD CONSTRAINT fk_lerp_parent FOREIGN KEY (_parent_id) REFERENCES live_election_results(id) ON DELETE CASCADE`)

const { rows: [p] } = await client.query('SELECT count(*) FROM live_election_results')
const { rows: [pp] } = await client.query('SELECT count(*) FROM live_election_results_parties')

client.release()
await pool.end()

console.log(`\n✅ Done`)
console.log(`   live_election_results:         ${p.count} rows`)
console.log(`   live_election_results_parties: ${pp.count} rows`)
console.log('\n⚠️  Old tables election_results_2026 + election_results_2026_parties still exist.')
console.log('   After verifying the new tables work, run:')
console.log('   DROP TABLE election_results_2026_parties CASCADE;')
console.log('   DROP TABLE election_results_2026 CASCADE;')
