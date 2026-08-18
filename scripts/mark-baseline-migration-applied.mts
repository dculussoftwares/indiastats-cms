/**
 * One-time step when adopting Payload migrations on a database that was
 * previously managed by `push` (pushDevSchema) and already matches the
 * current schema: `migrate:create` always diffs against an empty baseline
 * when no prior migration exists, so the generated initial migration's up()
 * is a full "create everything from scratch" script that would fail against
 * a database that already has these tables.
 *
 * This records the initial migration as already applied — via Payload's own
 * Local API, not raw SQL — without running its up(). Every migration after
 * this one is a real incremental diff and runs normally via `payload migrate`.
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/mark-baseline-migration-applied.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { migrations } from '../migrations/index'

const BATCH = 1

async function main() {
  const payload = await getPayload({ config })

  for (const migration of migrations) {
    const existing = await payload.find({
      collection: 'payload-migrations',
      where: { name: { equals: migration.name } },
      limit: 1,
    })

    if (existing.docs[0]) {
      console.log(`Already recorded: ${migration.name}`)
      continue
    }

    await payload.create({
      collection: 'payload-migrations',
      data: { name: migration.name, batch: BATCH },
    })
    console.log(`Recorded as applied: ${migration.name}`)
  }

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
