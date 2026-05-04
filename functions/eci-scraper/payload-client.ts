/**
 * payload-client.ts
 *
 * Thin HTTP client for the Payload REST API.
 * Finds a doc by assemblyId then PATCHes it with fresh scrape data.
 * Uses CRON_SECRET via Authorization header (Payload checks this on the
 * /api/election-results-2026 endpoint via the `access.update` function).
 */
import type { ConstituencyResult } from './scraper'

const PAYLOAD_API_URL = process.env['PAYLOAD_API_URL'] ?? 'https://indiastats.org'
const CRON_SECRET = process.env['CRON_SECRET'] ?? ''
const COLLECTION = 'election-results-2026'

interface FindResponse {
  docs: Array<{ id: string | number }>
  totalDocs: number
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CRON_SECRET}`,
  }
}

/** Find the Payload document ID for an assemblyId */
async function findDocId(assemblyId: string): Promise<string | number | null> {
  const url = `${PAYLOAD_API_URL}/api/${COLLECTION}?where%5BassemblyId%5D%5Bequals%5D=${assemblyId}&limit=1`
  const res = await fetch(url, { headers: authHeaders(), signal: AbortSignal.timeout(10_000) })
  if (!res.ok) return null
  const data = (await res.json()) as FindResponse
  return data.docs[0]?.id ?? null
}

/** PATCH a single constituency document with live counting data */
export async function updateConstituency(result: ConstituencyResult): Promise<boolean> {
  const docId = await findDocId(result.assemblyId)
  if (docId === null) return false

  const body = {
    currentRound: result.currentRound,
    totalRounds: result.totalRounds,
    status: result.status,
    margin: result.margin,
    notaVotes: result.notaVotes,
    eciLastUpdatedAt: result.eciLastUpdatedAt,
    lastScrapedAt: result.lastScrapedAt,
    parties: result.candidates.map((c) => ({
      name: c.party,
      candidateName: c.candidateName,
      votes: c.votes,
    })),
  }

  const res = await fetch(`${PAYLOAD_API_URL}/api/${COLLECTION}/${docId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })

  return res.ok
}
