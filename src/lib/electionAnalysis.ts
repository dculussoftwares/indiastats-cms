import { getPayload } from 'payload'
import config from '@payload-config'

// ─── Types (re-exported for use across the app) ───────────────────────────────

export interface PartyVoteShare {
  party: string
  votes: number
  votePct: number
  prevVotes: number
  prevVotePct: number
  seats: number
  avgMargin: number
  minMargin: number
  maxMargin: number
}

export interface SeatFlip {
  from: string
  to: string
  count: number
  assemblies: {
    assemblyId: string
    assemblyName: string
    assemblySlug: string
    districtName: string
    districtSlug: string
    winner: { name: string; party: string; votes: number }
    margin: number
    marginPct: number
    turnoutPct: number
  }[]
}

export interface ConstituencyResult {
  assemblyId: string
  assemblyName: string
  assemblySlug: string
  districtName: string
  districtSlug: string
  winner: { name: string; party: string; votes: number }
  runnerUp: { name: string; party: string; votes: number }
  margin: number
  marginPct: number
  totalElectors: number
  votesPolled: number
  turnoutPct: number
  numCandidates: number
}

export interface WaveDataPoint {
  year: number
  [party: string]: number
}

export interface DistrictGenderProfile {
  districtName: string
  districtSlug: string
  totalElectors: number
  femalePct: number
  malePct: number
  dominantParty: string
}

export interface LostDeposit {
  party: string
  lost: number // candidates who forfeited deposit (votes ≤ 1/6 of valid votes polled)
  total: number // total candidates fielded by this party
  lostPct: number // % of party candidates who lost deposit
  assemblies: {
    // constituencies where this party had a candidate lose their deposit
    assemblyId: string
    assemblyName: string
    assemblySlug: string
    districtName: string
    districtSlug: string
    candidateName: string
    votes: number
    votePct: number
  }[]
}

export interface SecondPlace {
  party: string
  count: number // number of 2nd place finishes
  total: number // total candidates fielded by this party
  secondPct: number // % of party's candidates who placed 2nd
  assemblies: {
    assemblyId: string
    assemblyName: string
    assemblySlug: string
    districtName: string
    districtSlug: string
    candidateName: string
    votes: number
    votePct: number
  }[]
}

export interface ThirdPlace {
  party: string
  count: number // number of 3rd place finishes
  total: number // total candidates fielded by this party
  thirdPct: number // % of party's candidates who placed 3rd
  assemblies: {
    assemblyId: string
    assemblyName: string
    assemblySlug: string
    districtName: string
    districtSlug: string
    candidateName: string
    votes: number
    votePct: number
  }[]
}

export interface ElectionAnalysisResponse {
  year: number
  prevYear: number | null
  stateCode: string
  summary: {
    totalElectors: number
    votesPolled: number
    turnoutPct: number
    prevTurnoutPct: number | null
    turnoutDelta: number | null
    totalSeats: number
    majorityMark: number
    closestMargin: number
    closestConstituency: string
    closestWinnerParty: string
    closestRunnerParty: string
    biggestMargin: number
    biggestConstituency: string
    biggestWinnerParty: string
  }
  partyVoteShares: PartyVoteShare[]
  seatFlips: SeatFlip[]
  constituencies: ConstituencyResult[]
  waveTimeline: WaveDataPoint[]
  districtGenderProfiles: DistrictGenderProfile[]
  lostDeposits: LostDeposit[]
  secondPlaces: SecondPlace[]
  thirdPlaces: ThirdPlace[]
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const item of arr) {
    const k = key(item)
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}

const ELECTION_YEARS = [1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021, 2026]

// ─── Core computation (callable from server components AND API routes) ────────

