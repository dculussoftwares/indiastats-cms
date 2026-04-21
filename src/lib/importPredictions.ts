import type { Payload } from 'payload'

export interface RawPredictionRecord {
  assembly_id?: string | null
  assembly_name?: string | null
  predicted_winning_party?: string | null
  prediction_type?: string | null
  is_close_contest?: boolean | null
  close_parties?: unknown
  additional_notes?: string | null
}

export interface ImportPredictionsInput {
  payload: Payload
  stateCode: string
  electionYear: number
  predictorId?: string
  newPredictor?: {
    name: string
    bio?: string
    imagePath: string
  }
  predictions: RawPredictionRecord[]
}

export interface ImportPredictionsResult {
  predictorId: string
  predictorName: string
  total: number
  created: number
  updated: number
  errors: Array<{ assemblyId: string; message: string }>
}

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeImagePath = (value: string): string =>
  value.startsWith('/public/') ? value.replace(/^\/public/, '') : value

export async function importPredictions(
  input: ImportPredictionsInput,
): Promise<ImportPredictionsResult> {
  const { payload, stateCode, electionYear, predictions } = input

  // 1. Resolve predictor
  let predictorDocId: string | number
  let predictorName: string

  if (input.predictorId) {
    const existing = await payload.findByID({
      collection: 'predictors',
      id: input.predictorId,
    })
    if (!existing) {
      throw new Error(`Predictor with ID "${input.predictorId}" not found.`)
    }
    predictorDocId = existing.id
    predictorName = existing.name
  } else if (input.newPredictor) {
    const existingResult = await payload.find({
      collection: 'predictors',
      where: { name: { equals: input.newPredictor.name } },
      limit: 1,
      pagination: false,
    })

    const predictorData = {
      name: input.newPredictor.name,
      bio: input.newPredictor.bio ?? '',
      imagePath: normalizeImagePath(input.newPredictor.imagePath),
      isActive: true,
    }

    if (existingResult.docs.length > 0) {
      const updated = await payload.update({
        collection: 'predictors',
        id: existingResult.docs[0].id,
        data: predictorData,
      })
      predictorDocId = updated.id
      predictorName = updated.name
    } else {
      const created = await payload.create({
        collection: 'predictors',
        data: predictorData,
      })
      predictorDocId = created.id
      predictorName = created.name
    }
  } else {
    throw new Error('Either predictorId or newPredictor must be provided.')
  }

  // 2. Fetch assemblies for state
  const assembliesResult = await payload.find({
    collection: 'assemblies',
    where: { stateCode: { equals: stateCode } },
    limit: 1000,
    pagination: false,
    select: { id: true, assemblyId: true, name: true },
  })

  const assembliesByAssemblyId = new Map(
    assembliesResult.docs.map((doc) => [
      doc.assemblyId,
      { id: doc.id, assemblyId: doc.assemblyId, name: doc.name },
    ]),
  )

  // 3. Fetch existing predictions for this predictor+year+state
  const existingPredictions = await payload.find({
    collection: 'election-predictions',
    where: {
      and: [
        { predictor: { equals: predictorDocId } },
        { electionYear: { equals: electionYear } },
        { stateCode: { equals: stateCode } },
      ],
    },
    limit: 5000,
    pagination: false,
    select: { id: true, predictionKey: true },
  })

  const existingByKey = new Map(
    existingPredictions.docs.map((doc) => [doc.predictionKey, doc.id]),
  )

  // 4. Process each prediction row
  const errors: Array<{ assemblyId: string; message: string }> = []
  let created = 0
  let updated = 0

  for (const record of predictions) {
    const assemblyId = normalizeText(record.assembly_id)

    if (!assemblyId) {
      errors.push({ assemblyId: 'unknown', message: 'Missing assembly_id' })
      continue
    }

    const assembly = assembliesByAssemblyId.get(assemblyId)
    if (!assembly) {
      errors.push({
        assemblyId,
        message: `Assembly "${assemblyId}" not found in database`,
      })
      continue
    }

    const predictedWinningParty = normalizeText(record.predicted_winning_party)
    const closeParties = Array.isArray(record.close_parties)
      ? record.close_parties
          .map((party) => normalizeText(party))
          .filter((party): party is string => party !== null)
          .map((partyCode) => ({ partyCode }))
      : []

    if (predictedWinningParty === null && closeParties.length === 0) {
      errors.push({
        assemblyId,
        message: 'No winning party and no close parties provided',
      })
      continue
    }

    const predictionKey = `${predictorDocId}:${assembly.assemblyId}:${electionYear}`
    const data = {
      stateCode,
      electionYear,
      predictor: predictorDocId,
      assemblyDoc: assembly.id,
      assemblyId: assembly.assemblyId,
      predictedWinningParty,
      predictionType: normalizeText(record.prediction_type) ?? 'Unknown',
      isCloseContest: Boolean(record.is_close_contest),
      closeParties,
      additionalNotes: normalizeText(record.additional_notes) ?? '',
      predictionKey,
    }

    try {
      const existingId = existingByKey.get(predictionKey)

      if (existingId) {
        await payload.update({
          collection: 'election-predictions',
          id: existingId,
          data,
        })
        updated++
      } else {
        await payload.create({
          collection: 'election-predictions',
          data,
        })
        created++
      }
    } catch (err) {
      errors.push({
        assemblyId,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return {
    predictorId: String(predictorDocId),
    predictorName,
    total: predictions.length,
    created,
    updated,
    errors,
  }
}
