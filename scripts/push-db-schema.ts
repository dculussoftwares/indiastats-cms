/**
 * Push Payload schema changes to the database.
 * This ensures new columns exist before `next build` prerenders pages.
 * Used in CI to sync schema with production DB via a direct PostgreSQL connection
 * (DATABASE_URI must point to the DB directly, NOT to PgBouncer — Drizzle advisory
 * locks used during push are session-scoped and break under PgBouncer transaction mode).
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function pushSchema() {
  console.log('Pushing schema to database...')
  const payload = await getPayload({ config })
  console.log('Schema push complete.')
  process.exit(0)
}

pushSchema().catch((e) => {
  console.error('Schema push failed:', e.message)
  process.exit(1) // fail the CI step — do not deploy with a stale schema
})
