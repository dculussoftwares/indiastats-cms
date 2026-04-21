import { getPredictorsWithSummaries } from '@/lib/electionPredictions'

export const revalidate = 3600

export async function GET(): Promise<Response> {
  try {
    const summaries = await getPredictorsWithSummaries({ stateCode: 'TN' })
    return Response.json(summaries)
  } catch {
    return Response.json([])
  }
}
