import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { importPredictions } from '@/lib/importPredictions'
import type { RawPredictionRecord } from '@/lib/importPredictions'

export const maxDuration = 120

interface ImportRequestBody {
  stateCode?: string
  electionYear?: number
  predictorId?: string
  updatePredictor?: {
    name?: string
    bio?: string
    imagePath?: string
  }
  newPredictor?: {
    name: string
    bio?: string
    imagePath?: string
    imageMediaId?: string
  }
  predictions?: RawPredictionRecord[]
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const body = (await request.json()) as ImportRequestBody

    if (!body.stateCode || !body.electionYear) {
      return Response.json(
        { success: false, error: 'stateCode and electionYear are required.' },
        { status: 400 },
      )
    }

    if (!body.predictorId && !body.newPredictor) {
      return Response.json(
        { success: false, error: 'Either predictorId or newPredictor must be provided.' },
        { status: 400 },
      )
    }

    if (!Array.isArray(body.predictions) || body.predictions.length === 0) {
      return Response.json(
        { success: false, error: 'predictions array is required and must not be empty.' },
        { status: 400 },
      )
    }

    const result = await importPredictions({
      payload,
      stateCode: body.stateCode,
      electionYear: body.electionYear,
      predictorId: body.predictorId,
      updatePredictor: body.updatePredictor,
      newPredictor: body.newPredictor,
      predictions: body.predictions,
    })

    return Response.json({ success: true, result })
  } catch (err) {
    payload.logger.error({ err, message: 'Error importing predictions' })
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 },
    )
  }
}
