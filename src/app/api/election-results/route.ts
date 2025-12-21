import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface ElectionResult {
    assemblyId: string
    party: string
    candidateName: string
    votes: number
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const yearParam = searchParams.get('year')

        if (!yearParam) {
            return NextResponse.json(
                { error: 'Year parameter is required' },
                { status: 400 }
            )
        }

        const year = parseInt(yearParam, 10)

        // Validate year is one of the supported election years
        const supportedYears = [1952, 1957, 1962, 1967, 1971, 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021]
        if (!supportedYears.includes(year)) {
            return NextResponse.json(
                { error: `Year must be one of: ${supportedYears.join(', ')}` },
                { status: 400 }
            )
        }

        const payload = await getPayload({ config })

        // Fetch all election records for the specified year
        const electionRecords = await payload.find({
            collection: 'election-history',
            where: {
                electionYear: { equals: year },
            },
            limit: 10000, // Ensure we get all records
        })

        // Group by assemblyId and find winner (candidate with most votes)
        const resultsByAssembly: Record<string, ElectionResult> = {}

        electionRecords.docs.forEach((record: any) => {
            const assemblyId = record.assemblyId
            const votes = record.candidateVotes || 0

            // If this assembly hasn't been seen or this candidate has more votes
            if (!resultsByAssembly[assemblyId] || votes > resultsByAssembly[assemblyId].votes) {
                resultsByAssembly[assemblyId] = {
                    assemblyId,
                    party: record.candidateParty || 'IND',
                    candidateName: record.candidateName || 'Unknown',
                    votes,
                }
            }
        })

        // Calculate party-wise seat counts
        const partyCounts: Record<string, number> = {}
        Object.values(resultsByAssembly).forEach((result) => {
            const party = result.party || 'IND'
            partyCounts[party] = (partyCounts[party] || 0) + 1
        })

        // Get top 2 parties by seat count
        const sortedParties = Object.entries(partyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([party]) => party)

        // Group candidates by assembly to calculate margins
        const candidatesByAssembly: Record<string, Array<{
            candidateName: string
            party: string
            votes: number
            assemblyName: string
        }>> = {}

        electionRecords.docs.forEach((record: any) => {
            const assemblyId = record.assemblyId
            if (!candidatesByAssembly[assemblyId]) {
                candidatesByAssembly[assemblyId] = []
            }
            candidatesByAssembly[assemblyId].push({
                candidateName: record.candidateName || 'Unknown',
                party: record.candidateParty || 'IND',
                votes: record.candidateVotes || 0,
                assemblyName: record.assemblyName || assemblyId,
            })
        })

        // Calculate closest races between top 2 parties
        const closestRaces: Array<{
            assemblyId: string
            assemblyName: string
            winner: { name: string; party: string; votes: number }
            runnerUp: { name: string; party: string; votes: number }
            margin: number
        }> = []

        Object.entries(candidatesByAssembly).forEach(([assemblyId, candidates]) => {
            // Sort by votes descending
            const sorted = [...candidates].sort((a, b) => b.votes - a.votes)
            if (sorted.length >= 2) {
                const winner = sorted[0]
                const runnerUp = sorted[1]
                // Only include if winner or runner-up is one of top 2 parties
                if (sortedParties.includes(winner.party) || sortedParties.includes(runnerUp.party)) {
                    closestRaces.push({
                        assemblyId,
                        assemblyName: winner.assemblyName,
                        winner: { name: winner.candidateName, party: winner.party, votes: winner.votes },
                        runnerUp: { name: runnerUp.candidateName, party: runnerUp.party, votes: runnerUp.votes },
                        margin: winner.votes - runnerUp.votes,
                    })
                }
            }
        })

        // Sort by margin (closest first) and take top 40
        closestRaces.sort((a, b) => a.margin - b.margin)
        const topClosestRaces = closestRaces.slice(0, 200)

        // Fetch alliance data for this year
        const allianceRecords = await payload.find({
            collection: 'alliances',
            where: {
                electionYear: { equals: year },
            },
            limit: 100,
        })

        // Build party-to-alliance mapping and alliance colors
        const partyToAlliance: Record<string, string> = {}
        const allianceColors: Record<string, string> = {}
        allianceRecords.docs.forEach((alliance: any) => {
            const allianceName = alliance.allianceName
            const color = alliance.color || '#6b7280'
            allianceColors[allianceName] = color
            if (alliance.parties && Array.isArray(alliance.parties)) {
                alliance.parties.forEach((p: { partyName: string }) => {
                    partyToAlliance[p.partyName] = allianceName
                })
            }
        })

        // Calculate alliance-wise seat counts
        const allianceCounts: Record<string, { seats: number; parties: string[]; color: string }> = {}
        Object.values(resultsByAssembly).forEach((result) => {
            const party = result.party || 'IND'
            const alliance = partyToAlliance[party] || 'Others'

            if (!allianceCounts[alliance]) {
                allianceCounts[alliance] = {
                    seats: 0,
                    parties: [],
                    color: allianceColors[alliance] || '#6b7280'
                }
            }
            allianceCounts[alliance].seats++
            if (!allianceCounts[alliance].parties.includes(party)) {
                allianceCounts[alliance].parties.push(party)
            }
        })

        // Convert to sorted array
        const allianceSeats = Object.entries(allianceCounts)
            .map(([name, data]) => ({
                allianceName: name,
                seats: data.seats,
                parties: data.parties,
                color: data.color,
            }))
            .sort((a, b) => b.seats - a.seats)

        return NextResponse.json({
            year,
            totalAssemblies: Object.keys(resultsByAssembly).length,
            results: resultsByAssembly,
            partyCounts,
            topTwoParties: sortedParties,
            closestRaces: topClosestRaces,
            allianceSeats,
            partyToAlliance,
            allianceColors,
        })
    } catch (error) {
        console.error('Error fetching election results:', error)
        return NextResponse.json(
            { error: 'Failed to fetch election results' },
            { status: 500 }
        )
    }
}
