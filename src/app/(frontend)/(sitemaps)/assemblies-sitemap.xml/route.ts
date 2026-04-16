import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getAssembliesSitemap = unstable_cache(
    async () => {
        const payload = await getPayload({ config })
        const SITE_URL =
            process.env.NEXT_PUBLIC_SERVER_URL ||
            process.env.VERCEL_PROJECT_PRODUCTION_URL ||
            'https://indiastats.org'

        // First get all districts to map districtName to districtId
        const districtsResult = await payload.find({
            collection: 'districts',
            overrideAccess: false,
            depth: 0,
            limit: 1000,
            pagination: false,
            select: {
                districtId: true,
                districtName: true,
                slug: true,
            },
        })

        const districtNameToSlugMap: Record<string, string> = {}
        districtsResult.docs.forEach((d: any) => {
            if (d.districtName && d.slug) {
                districtNameToSlugMap[d.districtName] = d.slug
            }
        })

        // Get all states to map stateCode to stateSlug
        const statesResult = await payload.find({
            collection: 'states',
            overrideAccess: false,
            depth: 0,
            limit: 100,
            pagination: false,
            select: {
                stateCode: true,
                slug: true,
            },
        })

        const stateCodeToSlugMap: Record<string, string> = {}
        statesResult.docs.forEach((s: any) => {
            if (s.stateCode && s.slug) {
                stateCodeToSlugMap[s.stateCode] = s.slug
            }
        })

        // Get all assemblies
        const results = await payload.find({
            collection: 'assemblies',
            overrideAccess: false,
            depth: 0,
            limit: 1000,
            pagination: false,
            select: {
                assemblyId: true,
                name: true,
                districtName: true,
                slug: true,
                stateCode: true,
                updatedAt: true,
            },
        })

        const dateFallback = new Date().toISOString()

        const sitemap = results.docs
            ? results.docs
                .filter((assembly: any) => Boolean(assembly?.slug))
                .map((assembly: any) => {
                    const districtSlug = districtNameToSlugMap[assembly.districtName] || ''
                    const stateSlug = stateCodeToSlugMap[assembly.stateCode] || 'tamil-nadu'
                    return {
                        loc: `${SITE_URL}/${stateSlug}/assembly/${districtSlug}/${assembly.slug}`,
                        lastmod: assembly.updatedAt || dateFallback,
                        priority: 0.7,
                        changefreq: 'monthly' as const,
                    }
                })
            : []

        return sitemap
    },
    ['assemblies-sitemap'],
    {
        tags: ['assemblies-sitemap'],
    },
)

export async function GET() {
    const sitemap = await getAssembliesSitemap()

    return getServerSideSitemap(sitemap)
}
