/**
 * liveResults.ts
 *
 * Transforms ElectionResults2026 Payload docs into the ElectionResultsDataset
 * shape consumed by <ElectionResultsMap />.
 *
 * Zero → all 234 seats show as "PENDING" with a neutral map colour.
 * As data arrives, parties[], currentRound, totalRounds drive the live view.
 */

import type { ElectionResultsDataset, PartyTally, SeatResult } from '@/lib/electionResults'

// ── Raw shape coming out of Payload (election-results-2026 collection) ────────
export interface LiveResultDoc {
  id: string | number
  assemblyId: string
  assemblyName: string
  districtName?: string | null
  electors?: number | null
  votes?: number | null
  turnoutPercent?: number | null
  totalRounds?: number | null
  currentRound?: number | null
  status: 'pending' | 'counting' | 'leading' | 'declared'
  parties?: Array<{
    name: string
    candidateName?: string | null
    votes: number
  }> | null
}

// ── Derive SeatResult from a single doc ──────────────────────────────────────
function toSeatResult(doc: LiveResultDoc): SeatResult {
  const parties = (doc.parties ?? []).slice().sort((a, b) => b.votes - a.votes)

  const winner = parties[0]
  const runnerUp = parties[1]

  const winnerParty = winner?.name ?? ''
  const winnerVotes = winner?.votes ?? 0
  const winnerName = winner?.candidateName ?? ''

  const runnerUpParty = runnerUp?.name ?? ''
  const runnerUpVotes = runnerUp?.votes ?? 0
  const runnerUpName = runnerUp?.candidateName ?? ''

  const margin = winnerVotes - runnerUpVotes
  const totalVotes = doc.votes ?? parties.reduce((s, p) => s + p.votes, 0)

  // Derive numeric AC number from assemblyId (e.g. "ac022" → 22)
  const assemblyNo = parseInt(doc.assemblyId.replace(/^ac0*/i, ''), 10) || 0

  // Map collection status to SeatResult status
  const status: SeatResult['status'] =
    doc.status === 'declared'
      ? 'declared'
      : doc.status === 'leading'
        ? 'leading'
        : doc.status === 'counting'
          ? 'counting'
          : 'pending'

  const isTrending = status !== 'pending' && margin > 0 && margin < 3000

  return {
    assemblyId: doc.assemblyId,
    assemblyNo,
    assemblyName: doc.assemblyName,
    districtName: doc.districtName ?? 'Tamil Nadu',
    winnerName,
    winnerParty,
    winnerVotes,
    runnerUpName,
    runnerUpParty,
    runnerUpVotes,
    margin,
    totalVotes,
    status,
    isTrending,
  }
}

// ── Aggregate party tallies ───────────────────────────────────────────────────
function buildPartyTallies(results: Record<string, SeatResult>): PartyTally[] {
  const map: Record<string, PartyTally> = {}

  for (const seat of Object.values(results)) {
    if (!seat.winnerParty || seat.status === 'pending') continue

    if (!map[seat.winnerParty]) {
      map[seat.winnerParty] = {
        party: seat.winnerParty,
        seats: 0,
        leading: 0,
        total: 0,
        votes: 0,
        swing: 0,
      }
    }

    const tally = map[seat.winnerParty]!
    if (seat.status === 'declared') tally.seats++
    else if (seat.status === 'leading' || seat.status === 'counting') tally.leading++
    tally.votes += seat.winnerVotes
  }

  return Object.values(map)
    .map((t) => ({ ...t, total: t.seats + t.leading }))
    .sort((a, b) => b.total - a.total)
}

// ── Build ticker items from live data ────────────────────────────────────────
function buildTickerItems(
  results: Record<string, SeatResult>,
  declared: number,
  totalSeats: number,
): string[] {
  const items: string[] = []

  const tallies = buildPartyTallies(results)
  const leader = tallies[0]
  if (leader) {
    items.push(
      `${leader.party} leading in ${leader.total} seats${leader.total >= 118 ? ' — majority secured!' : ''}`,
    )
  }

  const trending = Object.values(results)
    .filter((r) => r.isTrending)
    .slice(0, 3)
  for (const t of trending) {
    items.push(`Close contest: ${t.assemblyName} — margin ${t.margin.toLocaleString()} votes`)
  }

  items.push(`${declared} of ${totalSeats} seats counted`)

  if (items.length === 0) {
    items.push('Counting underway across Tamil Nadu — results coming soon')
    items.push('Stay tuned for live updates from all 234 constituencies')
  }

  return items
}

// ── Main transform ─────────────────────────────────────────────────────────
export function buildLiveResultsDataset(docs: LiveResultDoc[]): ElectionResultsDataset {
  const results: Record<string, SeatResult> = {}

  for (const doc of docs) {
    const seat = toSeatResult(doc)
    results[seat.assemblyId] = seat
  }

  const allSeats = Object.values(results)
  const declared = allSeats.filter((r) => r.status === 'declared').length
  const counting = allSeats.filter((r) => r.status === 'counting' || r.status === 'leading').length
  const pending = allSeats.filter((r) => r.status === 'pending').length

  const partyTallies = buildPartyTallies(results)
  const totalSeats = allSeats.length || 234

  return {
    stateName: 'Tamil Nadu',
    stateCode: 'TN',
    electionYear: 2026,
    totalSeats,
    majorityMark: 118,
    declared,
    counting,
    pending,
    partyTallies,
    results,
    tickerItems: buildTickerItems(results, declared, totalSeats),
    lastUpdated: new Date().toISOString(),
  }
}
