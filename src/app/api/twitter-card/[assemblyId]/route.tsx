import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

interface ElectionHistoryRecord {
  assemblyId: string
  electionYear: number
  candidateName: string
  candidateParty: string | null
  candidateVotes: number
}

interface AllianceDoc {
  year: number
  allianceName: string
  parties: { partyName: string }[]
  color: string
}

// Helper to determine bloc type
const getBlocType = (
  party: string,
  partyToAlliance: Record<string, string>,
): 'dmk' | 'aiadmk' | 'other' => {
  if (party === 'DMK') return 'dmk'
  if (party === 'AIADMK' || party === 'ADMK' || party === 'AIADMK(J)' || party === 'AIADMK(JA)') {
    return 'aiadmk'
  }

  if (partyToAlliance && partyToAlliance[party]) {
    const alliance = partyToAlliance[party]
    if (
      (alliance.includes('DMK') && !alliance.includes('AIADMK') && !alliance.includes('NDA')) ||
      alliance.includes('Secular Progressive') ||
      alliance.includes('DPA') ||
      alliance.includes('Democratic Progressive')
    ) {
      return 'dmk'
    }
    if (alliance.includes('AIADMK') || alliance.includes('NDA') || alliance.includes('SDPA')) {
      return 'aiadmk'
    }
  }
  return 'other'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assemblyId: string }> },
) {
  try {
    const { assemblyId } = await params

    const payload = await getPayload({ config: configPromise })

    const assemblies = await payload.find({
      collection: 'assemblies',
      where: {
        assemblyId: { equals: assemblyId },
      },
      limit: 1,
    })

    if (assemblies.docs.length === 0) {
      return NextResponse.json({ error: 'Assembly not found' }, { status: 404 })
    }

    const assembly = assemblies.docs[0]
    const voters = assembly.voters as {
      male: number
      female: number
      trans: number
      total: number
      isReservedAc: boolean
    } | null

    // Fetch election history - each record is a candidate in an election
    const electionHistoryResult = await payload.find({
      collection: 'election-history',
      where: {
        assemblyId: { equals: assemblyId },
      },
      sort: '-electionYear',
      limit: 1000,
    })

    // Group by year and find winners (highest votes per year)
    const electionsByYear: Record<number, { winner: string; party: string; votes: number }> = {}
    electionHistoryResult.docs.forEach((doc) => {
      const record = doc as unknown as ElectionHistoryRecord
      const year = record.electionYear
      if (!electionsByYear[year] || record.candidateVotes > electionsByYear[year].votes) {
        electionsByYear[year] = {
          winner: record.candidateName,
          party: record.candidateParty || 'IND',
          votes: record.candidateVotes,
        }
      }
    })

    // Fetch alliance data
    const allianceResult = await payload.find({
      collection: 'alliances',
      limit: 500,
    })

    // Build alliance mapping by year
    const allianceByYear: Record<number, Record<string, string>> = {}
    allianceResult.docs.forEach((doc) => {
      const alliance = doc as unknown as AllianceDoc
      if (!allianceByYear[alliance.year]) {
        allianceByYear[alliance.year] = {}
      }
      alliance.parties?.forEach((p) => {
        allianceByYear[alliance.year][p.partyName] = alliance.allianceName
      })
    })

    // Calculate party wins and alliance bloc wins (since 1977 when ADMK formed)
    const partyWins: Record<string, number> = {}
    let dmkBlocWins = 0
    let aiadmkBlocWins = 0
    let lastWinnerParty = 'N/A'
    let lastWinnerName = ''
    let totalElections = 0

    const years = Object.keys(electionsByYear)
      .map(Number)
      .sort((a, b) => b - a)
    const electionsFrom1977 = years.filter((y) => y >= 1977)

    if (years.length > 0) {
      // Get last winner (most recent election)
      const lastYear = years[0]
      lastWinnerName = electionsByYear[lastYear].winner
      lastWinnerParty = electionsByYear[lastYear].party
    }

    totalElections = electionsFrom1977.length

    const dmkBlocBreakdown: Record<string, number> = {}
    const aiadmkBlocBreakdown: Record<string, number> = {}

    electionsFrom1977.forEach((year) => {
      const winnerParty = electionsByYear[year].party
      partyWins[winnerParty] = (partyWins[winnerParty] || 0) + 1

      const partyToAlliance = allianceByYear[year] || {}
      const blocType = getBlocType(winnerParty, partyToAlliance)
      if (blocType === 'dmk') {
        dmkBlocWins++
        dmkBlocBreakdown[winnerParty] = (dmkBlocBreakdown[winnerParty] || 0) + 1
      }
      if (blocType === 'aiadmk') {
        aiadmkBlocWins++
        aiadmkBlocBreakdown[winnerParty] = (aiadmkBlocBreakdown[winnerParty] || 0) + 1
      }
    })

    // Get top 2 parties
    const sortedParties = Object.entries(partyWins).sort((a, b) => b[1] - a[1])
    const party1 = sortedParties[0]
      ? { name: sortedParties[0][0], wins: sortedParties[0][1] }
      : null
    const party2 = sortedParties[1]
      ? { name: sortedParties[1][0], wins: sortedParties[1][1] }
      : null

    // Extract English name
    const getEnglishName = (bilingualName: string): string => {
      if (!bilingualName) return 'Unknown'
      if (bilingualName.includes(' / ')) {
        return bilingualName.split(' / ')[1] || bilingualName
      }
      return bilingualName
    }

    const assemblyName = getEnglishName(assembly.name as string)
    const districtName = getEnglishName(assembly.districtName as string)

    // Format number
    const formatNumber = (num: number) => {
      if (num >= 100000) return (num / 100000).toFixed(1) + 'L'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toLocaleString()
    }

    const acNumber = assemblyId.replace('ac', '').replace(/^0+/, '')

    return NextResponse.json({
      assemblyId,
      assemblyName,
      districtName,
      acNumber,
      isReserved: voters?.isReservedAc || false,
      totalVoters: voters ? formatNumber(voters.total) : 'N/A',
      maleVoters: voters ? formatNumber(voters.male) : 'N/A',
      femaleVoters: voters ? formatNumber(voters.female) : 'N/A',
      currentMla: lastWinnerName,
      currentParty: lastWinnerParty,
      totalElections,
      // Party wins
      party1: party1,
      party2: party2,
      // Alliance bloc wins
      dmkBlocWins,
      aiadmkBlocWins,
      dmkBlocBreakdown,
      aiadmkBlocBreakdown,
    })
  } catch (error) {
    console.error('Twitter card data error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
