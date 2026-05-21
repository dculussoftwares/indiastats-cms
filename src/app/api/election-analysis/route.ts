import { NextRequest, NextResponse } from 'next/server'
import { computeElectionAnalysis } from '@/lib/electionAnalysis'

// Re-export types so existing imports from this path continue to work
export type {
  ElectionAnalysisResponse,
  PartyVoteShare,
  SeatFlip,
  ConstituencyResult,
  WaveDataPoint,
  DistrictGenderProfile,
} from '@/lib/electionAnalysis'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const year = parseInt(sp.get('year') ?? '2026', 10)
  const stateCode = sp.get('stateCode') ?? ''

  try {
    const data = await computeElectionAnalysis(year, stateCode)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[election-analysis] route error:', err)
    return NextResponse.json({ error: 'Failed to compute analysis' }, { status: 500 })
  }
}
