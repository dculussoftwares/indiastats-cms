import { NextRequest, NextResponse } from 'next/server'

import { getElectionPredictionsData } from '@/lib/electionPredictions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stateCode = searchParams.get('stateCode') || ''
    const predictorId = searchParams.get('predictorId')
    const electionYearParam = searchParams.get('electionYear')
    const electionYear = electionYearParam ? Number(electionYearParam) : undefined

    const data = await getElectionPredictionsData({
      stateCode,
      predictorId,
      electionYear: Number.isFinite(electionYear) ? electionYear : undefined,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching election predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch election predictions' },
      { status: 500 },
    )
  }
}
