import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface WinnerData {
    assemblyId: string
    assemblyName: string
    party: string
    candidateName: string
    votes: number
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const year1Param = searchParams.get('year1')
        const year2Param = searchParams.get('year2')

        if (!year1Param || !year2Param) {
            return NextResponse.json(
                { error: 'Both year1 and year2 parameters are required' },
                { status: 400 }
            )
        }

        const year1 = parseInt(year1Param, 10)
        const year2 = parseInt(year2Param, 10)

        const payload = await getPayload({ config })

        // Fetch election records for both years
        const [records1, records2] = await Promise.all([
            payload.find({
                collection: 'election-history',
                where: { electionYear: { equals: year1 } },
                limit: 10000,
            }),
            payload.find({
                collection: 'election-history',
                where: { electionYear: { equals: year2 } },
                limit: 10000,
            }),
        ])

        // Get winners for each year (candidate with most votes per assembly)
        const getWinners = (docs: any[]): Record<string, WinnerData> => {
            const winners: Record<string, WinnerData> = {}
            docs.forEach((record) => {
                const assemblyId = record.assemblyId
                const votes = record.candidateVotes || 0
                if (!winners[assemblyId] || votes > winners[assemblyId].votes) {
                    winners[assemblyId] = {
                        assemblyId,
                        assemblyName: record.assemblyName || assemblyId,
                        party: record.candidateParty || 'IND',
                        candidateName: record.candidateName || 'Unknown',
                        votes,
                    }
                }
            })
            return winners
        }

        const winners1 = getWinners(records1.docs)
        const winners2 = getWinners(records2.docs)

        // Calculate party seat counts for each year
        const partyCounts1: Record<string, number> = {}
        const partyCounts2: Record<string, number> = {}

        Object.values(winners1).forEach(w => {
            partyCounts1[w.party] = (partyCounts1[w.party] || 0) + 1
        })
        Object.values(winners2).forEach(w => {
            partyCounts2[w.party] = (partyCounts2[w.party] || 0) + 1
        })

        // Calculate seat changes per party
        const allParties = new Set([...Object.keys(partyCounts1), ...Object.keys(partyCounts2)])
        const partyChanges: { party: string; year1Seats: number; year2Seats: number; change: number }[] = []

        allParties.forEach(party => {
            const seats1 = partyCounts1[party] || 0
            const seats2 = partyCounts2[party] || 0
            if (seats1 > 0 || seats2 > 0) {
                partyChanges.push({
                    party,
                    year1Seats: seats1,
                    year2Seats: seats2,
                    change: seats2 - seats1,
                })
            }
        })

        // Sort by absolute change (biggest changes first)
        partyChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

        // Find constituencies that changed hands
        const flippedSeats: {
            assemblyId: string
            assemblyName: string
            fromParty: string
            toParty: string
            fromCandidate: string
            toCandidate: string
        }[] = []

        Object.keys(winners2).forEach(assemblyId => {
            const winner1 = winners1[assemblyId]
            const winner2 = winners2[assemblyId]

            if (winner1 && winner2 && winner1.party !== winner2.party) {
                flippedSeats.push({
                    assemblyId,
                    assemblyName: winner2.assemblyName,
                    fromParty: winner1.party,
                    toParty: winner2.party,
                    fromCandidate: winner1.candidateName,
                    toCandidate: winner2.candidateName,
                })
            }
        })

        return NextResponse.json({
            year1,
            year2,
            totalAssemblies1: Object.keys(winners1).length,
            totalAssemblies2: Object.keys(winners2).length,
            partyChanges,
            flippedSeats,
            totalFlipped: flippedSeats.length,
        })
    } catch (error) {
        console.error('Error fetching election insights:', error)
        return NextResponse.json(
            { error: 'Failed to fetch election insights' },
            { status: 500 }
        )
    }
}
