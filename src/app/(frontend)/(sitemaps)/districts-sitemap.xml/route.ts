import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getDistrictsSitemap = unstable_cache(
    async () => {
        const payload = await getPayload({ config })
        const SITE_URL =
            process.env.NEXT_PUBLIC_SERVER_URL ||
            process.env.VERCEL_PROJECT_PRODUCTION_URL ||
            'https://example.com'

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
                updatedAt: true,
            },
        })

        const dateFallback = new Date().toISOString()

        const sitemap = results.docs
            ? results.docs
                .filter((district: any) => Boolean(district?.slug))
                .map((district: any) => {
                    return {
                        loc: `${SITE_URL}/tamil-nadu/district/${district.slug}`,
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
