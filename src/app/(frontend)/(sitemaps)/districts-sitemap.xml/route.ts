import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getServerSideURL } from '@/utilities/getURL'

const getDistrictsSitemap = unstable_cache(
    async () => {
        const payload = await getPayload({ config })
        const SITE_URL = getServerSideURL()

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

        const results = await payload.find({
            collection: 'districts',
            overrideAccess: false,
            depth: 0,
            limit: 1000,
            pagination: false,
            select: {
                districtId: true,
                districtName: true,
                slug: true,
                stateCode: true,
                updatedAt: true,
            },
        })

        const dateFallback = new Date().toISOString()

        const sitemap = results.docs
            ? results.docs
                .filter((district: any) => Boolean(district?.slug))
                .map((district: any) => {
                    const stateSlug = stateCodeToSlugMap[district.stateCode] || 'tamil-nadu'
                    return {
                        loc: `${SITE_URL}/${stateSlug}/district/${district.slug}`,
                        lastmod: district.updatedAt || dateFallback,
                        priority: 0.8,
                        changefreq: 'monthly' as const,
                    }
                })
            : []

        return sitemap
    },
    ['districts-sitemap'],
    {
        tags: ['districts-sitemap'],
    },
)

export async function GET() {
    const sitemap = await getDistrictsSitemap()

    return getServerSideSitemap(sitemap)
}