export async function computeElectionAnalysis(
  year: number,
  stateCode: string,
): Promise<ElectionAnalysisResponse> {
  const payload = await getPayload({ config })

  const [currentRaw, assembliesRaw, districtsRaw] = await Promise.all([
    payload.find({
      collection: 'election-history',
      where: { stateCode: { equals: stateCode }, electionYear: { equals: year } },
      limit: 60000,
    }),
    payload.find({
      collection: 'assemblies',
      where: { stateCode: { equals: stateCode } },
      limit: 500,
    }),
    payload.find({ collection: 'districts', limit: 100 }),
  ])

  const allDocs: any[] = currentRaw.docs

  // Assembly lookup
  const assemblyLookup: Record<
    string,
    { slug: string; districtId: string; districtName: string; voters: any }
  > = {}
  assembliesRaw.docs.forEach((a: any) => {
    assemblyLookup[a.assemblyId] = {
      slug: a.slug || a.assemblyId,
      districtId: a.districtId || '',
      districtName: a.districtName || '',
      voters: a.voters,
    }
  })

  // District lookup
  const districtLookup: Record<string, { slug: string }> = {}
  districtsRaw.docs.forEach((d: any) => {
    districtLookup[d.districtId] = { slug: d.slug || d.districtId }
  })

  // Group candidates by assembly
  const byAssembly = groupBy(allDocs, (d) => d.assemblyId)

  const constituencies: ConstituencyResult[] = []
  let totalElectors = 0
  let totalVotesPolled = 0
  // Deposit-loss tracking: votes ≤ 1/6 of valid votes polled → deposit forfeited
  const depositLossMap: Record<
    string,
    {
      lost: number
      total: number
      lostAssemblies: LostDeposit['assemblies']
    }
  > = {}

  // 2nd place tracking
  const secondPlaceMap: Record<
    string,
    {
      count: number
      total: number
      assemblies: SecondPlace['assemblies']
    }
  > = {}

  // 3rd place tracking
  const thirdPlaceMap: Record<
    string,
    {
      count: number
      total: number
      assemblies: ThirdPlace['assemblies']
    }
  > = {}

  for (const [assemblyId, records] of Object.entries(byAssembly)) {
    const sorted = [...records].sort((a, b) => (b.candidateVotes ?? 0) - (a.candidateVotes ?? 0))
    const winner = sorted[0]
    const runner = sorted[1]
    if (!winner) continue

    const margin = runner ? (winner.candidateVotes ?? 0) - (runner.candidateVotes ?? 0) : 0
    const polled: number =
      winner.votesPolled ?? sorted.reduce((s, r) => s + (r.candidateVotes ?? 0), 0)
    const assemblyInfo = assemblyLookup[assemblyId]
    const districtId = assemblyInfo?.districtId ?? ''
    const districtSlug = districtLookup[districtId]?.slug ?? districtId
    const electors: number = assemblyInfo?.voters?.total ?? winner.totalVoters ?? 0
    const marginPct = polled > 0 ? Math.round((margin / polled) * 1000) / 10 : 0
    const turnoutPct = electors > 0 ? Math.round((polled / electors) * 1000) / 10 : 0

    totalElectors += electors
    totalVotesPolled += polled

    // Deposit-loss: candidate votes ≤ 1/6 of valid votes polled → deposit forfeited
    const depositThreshold = polled / 6
    for (const candidate of sorted) {
      const p = (candidate.candidateParty ?? 'IND') as string
      if (!depositLossMap[p]) depositLossMap[p] = { lost: 0, total: 0, lostAssemblies: [] }
      depositLossMap[p].total++
      if ((candidate.candidateVotes ?? 0) <= depositThreshold) {
        depositLossMap[p].lost++
        depositLossMap[p].lostAssemblies.push({
          assemblyId,
          assemblyName: winner.assemblyName ?? assemblyId,
          assemblySlug: assemblyInfo?.slug ?? assemblyId,
          districtName: assemblyInfo?.districtName ?? '',
          districtSlug,
          candidateName: candidate.candidateName ?? '',
          votes: candidate.candidateVotes ?? 0,
          votePct:
            polled > 0 ? Math.round(((candidate.candidateVotes ?? 0) / polled) * 1000) / 10 : 0,
        })
      }
    }

    // 2nd place tracking
    const second = sorted[1]
    for (const candidate of sorted) {
      const p = (candidate.candidateParty ?? 'IND') as string
      if (!secondPlaceMap[p]) secondPlaceMap[p] = { count: 0, total: 0, assemblies: [] }
      secondPlaceMap[p].total++
    }
    if (second) {
      const p = (second.candidateParty ?? 'IND') as string
      secondPlaceMap[p].count++
      secondPlaceMap[p].assemblies.push({
        assemblyId,
        assemblyName: winner.assemblyName ?? assemblyId,
        assemblySlug: assemblyInfo?.slug ?? assemblyId,
        districtName: assemblyInfo?.districtName ?? '',
        districtSlug,
        candidateName: second.candidateName ?? '',
        votes: second.candidateVotes ?? 0,
        votePct: polled > 0 ? Math.round(((second.candidateVotes ?? 0) / polled) * 1000) / 10 : 0,
      })
    }

    // 3rd place tracking
    const third = sorted[2]
    for (const candidate of sorted) {
      const p = (candidate.candidateParty ?? 'IND') as string
      if (!thirdPlaceMap[p]) thirdPlaceMap[p] = { count: 0, total: 0, assemblies: [] }
      thirdPlaceMap[p].total++
    }
    if (third) {
      const p = (third.candidateParty ?? 'IND') as string
      thirdPlaceMap[p].count++
      thirdPlaceMap[p].assemblies.push({
        assemblyId,
        assemblyName: winner.assemblyName ?? assemblyId,
        assemblySlug: assemblyInfo?.slug ?? assemblyId,
        districtName: assemblyInfo?.districtName ?? '',
        districtSlug,
        candidateName: third.candidateName ?? '',
        votes: third.candidateVotes ?? 0,
        votePct: polled > 0 ? Math.round(((third.candidateVotes ?? 0) / polled) * 1000) / 10 : 0,
      })
    }

    constituencies.push({
      assemblyId,
      assemblyName: winner.assemblyName ?? assemblyId,
      assemblySlug: assemblyInfo?.slug ?? assemblyId,
      districtName: assemblyInfo?.districtName ?? '',
      districtSlug,
      winner: {
        name: winner.candidateName ?? '',
        party: winner.candidateParty ?? '',
        votes: winner.candidateVotes ?? 0,
      },
      runnerUp: runner
        ? {
            name: runner.candidateName ?? '',
            party: runner.candidateParty ?? '',
            votes: runner.candidateVotes ?? 0,
          }
        : { name: '', party: '', votes: 0 },
      margin,
      marginPct,
      totalElectors: electors,
      votesPolled: polled,
      turnoutPct,
      numCandidates: sorted.length,
    })
  }

  const overallTurnoutPct =
    totalElectors > 0 ? Math.round((totalVotesPolled / totalElectors) * 1000) / 10 : 0

  const prevYear = ELECTION_YEARS[ELECTION_YEARS.indexOf(year) - 1] ?? null

  // Fallback response builder (no prevYear comparison)
  function buildLostDeposits(): LostDeposit[] {
    return Object.entries(depositLossMap)
      .map(([party, { lost, total, lostAssemblies }]) => ({
        party,
        lost,
        total,
        lostPct: total > 0 ? Math.round((lost / total) * 1000) / 10 : 0,
        assemblies: lostAssemblies.sort((a, b) => a.votePct - b.votePct),
      }))
      .filter((d) => d.total > 0)
      .sort((a, b) => b.lost - a.lost)
  }

  function buildSecondPlaces(): SecondPlace[] {
    return Object.entries(secondPlaceMap)
      .map(([party, { count, total, assemblies }]) => ({
        party,
        count,
        total,
        secondPct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        assemblies: assemblies.sort((a, b) => b.votes - a.votes),
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
  }

  function buildThirdPlaces(): ThirdPlace[] {
    return Object.entries(thirdPlaceMap)
      .map(([party, { count, total, assemblies }]) => ({
        party,
        count,
        total,
        thirdPct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        assemblies: assemblies.sort((a, b) => b.votes - a.votes),
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
  }

  function buildFallback(): ElectionAnalysisResponse {
    const currPartyVotes: Record<string, number> = {}
    const currSeats: Record<string, number> = {}
    const currMargins: Record<string, number[]> = {}
    let currTotalVotes = 0
    for (const doc of allDocs) {
      const p = doc.candidateParty ?? 'IND'
      currPartyVotes[p] = (currPartyVotes[p] ?? 0) + (doc.candidateVotes ?? 0)
      currTotalVotes += doc.candidateVotes ?? 0
    }
    for (const c of constituencies) {
      const p = c.winner.party
      currSeats[p] = (currSeats[p] ?? 0) + 1
      if (!currMargins[p]) currMargins[p] = []
      currMargins[p].push(c.margin)
    }
    const partyVoteShares: PartyVoteShare[] = Object.entries(currPartyVotes)
      .map(([party, votes]) => {
        const margins = currMargins[party] ?? []
        return {
          party,
          votes,
          votePct: currTotalVotes > 0 ? Math.round((votes / currTotalVotes) * 1000) / 10 : 0,
          prevVotes: 0,
          prevVotePct: 0,
          seats: currSeats[party] ?? 0,
          avgMargin:
            margins.length > 0
              ? Math.round(margins.reduce((s, m) => s + m, 0) / margins.length)
              : 0,
          minMargin: margins.length > 0 ? Math.min(...margins) : 0,
          maxMargin: margins.length > 0 ? Math.max(...margins) : 0,
        }
      })
      .filter((p) => p.votes > 0)
      .sort((a, b) => b.votes - a.votes)

    const sortedAsc = [...constituencies].sort((a, b) => a.margin - b.margin)
    const sortedDesc = [...constituencies].sort((a, b) => b.margin - a.margin)
    const closest = sortedAsc[0]
    const biggest = sortedDesc[0]

    return {
      year,
      prevYear: null,
      stateCode,
      summary: {
        totalElectors,
        votesPolled: totalVotesPolled,
        turnoutPct: overallTurnoutPct,
        prevTurnoutPct: null,
        turnoutDelta: null,
        totalSeats: constituencies.length,
        majorityMark: Math.floor(constituencies.length / 2) + 1,
        closestMargin: closest?.margin ?? 0,
        closestConstituency: closest?.assemblyName ?? '',
        closestWinnerParty: closest?.winner.party ?? '',
        closestRunnerParty: closest?.runnerUp.party ?? '',
        biggestMargin: biggest?.margin ?? 0,
        biggestConstituency: biggest?.assemblyName ?? '',
        biggestWinnerParty: biggest?.winner.party ?? '',
      },
      partyVoteShares,
      seatFlips: [],
      constituencies,
      waveTimeline: [],
      districtGenderProfiles: [],
      lostDeposits: buildLostDeposits(),
      secondPlaces: buildSecondPlaces(),
      thirdPlaces: buildThirdPlaces(),
    }
  }

  if (!prevYear) return buildFallback()

  // Fetch previous year
  const prevRaw = await payload.find({
    collection: 'election-history',
    where: { stateCode: { equals: stateCode }, electionYear: { equals: prevYear } },
    limit: 60000,
  })

  // Prev turnout
  let prevElectors = 0
  let prevPolled = 0
  const prevByAssembly = groupBy(prevRaw.docs, (d: any) => d.assemblyId)
  for (const [aId, recs] of Object.entries(prevByAssembly)) {
    const sorted = [...(recs as any[])].sort(
      (a, b) => (b.candidateVotes ?? 0) - (a.candidateVotes ?? 0),
    )
    const first = sorted[0]
    const assemblyInfo = assemblyLookup[aId]
    const el: number = assemblyInfo?.voters?.total ?? first?.totalVoters ?? 0
    const pol: number =
      first?.votesPolled ?? (recs as any[]).reduce((s, r) => s + (r.candidateVotes ?? 0), 0)
    prevElectors += el
    prevPolled += pol
  }
  const prevTurnoutPct =
    prevElectors > 0 ? Math.round((prevPolled / prevElectors) * 1000) / 10 : null

  // Seat flips
  const prevWinners: Record<string, string> = {}
  for (const [aId, recs] of Object.entries(prevByAssembly)) {
    const sorted = [...(recs as any[])].sort(
      (a, b) => (b.candidateVotes ?? 0) - (a.candidateVotes ?? 0),
    )
    if (sorted[0]) prevWinners[aId] = sorted[0].candidateParty ?? ''
  }
  const flipCount: Record<string, number> = {}
  const flipAssemblies: Record<string, SeatFlip['assemblies']> = {}
  for (const c of constituencies) {
    const prev = prevWinners[c.assemblyId]
    const curr = c.winner.party
    if (prev && curr && prev !== curr) {
      const key = `${prev}→${curr}`
      flipCount[key] = (flipCount[key] ?? 0) + 1
      if (!flipAssemblies[key]) flipAssemblies[key] = []
      flipAssemblies[key].push({
        assemblyId: c.assemblyId,
        assemblyName: c.assemblyName,
        assemblySlug: c.assemblySlug,
        districtName: c.districtName,
        districtSlug: c.districtSlug,
        winner: c.winner,
        margin: c.margin,
        marginPct: c.marginPct,
        turnoutPct: c.turnoutPct,
      })
    }
  }
  const seatFlips: SeatFlip[] = Object.entries(flipCount)
    .map(([k, count]) => {
      const [from, to] = k.split('→')
      return { from: from!, to: to!, count, assemblies: flipAssemblies[k] ?? [] }
    })
    .sort((a, b) => b.count - a.count)

  // Party vote shares with prev comparison
  const prevPartyVotes: Record<string, number> = {}
  let prevTotalVotes = 0
  for (const doc of prevRaw.docs as any[]) {
    const p = doc.candidateParty ?? 'IND'
    prevPartyVotes[p] = (prevPartyVotes[p] ?? 0) + (doc.candidateVotes ?? 0)
    prevTotalVotes += doc.candidateVotes ?? 0
  }
  const currPartyVotes: Record<string, number> = {}
  const currSeats: Record<string, number> = {}
  const currMargins: Record<string, number[]> = {}
  let currTotalVotes = 0
  for (const doc of allDocs) {
    const p = doc.candidateParty ?? 'IND'
    currPartyVotes[p] = (currPartyVotes[p] ?? 0) + (doc.candidateVotes ?? 0)
    currTotalVotes += doc.candidateVotes ?? 0
  }
  for (const c of constituencies) {
    const p = c.winner.party
    currSeats[p] = (currSeats[p] ?? 0) + 1
    if (!currMargins[p]) currMargins[p] = []
    currMargins[p].push(c.margin)
  }

  const allParties = Array.from(
    new Set([...Object.keys(currPartyVotes), ...Object.keys(prevPartyVotes)]),
  )
  const partyVoteShares: PartyVoteShare[] = allParties
    .map((party) => {
      const votes = currPartyVotes[party] ?? 0
      const prev = prevPartyVotes[party] ?? 0
      const margins = currMargins[party] ?? []
      return {
        party,
        votes,
        votePct: currTotalVotes > 0 ? Math.round((votes / currTotalVotes) * 1000) / 10 : 0,
        prevVotes: prev,
        prevVotePct: prevTotalVotes > 0 ? Math.round((prev / prevTotalVotes) * 1000) / 10 : 0,
        seats: currSeats[party] ?? 0,
        avgMargin:
          margins.length > 0 ? Math.round(margins.reduce((s, m) => s + m, 0) / margins.length) : 0,
        minMargin: margins.length > 0 ? Math.min(...margins) : 0,
        maxMargin: margins.length > 0 ? Math.max(...margins) : 0,
      }
    })
    .filter((p) => p.votes > 0)
    .sort((a, b) => b.votes - a.votes)

  // Wave timeline (2011 onwards)
  const waveYears = ELECTION_YEARS.filter((y) => y >= 2011 && y <= year)
  const waveTimeline: WaveDataPoint[] = []
  for (const wy of waveYears) {
    let wyDocs: any[]
    if (wy === year) {
      wyDocs = allDocs
    } else if (wy === prevYear) {
      wyDocs = prevRaw.docs as any[]
    } else {
      const wyRaw = await payload.find({
        collection: 'election-history',
        where: { stateCode: { equals: stateCode }, electionYear: { equals: wy } },
        limit: 60000,
      })
      wyDocs = wyRaw.docs as any[]
    }
    const wyTotal = wyDocs.reduce((s: number, d: any) => s + (d.candidateVotes ?? 0), 0)
    const byParty: Record<string, number> = {}
    for (const d of wyDocs) {
      const p = d.candidateParty ?? 'IND'
      byParty[p] = (byParty[p] ?? 0) + (d.candidateVotes ?? 0)
    }
    const point: WaveDataPoint = { year: wy }
    for (const [p, v] of Object.entries(byParty)) {
      point[p] = wyTotal > 0 ? Math.round((v / wyTotal) * 1000) / 10 : 0
    }
    waveTimeline.push(point)
  }

  // District gender profiles
  const districtAssemblies: Record<
    string,
    {
      name: string
      slug: string
      total: number
      male: number
      female: number
      winningParties: string[]
    }
  > = {}
  for (const a of assembliesRaw.docs as any[]) {
    const did = a.districtId ?? ''
    if (!districtAssemblies[did]) {
      districtAssemblies[did] = {
        name: a.districtName ?? '',
        slug: districtLookup[did]?.slug ?? did,
        total: 0,
        male: 0,
        female: 0,
        winningParties: [],
      }
    }
    const v = a.voters ?? {}
    districtAssemblies[did].total += Number(v.total ?? 0)
    districtAssemblies[did].male += Number(v.male ?? 0)
    districtAssemblies[did].female += Number(v.female ?? 0)
  }
  for (const c of constituencies) {
    const did = assemblyLookup[c.assemblyId]?.districtId ?? ''
    if (districtAssemblies[did]) {
      districtAssemblies[did].winningParties.push(c.winner.party)
    }
  }
  const districtGenderProfiles: DistrictGenderProfile[] = Object.values(districtAssemblies)
    .filter((d) => d.total > 0)
    .map((d) => {
      const partyCounts: Record<string, number> = {}
      for (const p of d.winningParties) partyCounts[p] = (partyCounts[p] ?? 0) + 1
      const dominantParty = Object.entries(partyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      return {
        districtName: d.name,
        districtSlug: d.slug,
        totalElectors: d.total,
        femalePct: Math.round((d.female / d.total) * 1000) / 10,
        malePct: Math.round((d.male / d.total) * 1000) / 10,
        dominantParty,
      }
    })
    .sort((a, b) => b.femalePct - a.femalePct)

  // Summary
  const sortedAsc = [...constituencies].sort((a, b) => a.margin - b.margin)
  const sortedDesc = [...constituencies].sort((a, b) => b.margin - a.margin)
  const closest = sortedAsc[0]
  const biggest = sortedDesc[0]

  return {
    year,
    prevYear,
    stateCode,
    summary: {
      totalElectors,
      votesPolled: totalVotesPolled,
      turnoutPct: overallTurnoutPct,
      prevTurnoutPct,
      turnoutDelta:
        prevTurnoutPct != null ? Math.round((overallTurnoutPct - prevTurnoutPct) * 10) / 10 : null,
      totalSeats: constituencies.length,
      majorityMark: Math.floor(constituencies.length / 2) + 1,
      closestMargin: closest?.margin ?? 0,
      closestConstituency: closest?.assemblyName ?? '',
      closestWinnerParty: closest?.winner.party ?? '',
      closestRunnerParty: closest?.runnerUp.party ?? '',
      biggestMargin: biggest?.margin ?? 0,
      biggestConstituency: biggest?.assemblyName ?? '',
      biggestWinnerParty: biggest?.winner.party ?? '',
    },
    partyVoteShares,
    seatFlips,
    constituencies,
    waveTimeline,
    districtGenderProfiles,
    lostDeposits: buildLostDeposits(),
    secondPlaces: buildSecondPlaces(),
    thirdPlaces: buildThirdPlaces(),
  }
}
