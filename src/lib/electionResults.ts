/**
 * Election Results data types and dummy data for the TV-mode results page.
 * Replace DUMMY_RESULTS with a real API/Payload query when live data is available.
 */

export type SeatResult = {
  assemblyId: string // e.g. "ac001"
  assemblyNo: number // 1–234
  assemblyName: string
  districtName: string
  winnerName: string
  winnerParty: string
  winnerVotes: number
  runnerUpName: string
  runnerUpParty: string
  runnerUpVotes: number
  margin: number
  totalVotes: number
  status: 'declared' | 'leading' | 'counting' | 'pending'
  isTrending: boolean // big swing / surprise
}

export type PartyTally = {
  party: string
  seats: number
  leading: number
  total: number // seats + leading
  votes: number
  swing: number // % swing vs last election (+ means gain)
}

export type ElectionResultsDataset = {
  stateName: string
  stateCode: string
  electionYear: number
  totalSeats: number
  majorityMark: number
  declared: number
  counting: number
  pending: number
  partyTallies: PartyTally[]
  results: Record<string, SeatResult> // keyed by assemblyId
  tickerItems: string[]
  lastUpdated: string
}

// ─── Dummy data (234 TN assemblies — only first 60 have detailed results,
//     the rest are "counting" or "pending" to simulate a live count) ──────────

const PARTIES = ['DMK', 'ADMK', 'INC', 'BJP', 'PMK', 'VCK', 'CPM', 'CPI', 'DMDK', 'NTK']

const DISTRICTS: Record<number, string> = {
  1: 'Tiruvallur',
  2: 'Tiruvallur',
  3: 'Tiruvallur',
  4: 'Tiruvallur',
  5: 'Tiruvallur',
  6: 'Tiruvallur',
  7: 'Tiruvallur',
  8: 'Tiruvallur',
  9: 'Tiruvallur',
  10: 'Chennai',
  11: 'Chennai',
  12: 'Chennai',
  13: 'Chennai',
  14: 'Chennai',
  15: 'Chennai',
  16: 'Chennai',
  17: 'Chennai',
  18: 'Chennai',
  19: 'Chennai',
  20: 'Chennai',
  21: 'Chennai',
  22: 'Chennai',
  23: 'Chennai',
  24: 'Chennai',
  25: 'Chennai',
  26: 'Chennai',
  27: 'Chennai',
  28: 'Kancheepuram',
  29: 'Kancheepuram',
  30: 'Kancheepuram',
  31: 'Kancheepuram',
  32: 'Chengalpattu',
  33: 'Chengalpattu',
  34: 'Chengalpattu',
  35: 'Chengalpattu',
  36: 'Chengalpattu',
  37: 'Kancheepuram',
  38: 'Vellore',
  39: 'Vellore',
  40: 'Vellore',
}

const NAMES: Record<string, string[]> = {
  DMK: [
    'M.K.Stalin Jr.',
    'Udhayanidhi P.',
    'A.Raja Sekar',
    'Kanimozhi V.',
    'R.S.Bharathi',
    'I.Periyasamy',
  ],
  ADMK: ['Edappadi K.', 'O.Panneerselvam', 'R.B.Udhayakumar', 'C.Ve.Shanmugam', 'M.Thambidurai'],
  INC: ['P.Chidambaram Jr.', 'K.Selvaperunthagai', 'EVKS Elangovan'],
  BJP: ['Annamalai K.', 'L.Murugan', 'Tamilisai S.'],
  PMK: ['Anbumani R.', 'G.K.Mani'],
  VCK: ['Thol.Thirumavalavan', 'D.Ravikumar'],
  CPM: ['N.Nanmaran', 'K.Balakrishnan'],
  CPI: ['R.Mutharasan', 'D.Pandian'],
  DMDK: ['Vijayakanth Jr.', 'Premalatha V.'],
  NTK: ['Seeman', 'Natarajan R.'],
}

