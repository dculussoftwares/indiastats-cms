import { NextRequest, NextResponse } from 'next/server'

// Simple data-only endpoint - image generation happens client-side
interface CardData {
  assemblyName: string
  districtName: string
  isReserved: boolean
  totalVoters: string
  maleVoters: string
  femaleVoters: string
  totalElections: number
  party1: { name: string; wins: number } | null
  party2: { name: string; wins: number } | null
  dmkBlocWins: number
  aiadmkBlocWins: number
}

export async function POST(request: NextRequest) {
  try {
    const data: CardData = await request.json()
    // Just echo back the data - actual image generation is done client-side
    return NextResponse.json({ received: true, data })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
