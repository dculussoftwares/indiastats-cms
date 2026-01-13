import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * API endpoint to provide slug mappings for the middleware
 * Caches and returns mappings from ID to slug for districts and assemblies
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (!type || !['districts', 'assemblies'].includes(type)) {
        return NextResponse.json(
            { error: 'Invalid type. Use "districts" or "assemblies"' },
            { status: 400 }
        )
    }

    try {
        const payload = await getPayload({ config })
        const mappings: Record<string, string> = {}

        if (type === 'districts') {
            const districts = await payload.find({
                collection: 'districts',
                limit: 100,
                pagination: false,
                select: { districtId: true, slug: true },
            })

            for (const district of districts.docs) {
                const doc = district as any
                if (doc.districtId && doc.slug) {
                    mappings[doc.districtId] = doc.slug
                }
            }
        } else {
            const assemblies = await payload.find({
                collection: 'assemblies',
                limit: 300,
                pagination: false,
                select: { assemblyId: true, slug: true },
            })

            for (const assembly of assemblies.docs) {
                const doc = assembly as any
                if (doc.assemblyId && doc.slug) {
                    mappings[doc.assemblyId] = doc.slug
                }
            }
        }

        return NextResponse.json(
            { mappings },
            {
                headers: {
                    // Cache for 24 hours
                    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
                },
            }
        )
    } catch (error) {
        console.error('Failed to fetch slug mappings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch mappings' },
            { status: 500 }
        )
    }
}
