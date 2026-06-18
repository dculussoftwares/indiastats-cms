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

    // Use current timestamp only for pages that genuinely update frequently.
    // Static pages use a stable date so Google doesn't see spurious "modified" signals.
    const now = new Date().toISOString()
    const stableDate = '2026-04-23T21:10:30.000Z' // last major content update

    const defaultSitemap = [
      // Utility / info pages — low priority, infrequent change
      { loc: `${SITE_URL}/search`,         lastmod: stableDate, priority: 0.3, changefreq: 'monthly' as const },
      { loc: `${SITE_URL}/posts`,          lastmod: stableDate, priority: 0.5, changefreq: 'monthly' as const },
      { loc: `${SITE_URL}/about`,          lastmod: stableDate, priority: 0.3, changefreq: 'monthly' as const },
      { loc: `${SITE_URL}/contact`,        lastmod: stableDate, priority: 0.3, changefreq: 'monthly' as const },
      { loc: `${SITE_URL}/terms`,          lastmod: stableDate, priority: 0.3, changefreq: 'monthly' as const },
      { loc: `${SITE_URL}/privacy-policy`, lastmod: stableDate, priority: 0.3, changefreq: 'monthly' as const },
      // Top-level election data page
      { loc: `${SITE_URL}/election-data`,  lastmod: stableDate, priority: 0.8, changefreq: 'weekly' as const },
      // State-specific pages (one set per registered state)
      ...getAllStates().flatMap((state) => [
        {
          loc: `${SITE_URL}/${state.slug}`,
          lastmod: now,
          priority: 1.0,
          changefreq: 'daily' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/dashboard`,
          lastmod: now,
          priority: 0.9,
          changefreq: 'daily' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/assembly-map`,
          lastmod: stableDate,
          priority: 0.7,
          changefreq: 'monthly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/caste-demographics`,
          lastmod: stableDate,
          priority: 0.6,
          changefreq: 'monthly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/election-results`,
          lastmod: now,
          priority: 0.9,
          changefreq: 'hourly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/election-analysis/2026`,
          lastmod: now,
          priority: 0.8,
          changefreq: 'weekly' as const,
        },
        {
          loc: `${SITE_URL}/${state.slug}/election-analysis/2021`,
          lastmod: '2021-05-02T00:00:00.000Z',
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
              lastmod: page.updatedAt || stableDate,
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
