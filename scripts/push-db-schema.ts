/**
 * Push Payload schema changes to the database.
 * This ensures new columns exist before `next build` prerenders pages.
 * Used in Docker build to sync schema with production DB.
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
  console.error('Schema push failed (non-fatal):', e.message)
  process.exit(0) // non-fatal — build should still attempt
})
