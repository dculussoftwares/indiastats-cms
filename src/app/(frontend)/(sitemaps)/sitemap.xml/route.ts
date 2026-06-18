import { getServerSideURL } from '@/utilities/getURL'

// next-sitemap's getServerSideSitemapIndex doesn't support per-entry lastmod.
// Generate the sitemap index XML directly so Googlebot can prioritise re-fetching.
export async function GET() {
  const SITE_URL = getServerSideURL()
  const now = new Date().toISOString()

  // Sitemaps that update frequently use current timestamp.
  // Stable sitemaps (districts) use a fixed date.
  const sitemaps = [
    { loc: `${SITE_URL}/pages-sitemap.xml`,      lastmod: now },
    { loc: `${SITE_URL}/posts-sitemap.xml`,       lastmod: now },
    { loc: `${SITE_URL}/districts-sitemap.xml`,   lastmod: '2026-04-14T12:25:01.000Z' },
    { loc: `${SITE_URL}/assemblies-sitemap.xml`,  lastmod: now },
    { loc: `${SITE_URL}/predictions-sitemap.xml`, lastmod: now },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
