import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface RouteParams {
    params: Promise<{
        boothId: string
    }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { boothId } = await params

        const payload = await getPayload({ config })

        // Find booth by boothId
        const boothRecords = await payload.find({
            collection: 'booths',
            where: {
                boothId: { equals: boothId },
            },
            limit: 1,
        })

        if (boothRecords.docs.length === 0) {
            return NextResponse.json(
                { error: 'Booth not found' },
                { status: 404 }
            )
        }

        const doc = boothRecords.docs[0]

        // Get assembly info for context
        const assemblyRecords = await payload.find({
            collection: 'assemblies',
            where: {
                assemblyId: { equals: doc.assemblyId },
            },
            limit: 1,
        })

        const assembly = assemblyRecords.docs[0]

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const voters = assembly?.voters as any

        return NextResponse.json({
            booth: {
                id: doc.id,
                boothId: doc.boothId,
                assemblyId: doc.assemblyId,
                districtId: doc.districtId,
                wardAddress: doc.wardAddress || '',
                streetName: doc.streetName || '',
                pdfLink: doc.pdfLink || '',
            },
            assemblyName: assembly?.name || '',
            isReservedAc: voters?.isReservedAc || false,
        })
    } catch (error) {
        console.error('Error fetching booth:', error)
        return NextResponse.json(
            { error: 'Failed to fetch booth' },
            { status: 500 }
        )
    }
}
