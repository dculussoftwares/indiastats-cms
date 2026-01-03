import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface CandidateData {
    name: string
    party: string
    votes: number
    rank: number
}

export interface AssemblyElectionData {
    acName: string
    acNo: number | null
    assemblyId: string
    districtName: string
    electionYear: number
    totalElectors: number | null
    totalVotes: number | null
    pollPercent: number | null
    candidates: CandidateData[]
    margin: number | null
    marginPercent: number | null
}

export interface ElectionDataTableResponse {
    data: AssemblyElectionData[]
    filters: {
        districts: string[]
        years: number[]
        parties: string[]
    }
    totalRecords: number
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const yearParam = searchParams.get('year')
        const districtParam = searchParams.get('district')
        const partyParam = searchParams.get('party')
        const assemblyIdParam = searchParams.get('assemblyId')
        const stateCode = searchParams.get('stateCode') || 'TN'

        const payload = await getPayload({ config })

        // Build where clause for election history
        const whereClause: Record<string, any> = {
            stateCode: { equals: stateCode },
        }

        if (yearParam) {
            whereClause.electionYear = { equals: parseInt(yearParam, 10) }
        }

        if (assemblyIdParam) {
            whereClause.assemblyId = { equals: assemblyIdParam }
        }

        // Fetch all election records
        const electionRecords = await payload.find({
            collection: 'election-history',
            where: whereClause,
            limit: 50000, // Get all records
        })

        // Fetch all assemblies for district mapping
        const assemblies = await payload.find({
            collection: 'assemblies',
            where: { stateCode: { equals: stateCode } },
            limit: 500,
        })

        // Create assembly lookup map: assemblyId -> { districtName, voters }
        const assemblyMap: Record<string, { districtName: string; totalElectors: number | null }> = {}
        assemblies.docs.forEach((assembly: any) => {
            const voters = assembly.voters
            let totalElectors: number | null = null
            if (voters && typeof voters === 'object' && 'total' in voters) {
                totalElectors = voters.total
            }
            assemblyMap[assembly.assemblyId] = {
                districtName: assembly.districtName || '',
                totalElectors,
            }
        })

        // Group records by assemblyId + electionYear
        const groupedRecords: Record<string, any[]> = {}
        electionRecords.docs.forEach((record: any) => {
            const key = `${record.assemblyId}_${record.electionYear}`
            if (!groupedRecords[key]) {
                groupedRecords[key] = []
            }
            groupedRecords[key].push(record)
        })

        // Process grouped records to create assembly election data
        const allData: AssemblyElectionData[] = []
        const allParties = new Set<string>()
        const allDistricts = new Set<string>()
        const allYears = new Set<number>()

        Object.entries(groupedRecords).forEach(([key, records]) => {
            if (records.length === 0) return

            const firstRecord = records[0]
            const assemblyId = firstRecord.assemblyId
            const electionYear = firstRecord.electionYear
            const assemblyInfo = assemblyMap[assemblyId]
            const districtName = assemblyInfo?.districtName || firstRecord.districtName || 'Unknown'

            // Apply district filter
            if (districtParam && districtName !== districtParam) {
                return
            }

            // Sort candidates by votes (descending)
            const sortedRecords = [...records].sort((a, b) => (b.candidateVotes || 0) - (a.candidateVotes || 0))

            // Get total electors and votes polled
            const totalElectors = assemblyInfo?.totalElectors || firstRecord.totalVoters || null
            const totalVotes = firstRecord.votesPolled || sortedRecords.reduce((sum, r) => sum + (r.candidateVotes || 0), 0)

            // Calculate poll percent
            let pollPercent: number | null = null
            if (totalElectors && totalVotes) {
                pollPercent = Math.round((totalVotes / totalElectors) * 1000) / 10
            }

            // Create candidates array with rank
            const candidates: CandidateData[] = sortedRecords.map((record, index) => {
                const party = record.candidateParty || 'IND'
                allParties.add(party)
                return {
                    name: record.candidateName || 'Unknown',
                    party,
                    votes: record.candidateVotes || 0,
                    rank: index + 1,
                }
            })

            // Apply party filter (filter by winner's party)
            if (partyParam && candidates.length > 0 && candidates[0].party !== partyParam) {
                return
            }

            // Calculate margin (winner - runner-up)
            let margin: number | null = null
            let marginPercent: number | null = null
            if (candidates.length >= 2) {
                margin = candidates[0].votes - candidates[1].votes
                if (totalVotes && totalVotes > 0) {
                    marginPercent = Math.round((margin / totalVotes) * 1000) / 10
                }
            }

            allDistricts.add(districtName)
            allYears.add(electionYear)

            allData.push({
                acName: firstRecord.assemblyName || assemblyId,
                acNo: firstRecord.assemblyNo || null,
                assemblyId,
                districtName,
                electionYear,
                totalElectors,
                totalVotes,
                pollPercent,
                candidates,
                margin,
                marginPercent,
            })
        })

        // Sort by acNo, then by year
        allData.sort((a, b) => {
            if (a.electionYear !== b.electionYear) {
                return b.electionYear - a.electionYear // Most recent first
            }
            return (a.acNo || 0) - (b.acNo || 0)
        })

        const response: ElectionDataTableResponse = {
            data: allData,
            filters: {
                districts: Array.from(allDistricts).sort(),
                years: Array.from(allYears).sort((a, b) => b - a),
                parties: Array.from(allParties).sort(),
            },
            totalRecords: allData.length,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching election data table:', error)
        return NextResponse.json(
            { error: 'Failed to fetch election data' },
            { status: 500 }
        )
    }
}
