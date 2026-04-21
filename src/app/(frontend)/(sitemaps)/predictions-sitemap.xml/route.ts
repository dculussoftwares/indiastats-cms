import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

const getPredictionsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://indiastats.org'

    // Get all active predictors that have at least one prediction
    const predictorsResult = await payload.find({
      collection: 'predictors',
      where: { isActive: { equals: true } },
      overrideAccess: false,
      depth: 0,
      limit: 200,
      pagination: false,
      select: { id: true, updatedAt: true },
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

    // One page per predictor
    predictorsResult.docs.forEach((predictor: any) => {
      entries.push({
        loc: `${SITE_URL}/tamil-nadu/election-predictions/${predictor.id}`,
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
