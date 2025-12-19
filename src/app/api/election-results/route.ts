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

        return NextResponse.json({
            year,
            totalAssemblies: Object.keys(resultsByAssembly).length,
            results: resultsByAssembly,
            partyCounts,
        })
    } catch (error) {
        console.error('Error fetching election results:', error)
        return NextResponse.json(
            { error: 'Failed to fetch election results' },
            { status: 500 }
        )
    }
}