function pickName(party: string, seed: number): string {
  const list = NAMES[party] ?? ['Unknown Candidate']
  return list[seed % list.length] ?? 'Unknown Candidate'
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateResult(ac: number): SeatResult {
  const r = (offset: number) => seededRandom(ac * 17 + offset)

  // Seat-level winner allocation — DMK alliance dominant
  const winnerPartyIdx = r(1) < 0.52 ? 0 : r(2) < 0.35 ? 1 : Math.floor(r(3) * 8) + 2
  const winnerParty = PARTIES[Math.min(winnerPartyIdx, PARTIES.length - 1)] ?? 'DMK'
  const runnerUpPartyIdx = (winnerPartyIdx + 1 + Math.floor(r(4) * 3)) % PARTIES.length
  const runnerUpParty = PARTIES[runnerUpPartyIdx] ?? 'ADMK'

  const totalVotes = Math.floor(80000 + r(5) * 60000)
  const winnerVotes = Math.floor(totalVotes * (0.38 + r(6) * 0.22))
  const runnerUpVotes = Math.floor(totalVotes * (0.25 + r(7) * 0.18))
  const margin = winnerVotes - runnerUpVotes
  const status: SeatResult['status'] =
    ac <= 60 ? 'declared' : ac <= 120 ? 'leading' : ac <= 180 ? 'counting' : 'pending'

  return {
    assemblyId: `ac${String(ac).padStart(3, '0')}`,
    assemblyNo: ac,
    assemblyName: `Assembly ${ac}`,
    districtName: DISTRICTS[ac] ?? 'Tamil Nadu',
    winnerName: pickName(winnerParty, ac),
    winnerParty,
    winnerVotes,
    runnerUpName: pickName(runnerUpParty, ac + 100),
    runnerUpParty,
    runnerUpVotes,
    margin,
    totalVotes,
    status,
    isTrending: r(8) > 0.88,
  }
}

function buildTallies(results: Record<string, SeatResult>): PartyTally[] {
  const map: Record<string, PartyTally> = {}

  for (const r of Object.values(results)) {
    if (!map[r.winnerParty]) {
      map[r.winnerParty] = {
        party: r.winnerParty,
        seats: 0,
        leading: 0,
        total: 0,
        votes: 0,
        swing: 0,
      }
    }
    const t = map[r.winnerParty]!
    if (r.status === 'declared') t.seats++
    else if (r.status === 'leading') t.leading++
    t.votes += r.winnerVotes
  }

  return Object.values(map)
    .map((t) => ({
      ...t,
      total: t.seats + t.leading,
      swing: +(seededRandom(t.party.length * 13) * 14 - 5).toFixed(1),
    }))
    .sort((a, b) => b.total - a.total)
}

function buildDataset(): ElectionResultsDataset {
  const results: Record<string, SeatResult> = {}
  for (let ac = 1; ac <= 234; ac++) {
    const r = generateResult(ac)
    results[r.assemblyId] = r
  }

  const declared = Object.values(results).filter((r) => r.status === 'declared').length
  const counting = Object.values(results).filter((r) => r.status === 'counting').length
  const pending = Object.values(results).filter((r) => r.status === 'pending').length

  return {
    stateName: 'Tamil Nadu',
    stateCode: 'TN',
    electionYear: 2026,
    totalSeats: 234,
    majorityMark: 118,
    declared,
    counting,
    pending,
    partyTallies: buildTallies(results),
    results,
    tickerItems: [
      '🟢 DMK leading in 128 seats — majority within reach',
      '🔴 ADMK holds fort in 47 constituencies',
      '🔵 BJP gains ground in northern districts',
      '⚡ Surprise result in Coimbatore North — NTK leads by 312 votes',
      '📊 Voter turnout: 74.3% — highest since 1996',
      '🔁 Chennai Central: recount ordered in 3 seats',
      '🟡 PMK sweeps Villupuram with 4/5 seats',
      '📍 Trending: Vellore constituency — margin under 200',
      '🏆 Independent candidate leads in Theni by 1,842 votes',
    ],
    lastUpdated: new Date().toISOString(),
  }
}

export const DUMMY_RESULTS: ElectionResultsDataset = buildDataset()
