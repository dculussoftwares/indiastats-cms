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
            'https://example.com'

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
            },
        })

        const districtNameToIdMap: Record<string, string> = {}
        districtsResult.docs.forEach((d) => {
            if (d.districtName && d.districtId) {
                districtNameToIdMap[d.districtName] = d.districtId
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
                updatedAt: true,
            },
        })

        const dateFallback = new Date().toISOString()

        const sitemap = results.docs
            ? results.docs
                .filter((assembly) => Boolean(assembly?.assemblyId))
                .map((assembly) => {
                    const districtId = districtNameToIdMap[assembly.districtName] || ''
                    return {
                        loc: `${SITE_URL}/tamil-nadu/assembly/${districtId}/${assembly.assemblyId}`,
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
