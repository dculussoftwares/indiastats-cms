import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

interface SearchResult {
    id: string
    title: string
    subtitle?: string
    category: 'assembly' | 'district' | 'post'
    url: string
}

interface SearchResults {
    assemblies: SearchResult[]
    districts: SearchResult[]
    posts: SearchResult[]
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ assemblies: [], districts: [], posts: [] })
    }

    const payload = await getPayload({ config })
    const searchQuery = query.trim().toLowerCase()

    try {
        // First, fetch district slugs mapping
        const districtsResult = await payload.find({
            collection: 'districts',
            limit: 100,
            select: { districtId: true, slug: true },
        })

        const districtIdToSlug = new Map<string, string>()
        districtsResult.docs.forEach((d: any) => {
            if (d.districtId && d.slug) {
                districtIdToSlug.set(d.districtId, d.slug)
            }
        })

        // Search all content types in parallel
        const [assembliesResult, districtsSearchResult, postsResult] = await Promise.all([
            // Search assemblies - include slug and districtId for URL generation
            payload.find({
                collection: 'assemblies',
                where: {
                    or: [
                        { name: { contains: searchQuery } },
                        { assemblyId: { contains: searchQuery } },
                    ],
                },
                limit: 8,
                select: {
                    id: true,
                    assemblyId: true,
                    slug: true,
                    name: true,
                    districtName: true,
                    districtId: true,
                },
            }),

            // Search districts
            payload.find({
                collection: 'districts',
                where: {
                    or: [
                        { districtName: { contains: searchQuery } },
                        { districtId: { contains: searchQuery } },
                    ],
                },
                limit: 5,
                select: {
                    districtId: true,
                    districtName: true,
                    slug: true,
                },
            }),

            // Search posts
            payload.find({
                collection: 'posts',
                where: {
                    or: [
                        { title: { contains: searchQuery } },
                        { 'meta.description': { contains: searchQuery } },
                    ],
                },
                limit: 5,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    meta: true,
                },
            }),
        ])

        // Transform results - use slugs for URLs
        const assemblies: SearchResult[] = assembliesResult.docs.map((doc) => {
            const cleanName = doc.name?.split(' / ')[1] || doc.name || 'Unknown Assembly'
            // Use the district slug lookup, fallback to districtId if not found
            const districtSlug = districtIdToSlug.get(doc.districtId || '') || doc.districtId || 'unknown'
            // Use assembly slug, fallback to assemblyId
            const assemblySlug = doc.slug || doc.assemblyId
            return {
                id: doc.assemblyId || String(doc.id),
                title: cleanName,
                subtitle: doc.districtName?.split(' / ')[1] || doc.districtName || 'Tamil Nadu',
                category: 'assembly' as const,
                url: `/tamil-nadu/assembly/${districtSlug}/${assemblySlug}`,
            }
        })

        const districts: SearchResult[] = districtsSearchResult.docs.map((doc) => {
            const cleanName = doc.districtName?.split(' / ')[1] || doc.districtName || 'Unknown District'
            // Use slug for URL, fallback to districtId
            const districtSlug = doc.slug || doc.districtId
            return {
                id: doc.districtId || String(doc.id),
                title: cleanName,
                subtitle: 'Tamil Nadu',
                category: 'district' as const,
                url: `/tamil-nadu/district/${districtSlug}`,
            }
        })

        const posts: SearchResult[] = postsResult.docs.map((doc) => ({
            id: String(doc.id),
            title: doc.title || 'Untitled Post',
            subtitle: doc.meta?.description?.slice(0, 60) || undefined,
            category: 'post' as const,
            url: `/posts/${doc.slug}`,
        }))

        const results: SearchResults = {
            assemblies,
            districts,
            posts,
        }

        return NextResponse.json(results)
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json(
            { error: 'Search failed', assemblies: [], districts: [], posts: [] },
            { status: 500 },
        )
    }
}
