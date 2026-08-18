/**
 * One-off, additive-only fix for a schema push that hung on an interactive
 * "rename vs create" prompt in CI (adding the Authors collection / repointing
 * Posts.authors from users -> authors) and left several columns missing in
 * production, despite the deploy reporting success (the CI step is configured
 * with continue-on-error).
 *
 * This does ONLY additive changes — CREATE TABLE, ADD COLUMN, ADD CONSTRAINT.
 * It does not touch, rename, or drop anything, including the now-unused
 * `users_id` column left behind on posts_rels / _posts_v_rels.
 *
 * Kept as a record of exactly what was applied by hand on 2026-08-18 to
 * unblock scripts/assign-author.mts and scripts/expand-posts.mts, which
 * otherwise go through Payload's own Local API. Future schema changes should
 * go through Payload's push/migrate flow, not further hand-written SQL —
 * this script documents an already-applied incident fix, not a pattern to
 * repeat.
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/fix-authors-schema.mts
 */
import 'dotenv/config'
import postgres from 'postgres'

const raw = process.env.DATABASE_URI
if (!raw) throw new Error('DATABASE_URI env var is required')
// The `postgres` package chokes on the `sslrootcert` query param (libpq-specific,
// not something this driver understands); sslmode=require is kept so TLS is still
// negotiated, matching how the pre-check helpers in push-db-schema.ts connect.
const connectionString = raw.replace(/[?&]sslrootcert=[^&]*/, '')

const sql = postgres(connectionString, { max: 1, ssl: { rejectUnauthorized: false } })

async function main() {
  await sql.begin(async (tx) => {
    const [{ exists: authorsExists }] = await tx`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'authors'
      ) AS exists
    `
    if (authorsExists) {
      console.log('authors table already exists, skipping CREATE TABLE')
    } else {
      console.log('Creating authors table...')
      await tx`
        CREATE TABLE "authors" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar NOT NULL,
          "job_title" varchar,
          "bio" varchar,
          "avatar_id" integer,
          "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
          "created_at" timestamp with time zone NOT NULL DEFAULT now()
        )
      `
      await tx`
        ALTER TABLE "authors"
        ADD CONSTRAINT "authors_avatar_id_media_id_fk"
        FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL
      `
    }

    for (const table of ['posts_rels', '_posts_v_rels']) {
      const [{ exists: colExists }] = await tx`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${table} AND column_name = 'authors_id'
        ) AS exists
      `
      if (colExists) {
        console.log(`${table}.authors_id already exists, skipping`)
        continue
      }
      console.log(`Adding ${table}.authors_id...`)
      await tx.unsafe(`ALTER TABLE "${table}" ADD COLUMN "authors_id" integer`)
      await tx.unsafe(`
        ALTER TABLE "${table}"
        ADD CONSTRAINT "${table}_authors_fk"
        FOREIGN KEY ("authors_id") REFERENCES "authors"("id") ON DELETE CASCADE
      `)
    }

    // Posts.populatedAuthors array field gained jobTitle/bio sub-fields, which
    // materialize as columns on these two child tables.
    for (const table of ['posts_populated_authors', '_posts_v_version_populated_authors']) {
      for (const col of ['job_title', 'bio']) {
        const [{ exists: colExists }] = await tx`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${col}
          ) AS exists
        `
        if (colExists) {
          console.log(`${table}.${col} already exists, skipping`)
          continue
        }
        console.log(`Adding ${table}.${col}...`)
        await tx.unsafe(`ALTER TABLE "${table}" ADD COLUMN "${col}" varchar`)
      }
    }

    // Payload's document-locking feature tracks every registered collection
    // generically via this table, so it needs an authors_id column too.
    const [{ exists: lockedColExists }] = await tx`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'payload_locked_documents_rels' AND column_name = 'authors_id'
      ) AS exists
    `
    if (lockedColExists) {
      console.log('payload_locked_documents_rels.authors_id already exists, skipping')
    } else {
      console.log('Adding payload_locked_documents_rels.authors_id...')
      await tx`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "authors_id" integer`
      await tx`
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_authors_fk"
        FOREIGN KEY ("authors_id") REFERENCES "authors"("id") ON DELETE CASCADE
      `
    }
  })

  console.log('\nDone — additive changes committed.')
}

main()
  .catch((e) => {
    console.error('Failed, transaction rolled back:', e.message)
    process.exitCode = 1
  })
  .finally(() => sql.end())
