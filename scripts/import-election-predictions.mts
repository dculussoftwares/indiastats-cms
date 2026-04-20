import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type RawPredictionRecord = {
  assembly_id?: string | null
  assembly_name?: string | null
  predicted_winning_party?: string | null
  prediction_type?: string | null
  is_close_contest?: boolean | null
  close_parties?: unknown
  additional_notes?: string | null
}

type RawPredictionFile = {
  prediction?: RawPredictionRecord[]
}

const importSpec = {
  electionYear: 2026,
  stateCode: 'TN',
  filePath: 'prediction2/final.json',
  predictor: {
    name: 'JVC Sreeram (Bulls Eye)',
    bio: 'Founder-Winning Election, Psephologist got LS 2019 99.66% Accuracy, Political Historian & Strategist, TV Panelist, Author, Corporate Trainer, Keynote Speaker.',
    imagePath: '/public/images/JVC.png',
  },
}

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeImagePath = (value: string): string =>
  value.startsWith('/public/') ? value.replace(/^\/public/, '') : value

async function main() {
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })

  console.log('Ensuring predictor exists...')
  const predictorResult = await payload.find({
    collection: 'predictors',
    where: {
      name: {
        equals: importSpec.predictor.name,
      },
    },
    limit: 1,
    pagination: false,
  })

  const predictorData = {
    name: importSpec.predictor.name,
    bio: importSpec.predictor.bio,
    imagePath: normalizeImagePath(importSpec.predictor.imagePath),
    isActive: true,
  }

  const predictorDoc =
    predictorResult.docs.length > 0
      ? await payload.update({
          collection: 'predictors',
          id: predictorResult.docs[0].id,
          data: predictorData,
        })
      : await payload.create({
          collection: 'predictors',
          data: predictorData,
        })

  console.log(`Predictor ready: ${predictorDoc.name}`)

  console.log('Loading prediction file...')
  const absoluteFilePath = path.join(process.cwd(), importSpec.filePath)
  const rawFile = JSON.parse(fs.readFileSync(absoluteFilePath, 'utf8')) as RawPredictionFile

  if (!Array.isArray(rawFile.prediction)) {
    throw new Error(`Expected "prediction" array in ${absoluteFilePath}`)
  }

  console.log('Fetching assemblies...')
  const assembliesResult = await payload.find({
    collection: 'assemblies',
    where: {
      stateCode: {
        equals: importSpec.stateCode,
      },
    },
    limit: 1000,
    pagination: false,
    select: {
      id: true,
      assemblyId: true,
      name: true,
    },
  })

  const assembliesByAssemblyId = new Map(
    assembliesResult.docs.map((doc) => [
      doc.assemblyId,
      {
        id: doc.id,
        assemblyId: doc.assemblyId,
        name: doc.name,
      },
    ]),
  )

  const missingAssemblies: string[] = []

  const normalizedPredictions = rawFile.prediction.map((record, index) => {
    const assemblyId = normalizeText(record.assembly_id)

    if (!assemblyId) {
      throw new Error(`Missing assembly_id at row ${index + 1}`)
    }

    const assembly = assembliesByAssemblyId.get(assemblyId)

    if (!assembly) {
      missingAssemblies.push(`${assemblyId} (${record.assembly_name ?? 'unknown'})`)
      return null
    }

    const predictedWinningParty = normalizeText(record.predicted_winning_party)
    const closeParties = Array.isArray(record.close_parties)
      ? record.close_parties
          .map((party) => normalizeText(party))
          .filter((party): party is string => party !== null)
          .map((partyCode) => ({ partyCode }))
      : []

    if (predictedWinningParty === null && closeParties.length === 0) {
      throw new Error(
        `Invalid prediction for ${assemblyId}: predicted_winning_party is null and close_parties is empty.`,
      )
    }

    return {
      assembly,
      data: {
        stateCode: importSpec.stateCode,
        electionYear: importSpec.electionYear,
        predictor: predictorDoc.id,
        assemblyDoc: assembly.id,
        assemblyId: assembly.assemblyId,
        predictedWinningParty,
        predictionType: normalizeText(record.prediction_type) ?? 'Unknown',
        isCloseContest: Boolean(record.is_close_contest),
        closeParties,
        additionalNotes: normalizeText(record.additional_notes) ?? '',
        predictionKey: `${predictorDoc.id}:${assembly.assemblyId}:${importSpec.electionYear}`,
      },
    }
  })

  if (missingAssemblies.length > 0) {
    throw new Error(
      `Could not find ${missingAssemblies.length} assemblies in DB:\n${missingAssemblies.join('\n')}`,
    )
  }

  const importRows = normalizedPredictions.filter(
    (entry): entry is NonNullable<(typeof normalizedPredictions)[number]> => entry !== null,
  )

  console.log('Fetching existing predictions for this predictor and year...')
  const existingPredictions = await payload.find({
    collection: 'election-predictions',
    where: {
      and: [
        {
          predictor: {
            equals: predictorDoc.id,
          },
        },
        {
          electionYear: {
            equals: importSpec.electionYear,
          },
        },
        {
          stateCode: {
            equals: importSpec.stateCode,
          },
        },
      ],
    },
    limit: 1000,
    pagination: false,
    select: {
      id: true,
      predictionKey: true,
    },
  })

  const existingByKey = new Map(
    existingPredictions.docs.map((doc) => [doc.predictionKey, doc.id]),
  )

  let created = 0
  let updated = 0

  for (const row of importRows) {
    const existingId = existingByKey.get(row.data.predictionKey)

    if (existingId) {
      await payload.update({
        collection: 'election-predictions',
        id: existingId,
        data: row.data,
      })
      updated++
      continue
    }

    await payload.create({
      collection: 'election-predictions',
      data: row.data,
    })
    created++
  }

  console.log('Import complete.')
  console.log(`Predictor : ${predictorDoc.name}`)
  console.log(`File      : ${importSpec.filePath}`)
  console.log(`Year      : ${importSpec.electionYear}`)
  console.log(`Total     : ${importRows.length}`)
  console.log(`Created   : ${created}`)
  console.log(`Updated   : ${updated}`)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
