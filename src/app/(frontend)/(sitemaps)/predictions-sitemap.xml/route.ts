import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { predictorHref } from '@/utilities/predictorUrl'
import { getAllStates } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'

const getPredictionsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL = getServerSideURL()

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
    const allStates = getAllStates()

    // Listing page (one per registered state)
    const entries: {
      loc: string
      lastmod: string
      priority: number
      changefreq: 'weekly' | 'hourly' | 'daily' | 'monthly'
    }[] = allStates.map((state) => ({
      loc: `${SITE_URL}/${state.slug}/election-predictions`,
      lastmod: dateFallback,
      priority: 0.8,
      changefreq: 'weekly' as const,
    }))

    // One page per predictor × state using the SEO-friendly slug URL
    predictorsResult.docs.forEach((predictor: any) => {
      allStates.forEach((state) => {
        entries.push({
          loc: `${SITE_URL}` + predictorHref(state.slug, predictor.id, predictor.name ?? ''),
          lastmod: predictor.updatedAt || dateFallback,
          priority: 0.7,
          changefreq: 'weekly' as const,
        })
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
