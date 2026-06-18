import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assemblyId')
    const districtName = searchParams.get('districtName')
    const all = searchParams.get('all')
    const stateCode = searchParams.get('stateCode') || 'TN' // Default to TN

    try {
        const payload = await getPayload({ config })

        // Fetch all caste data
        if (all === 'true') {
            const casteData = await payload.find({
                collection: 'caste-census',
                where: { stateCode: { equals: stateCode } },
                limit: 500,
                sort: 'assemblyName',
            })

            return NextResponse.json({
                assemblies: casteData.docs,
                total: casteData.totalDocs,
            })
        }

        if (assemblyId) {
            // Get caste data for a single assembly
            const casteData = await payload.find({
                collection: 'caste-census',
                where: { assemblyId: { equals: assemblyId }, stateCode: { equals: stateCode } },
                limit: 1,
            })

            if (casteData.docs.length === 0) {
                return NextResponse.json({ error: 'Assembly not found' }, { status: 404 })
            }

            return NextResponse.json(casteData.docs[0])
        }

        if (districtName) {
            // Get assemblies in this district first
            const assemblies = await payload.find({
                collection: 'assemblies',
                where: { districtName: { contains: districtName }, stateCode: { equals: stateCode } },
                limit: 100,
            })

            const assemblyIds = assemblies.docs.map((a: { assemblyId: string }) => a.assemblyId)

            // Get caste data for all assemblies in district
            const casteData = await payload.find({
                collection: 'caste-census',
                where: { assemblyId: { in: assemblyIds } },
                limit: 100,
            })

            return NextResponse.json({
                districtName,
                assemblies: casteData.docs,
            })
        }

        return NextResponse.json({ error: 'Either assemblyId, districtName, or all=true required' }, { status: 400 })
    } catch (error) {
        console.error('Error fetching caste data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
