import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const assemblyId = searchParams.get('assemblyId')
        const districtId = searchParams.get('districtId')
        const stateCode = searchParams.get('stateCode') || 'TN' // Default to TN

        const payload = await getPayload({ config })

        // Build where clause based on parameters (always include stateCode)
        const whereClause: Record<string, { equals: string }> = {
            stateCode: { equals: stateCode }
        }
        if (assemblyId) {
            whereClause.assemblyId = { equals: assemblyId }
        }
        if (districtId) {
            whereClause.districtId = { equals: districtId }
        }

        const boothRecords = await payload.find({
            collection: 'booths',
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            limit: 1000,
            sort: 'boothId',
        })

        const booths = boothRecords.docs.map((doc) => ({
            id: doc.id,
            boothId: doc.boothId,
            assemblyId: doc.assemblyId,
            districtId: doc.districtId,
            wardAddress: doc.wardAddress || '',
            streetName: doc.streetName || '',
            pdfLink: doc.pdfLink || '',
        }))

        return NextResponse.json({
            booths,
            total: boothRecords.totalDocs,
        })
    } catch (error) {
        console.error('Error fetching booths:', error)
        return NextResponse.json(
            { error: 'Failed to fetch booths' },
            { status: 500 }
        )
    }
}
