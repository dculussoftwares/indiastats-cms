import { getPayload } from 'payload'

import config from '@payload-config'

export interface PredictorOption {
  id: string
  name: string
  imagePath: string | null
  bio: string | null
}

export interface PredictionMapEntry {
  assemblyId: string
  assemblyName: string
  districtName: string | null
  assemblySlug: string | null
  predictedWinningParty: string | null
  predictionType: string
  isCloseContest: boolean
  closeParties: string[]
  additionalNotes: string
}

export interface PredictionCountItem {
  count: number
  key: string
}

export interface ElectionPredictionDataset {
  stateCode: string
  electionYear: number
  availableYears: number[]
  predictors: PredictorOption[]
  selectedPredictor: PredictorOption | null
  results: Record<string, PredictionMapEntry>
  topParties: PredictionCountItem[]
  predictionTypeCounts: PredictionCountItem[]
  watchlist: PredictionMapEntry[]
  summary: {
    calledSeats: number
    closeContests: number
    leadingParty: string | null
    leadingPartySeats: number
    totalAssemblies: number
    tooCloseToCall: number
  }
}

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeCloseParties = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      return normalizeText((entry as { partyCode?: unknown }).partyCode)
    })
    .filter((party): party is string => party !== null)
}

const toPredictorOption = (doc: {
  bio?: unknown
  id: string | number
  imagePath?: unknown
  name: string
}): PredictorOption => ({
  id: String(doc.id),
  name: doc.name,
  imagePath: normalizeText(doc.imagePath),
  bio: normalizeText(doc.bio),
})

export interface PredictorSummary {
  id: string
  name: string
  imagePath: string | null
  bio: string | null
  totalPredictions: number
  calledSeats: number
  tooCloseToCall: number
  closeContests: number
  leadingParty: string | null
  leadingPartySeats: number
  latestYear: number | null
}

export async function getPredictorsWithSummaries({
  stateCode = 'TN',
}: {
  stateCode?: string
}): Promise<PredictorSummary[]> {
  const payload = await getPayload({ config })

  const predictorsResult = await payload.find({
    collection: 'predictors',
    where: { isActive: { equals: true } },
    limit: 100,
    pagination: false,
    sort: 'name',
  })

  const predictorDocs = predictorsResult.docs as Array<{
    bio?: unknown
    id: string | number
    imagePath?: unknown
    name: string
  }>

  const summaries: PredictorSummary[] = []

  for (const doc of predictorDocs) {
    const predictionsResult = await payload.find({
      collection: 'election-predictions',
      where: {
        and: [
          { predictor: { equals: doc.id } },
          { stateCode: { equals: stateCode } },
        ],
      },
      depth: 0,
      limit: 5000,
      pagination: false,
    })

    const predictions = predictionsResult.docs as Array<{
      electionYear: number
      isCloseContest?: unknown
      predictedWinningParty?: unknown
    }>

    const years = Array.from(new Set(predictions.map((p) => p.electionYear))).sort((a, b) => b - a)
    const latestYear = years[0] ?? null
    const latestDocs = latestYear ? predictions.filter((p) => p.electionYear === latestYear) : []

    let calledSeats = 0
    let tooCloseToCall = 0
    let closeContests = 0
    const partyCounts = new Map<string, number>()

    for (const p of latestDocs) {
      const winner = normalizeText(p.predictedWinningParty)
      if (winner) {
        calledSeats++
        partyCounts.set(winner, (partyCounts.get(winner) ?? 0) + 1)
      } else {
        tooCloseToCall++
      }
      if (p.isCloseContest) closeContests++
    }

    const topParty = Array.from(partyCounts.entries()).sort((a, b) => b[1] - a[1])[0] ?? null

    summaries.push({
      id: String(doc.id),
      name: doc.name,
      imagePath: normalizeText(doc.imagePath),
      bio: normalizeText(doc.bio),
      totalPredictions: latestDocs.length,
      calledSeats,
      tooCloseToCall,
      closeContests,
      leadingParty: topParty?.[0] ?? null,
      leadingPartySeats: topParty?.[1] ?? 0,
      latestYear,
    })
  }

  return summaries
}

