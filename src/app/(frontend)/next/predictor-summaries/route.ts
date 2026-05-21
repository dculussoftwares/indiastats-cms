import { getPredictorsWithSummaries } from '@/lib/electionPredictions'

export const revalidate = 3600

export async function GET(request: Request): Promise<Response> {
  try {
    const stateCode = new URL(request.url).searchParams.get('stateCode') ?? ''
    const summaries = await getPredictorsWithSummaries({ stateCode })
    return Response.json(summaries)
  } catch {
    return Response.json([])
  }
}
