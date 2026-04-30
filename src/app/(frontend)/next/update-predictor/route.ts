import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 30

interface UpdatePredictorBody {
  predictorId?: string | number
  field?: 'name' | 'bio' | 'imagePath'
  value?: string
}

const normalizeImagePath = (value: string): string =>
  value.startsWith('/public/') ? value.replace(/^\/public/, '') : value

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ success: false, error: 'Forbidden.' }, { status: 403 })
  }

  let body: UpdatePredictorBody
  try {
    body = (await request.json()) as UpdatePredictorBody
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON.' }, { status: 400 })
  }

  const { predictorId, field, value } = body

  if (!predictorId) {
    return Response.json({ success: false, error: 'predictorId is required.' }, { status: 400 })
  }

  const allowedFields: Array<UpdatePredictorBody['field']> = ['name', 'bio', 'imagePath']
  if (!field || !allowedFields.includes(field)) {
    return Response.json(
      { success: false, error: 'field must be one of: name, bio, imagePath.' },
      { status: 400 },
    )
  }

  if (typeof value !== 'string') {
    return Response.json({ success: false, error: 'value must be a string.' }, { status: 400 })
  }

  try {
    const normalizedValue = field === 'imagePath' ? normalizeImagePath(value) : value.trim()

    const doc = await payload.update({
      collection: 'predictors',
      id: predictorId,
      data: { [field]: normalizedValue },
    })

    return Response.json({
      success: true,
      doc: {
        id: doc.id,
        name: doc.name,
        bio: doc.bio ?? '',
        imagePath: doc.imagePath ?? '',
      },
    })
  } catch (err) {
    payload.logger.error({ err, message: 'Error updating predictor field' })
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Update failed.' },
      { status: 500 },
    )
  }
}
