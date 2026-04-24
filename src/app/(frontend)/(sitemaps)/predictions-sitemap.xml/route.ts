import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { predictorHref } from '@/utilities/predictorUrl'

const getPredictionsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://indiastats.org'

    // Get all active predictors — include name so we can build the slug URL
    const predictorsResult = await payload.find({
      collection: 'predictors',
      where: { isActive: { equals: true } },
      overrideAccess: false,
      depth: 0,
      limit: 200,
      pagination: false,
      select: { id: true, name: true, updatedAt: true },
    })

    const dateFallback = new Date().toISOString()

    // Listing page (one per state — currently only TN)
    const entries = [
      {
        loc: `${SITE_URL}/tamil-nadu/election-predictions`,
        lastmod: dateFallback,
        priority: 0.8,
        changefreq: 'weekly' as const,
      },
    ]

    // One page per predictor using the SEO-friendly slug URL
    predictorsResult.docs.forEach((predictor: any) => {
      entries.push({
        loc: `${SITE_URL}` + predictorHref('tamil-nadu', predictor.id, predictor.name ?? ''),
        lastmod: predictor.updatedAt || dateFallback,
        priority: 0.7,
        changefreq: 'weekly' as const,
      })
    })

    return entries
  },
  ['predictions-sitemap'],
  { tags: ['predictions-sitemap'] },
)

export async function GET() {
  const sitemap = await getPredictionsSitemap()
  return getServerSideSitemap(sitemap)
}
