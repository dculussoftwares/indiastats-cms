/**
 * Remove the `dev` / batch=-1 bookkeeping row from payload_migrations, left
 * over from when this project used `push` (pushDevSchema) instead of real
 * migrations. Its only effect is that `payload migrate` asks an interactive
 * "you've used dev mode, proceed?" confirmation on every run — a problem in
 * CI, which can't answer it. Confirmed from @payloadcms/drizzle's migrate.js:
 * answering that prompt only filters this row out of an in-memory list for
 * that run's bookkeeping; it never touches application data. Removing the
 * row directly here has the same effect, permanently, via Payload's own
 * Local API — no raw SQL, no other rows or tables touched.
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/clear-dev-migration-marker.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'payload-migrations',
    where: { batch: { equals: -1 } },
  })

  if (!existing.docs.length) {
    console.log('No dev marker row found, nothing to do.')
    process.exit(0)
  }

  for (const doc of existing.docs) {
    console.log(`Deleting payload-migrations row: name=${doc.name} batch=${doc.batch} id=${doc.id}`)
    await payload.delete({ collection: 'payload-migrations', id: doc.id })
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
