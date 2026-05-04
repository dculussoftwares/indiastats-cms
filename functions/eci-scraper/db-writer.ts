/**
 * db-writer.ts
 *
 * Writes scrape results directly to PostgreSQL, bypassing the Payload HTTP API.
 * Used as a fallback when the Container App is under heavy election-day load
 * and PATCH requests time out.
 *
 * Table: election_results_2026
 * Payload CMS uses snake_case column names derived from camelCase field names.
 */
import { Pool } from 'pg'
import type { ConstituencyResult } from './scraper'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const uri = process.env['DATABASE_URI']
    if (!uri) throw new Error('DATABASE_URI env var not set')
    pool = new Pool({
      connectionString: uri,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return pool
}

/**
 * Upsert a constituency result into the election_results_2026 table.
 * Only updates rows that already exist (seeded by the migration script).
 */
export async function writeResultToDB(result: ConstituencyResult): Promise<boolean> {
  try {
    const db = getPool()
    const res = await db.query(
      `UPDATE election_results_2026
         SET current_round      = $1,
             total_rounds       = $2,
             status             = $3,
             margin             = $4,
             nota_votes         = $5,
             eci_last_updated_at= $6,
             last_scraped_at    = $7,
             updated_at         = NOW()
       WHERE assembly_id = $8`,
      [
        result.currentRound,
        result.totalRounds,
        result.status,
        result.margin ?? null,
        result.notaVotes ?? null,
        result.eciLastUpdatedAt || null,
        result.lastScrapedAt,
        result.assemblyId,
      ],
    )
    return (res.rowCount ?? 0) > 0
  } catch {
    return false
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
