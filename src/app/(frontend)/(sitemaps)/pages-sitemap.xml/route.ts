import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getAllStates } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'

const getPagesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL = getServerSideURL()

    const results = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const dateFallback = new Date().toISOString()

    const defaultSitemap = [
      {
        loc: `${SITE_URL}/search`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/posts`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/about`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/contact`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/terms`,
        lastmod: dateFallback,
      },
      // Top-level election data page
      {
        loc: `${SITE_URL}/election-data`,
        lastmod: dateFallback,
        priority: 0.8,
        changefreq: 'weekly' as const,
      },
      // State-specific pages (one set per registered state)
      ...getAllStates().flatMap((state) => [
        {
          loc: `${SITE_URL}/${state.slug}`,
          lastmod: dateFallback,
          priority: 1.0,
          changefreq: 'daily' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/dashboard`,
          lastmod: dateFallback,
          priority: 0.9,
          changefreq: 'daily' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/assembly-map`,
          lastmod: dateFallback,
          priority: 0.7,
          changefreq: 'monthly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/caste-demographics`,
          lastmod: dateFallback,
          priority: 0.6,
          changefreq: 'monthly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/election-results`,
          lastmod: dateFallback,
          priority: 0.9,
          changefreq: 'hourly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/election-analysis/2026`,
          lastmod: dateFallback,
          priority: 0.8,
          changefreq: 'weekly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/election-analysis/2021`,
          lastmod: dateFallback,
          priority: 0.7,
          changefreq: 'monthly' as const,
        },
      ]),
    ]

    const sitemap = results.docs
      ? results.docs
          .filter((page) => Boolean(page?.slug))
          .map((page) => {
            return {
              loc: page?.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${page?.slug}`,
              lastmod: page.updatedAt || dateFallback,
            }
          })
      : []

    return [...defaultSitemap, ...sitemap]
  },
  ['pages-sitemap'],
  {
    tags: ['pages-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getPagesSitemap()

  return getServerSideSitemap(sitemap)
}