export async function getElectionPredictionsData({
  electionYear,
  predictorId,
  stateCode = 'TN',
}: {
  electionYear?: number | null
  predictorId?: string | number | null
  stateCode?: string
}): Promise<ElectionPredictionDataset> {
  const payload = await getPayload({ config })

  const predictorsResult = await payload.find({
    collection: 'predictors',
    where: {
      isActive: {
        equals: true,
      },
    },
    limit: 100,
    pagination: false,
    sort: 'name',
  })

  const predictorDocs = predictorsResult.docs as Array<{
    bio?: unknown
    id: string | number
    imagePath?: unknown
    name: string
  }>
  const predictors = predictorDocs.map(toPredictorOption)
  const selectedPredictorDoc =
    predictorDocs.find((doc) => String(doc.id) === String(predictorId)) ?? predictorDocs[0] ?? null

  if (!selectedPredictorDoc) {
    return {
      stateCode,
      electionYear: electionYear ?? new Date().getFullYear(),
      availableYears: [],
      predictors: [],
      selectedPredictor: null,
      results: {},
      topParties: [],
      predictionTypeCounts: [],
      watchlist: [],
      summary: {
        calledSeats: 0,
        closeContests: 0,
        leadingParty: null,
        leadingPartySeats: 0,
        totalAssemblies: 0,
        tooCloseToCall: 0,
      },
    }
  }

  const selectedPredictor = toPredictorOption(selectedPredictorDoc)

  const predictionsResult = await payload.find({
    collection: 'election-predictions',
    where: {
      and: [
        {
          predictor: {
            equals: selectedPredictorDoc.id,
          },
        },
        {
          stateCode: {
            equals: stateCode,
          },
        },
      ],
    },
    depth: 1,
    limit: 5000,
    pagination: false,
    sort: 'assemblyId',
  })

  const predictionDocs = predictionsResult.docs as Array<{
    additionalNotes?: unknown
    assemblyDoc?: {
      districtName?: unknown
      name?: unknown
      slug?: unknown
    } | null
    assemblyId: string
    closeParties?: unknown
    electionYear: number
    isCloseContest?: unknown
    predictedWinningParty?: unknown
    predictionType?: unknown
  }>

  const availableYears = Array.from(
    new Set(
      predictionDocs
        .map((doc) => (typeof doc.electionYear === 'number' ? doc.electionYear : null))
        .filter((year): year is number => year !== null),
    ),
  ).sort((a, b) => b - a)

  const selectedYear =
    electionYear && availableYears.includes(electionYear)
      ? electionYear
      : availableYears[0] ?? electionYear ?? new Date().getFullYear()

  const docsForYear = predictionDocs.filter((doc) => doc.electionYear === selectedYear)

  const results: Record<string, PredictionMapEntry> = {}
  const partyCounts = new Map<string, number>()
  const predictionTypeCounts = new Map<string, number>()
  const watchlist: PredictionMapEntry[] = []

  let calledSeats = 0
  let closeContests = 0
  let tooCloseToCall = 0

  for (const doc of docsForYear) {
    const entry: PredictionMapEntry = {
      assemblyId: doc.assemblyId,
      assemblyName: normalizeText(doc.assemblyDoc?.name) ?? doc.assemblyId,
      districtName: normalizeText(doc.assemblyDoc?.districtName),
      assemblySlug: normalizeText(doc.assemblyDoc?.slug),
      predictedWinningParty: normalizeText(doc.predictedWinningParty),
      predictionType: normalizeText(doc.predictionType) ?? 'Unknown',
      isCloseContest: Boolean(doc.isCloseContest),
      closeParties: normalizeCloseParties(doc.closeParties),
      additionalNotes: normalizeText(doc.additionalNotes) ?? '',
    }

    results[entry.assemblyId] = entry
    predictionTypeCounts.set(
      entry.predictionType,
      (predictionTypeCounts.get(entry.predictionType) ?? 0) + 1,
    )

    if (entry.predictedWinningParty) {
      calledSeats++
      partyCounts.set(
        entry.predictedWinningParty,
        (partyCounts.get(entry.predictedWinningParty) ?? 0) + 1,
      )
    } else {
      tooCloseToCall++
    }

    if (entry.isCloseContest) {
      closeContests++
    }

    if (entry.isCloseContest || entry.predictedWinningParty === null) {
      watchlist.push(entry)
    }
  }

  const topParties = Array.from(partyCounts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))

  const sortedPredictionTypes = Array.from(predictionTypeCounts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))

  watchlist.sort((a, b) => {
    if (a.predictedWinningParty === null && b.predictedWinningParty !== null) return -1
    if (a.predictedWinningParty !== null && b.predictedWinningParty === null) return 1
    if (a.isCloseContest !== b.isCloseContest) return a.isCloseContest ? -1 : 1
    return a.assemblyId.localeCompare(b.assemblyId)
  })

  return {
    stateCode,
    electionYear: selectedYear,
    availableYears,
    predictors,
    selectedPredictor,
    results,
    topParties,
    predictionTypeCounts: sortedPredictionTypes,
    watchlist,
    summary: {
      calledSeats,
      closeContests,
      leadingParty: topParties[0]?.key ?? null,
      leadingPartySeats: topParties[0]?.count ?? 0,
      totalAssemblies: docsForYear.length,
      tooCloseToCall,
    },
  }
}
