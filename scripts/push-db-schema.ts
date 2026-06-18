/**
 * Push Payload schema changes to the database.
 * This ensures new columns exist before `next build` prerenders pages.
 * Used in CI to sync schema with production DB via a direct PostgreSQL connection
 * (DATABASE_URI must point to the DB directly, NOT to PgBouncer — Drizzle advisory
 * locks used during push are session-scoped and break under PgBouncer transaction mode).
 */
import postgres from 'postgres'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Tables created via "CREATE TABLE AS SELECT ... WHERE 1=0" lose their serial
 * sequences — the id column becomes plain integer with no DEFAULT nextval().
 * Drizzle detects this as drift and generates invalid SQL:
 *   ALTER COLUMN "id" SET DATA TYPE serial   ← not valid PostgreSQL syntax
 *
 * Fix: find any id columns missing a sequence and attach one before the push,
 * so Drizzle sees them as serial and generates no diff.
 */
async function fixMissingSerialSequences(connectionString: string) {
  const sql = postgres(connectionString, { max: 1, ssl: { rejectUnauthorized: false } })
  try {
    // Find public-schema tables whose id column has no DEFAULT (i.e. missing sequence)
    const affected = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name   = 'id'
        AND data_type     = 'integer'
        AND column_default IS NULL
    `
    for (const { table_name } of affected) {
      const seq = `${table_name}_id_seq`
      console.log(`  Attaching sequence ${seq} to ${table_name}.id ...`)
      // Create the sequence owned by the column so Drizzle recognises it as serial
      await sql.unsafe(`CREATE SEQUENCE IF NOT EXISTS "${seq}" OWNED BY "${table_name}".id`)
      // Advance the sequence past the current max id so inserts don't collide
      await sql.unsafe(
        `SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM "${table_name}"), 0))`
      )
      await sql.unsafe(
        `ALTER TABLE "${table_name}" ALTER COLUMN id SET DEFAULT nextval('${seq}')`
      )
    }
    if (affected.length === 0) {
      console.log('  All id columns already have sequences — nothing to fix.')
    }
  } finally {
    await sql.end()
  }
}

async function pushSchema() {
  const connectionString = process.env.DATABASE_URI || ''
  console.log('Pre-check: fixing any id columns missing serial sequences...')
  await fixMissingSerialSequences(connectionString)

  console.log('Pushing schema to database...')
  const payload = await getPayload({ config })
  console.log('Schema push complete.')
  process.exit(0)
}

pushSchema().catch((e) => {
  console.error('Schema push failed:', e.message)
  process.exit(1) // fail the CI step — do not deploy with a stale schema
})
