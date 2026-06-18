import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStateByCode, stateCodeToSlug } from '@/config/states'

function cleanName(name: string): string {
  const parts = (name || '').split(' / ')
  return parts.length > 1 ? parts[1].trim() : (name || '').trim()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assemblyId: string }> },
) {
  try {
    const { assemblyId } = await params

    if (!assemblyId || !/^ac\d{3}$/i.test(assemblyId)) {
      return NextResponse.json({ error: 'Invalid assemblyId' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const assemblyResult = await payload.find({
      collection: 'assemblies',
      where: { assemblyId: { equals: assemblyId.toLowerCase() } },
      limit: 1,
    })

    const assembly = assemblyResult.docs[0] as any
    if (!assembly) {
      return NextResponse.json({ error: 'Assembly not found' }, { status: 404 })
    }

    // Last election winner (most recent year, highest votes)
    const historyResult = await payload.find({
      collection: 'election-history',
      where: { assemblyId: { equals: assemblyId.toLowerCase() } },
      sort: '-electionYear',
      limit: 20,
    })

    let lastWinner: string | null = null
    let lastWinnerParty: string | null = null
    let lastYear: number | null = null

    if (historyResult.docs.length > 0) {
      const sorted = [...historyResult.docs].sort((a: any, b: any) => {
        if (b.electionYear !== a.electionYear) return b.electionYear - a.electionYear
        return (b.candidateVotes || 0) - (a.candidateVotes || 0)
      })
      const top = sorted[0] as any
      lastYear = top.electionYear
      lastWinner = top.candidateName || null
      lastWinnerParty = top.candidateParty || null
    }

    const name = cleanName(assembly.name)
    const districtName = cleanName(assembly.districtName)
    const districtId: string = assembly.districtId || 'dt7'
    const stateSlug = getStateByCode(assembly.stateCode || '')?.slug ?? stateCodeToSlug(assembly.stateCode || '')

    // Look up the district slug so pageUrl uses the correct slug-based format
    const districtResult = await payload.find({
      collection: 'districts',
      where: { districtId: { equals: districtId } },
      limit: 1,
      depth: 0,
      select: { slug: true },
    })
    const districtSlug: string = (districtResult.docs[0] as any)?.slug || districtId
    const assemblySlug: string = assembly.slug || assembly.assemblyId

    return NextResponse.json({
      assemblyId: assembly.assemblyId,
      name,
      districtName,
      districtId,
      isReserved: assembly.voters?.isReservedAc || false,
      totalVoters: Number(assembly.voters?.total) || 0,
      lastElection: lastYear ? { year: lastYear, winner: lastWinner, party: lastWinnerParty } : null,
      pageUrl: `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}`,
    })
  } catch (error) {
    console.error('[assembly-info] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
