import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const yearParam = searchParams.get('year')
        const stateCode = searchParams.get('stateCode') || 'TN' // Default to TN

        const payload = await getPayload({ config })

        // Build where clause with stateCode filter
        const whereClause: Record<string, { equals: string | number }> = {
            stateCode: { equals: stateCode }
        }
        if (yearParam) {
            whereClause.electionYear = { equals: parseInt(yearParam, 10) }
        }

        const allianceRecords = await payload.find({
            collection: 'alliances',
            where: whereClause,
            limit: 1000,
        })

        // Format the response
        const alliances = allianceRecords.docs.map((doc: any) => ({
            electionYear: doc.electionYear,
            allianceName: doc.allianceName,
            parties: doc.parties || [],
            color: doc.color || '#6b7280',
        }))

        return NextResponse.json({
            alliances,
            total: alliances.length,
        })
    } catch (error) {
        console.error('Error fetching alliances:', error)
        return NextResponse.json(
            { error: 'Failed to fetch alliances' },
            { status: 500 }
        )
    }
}
