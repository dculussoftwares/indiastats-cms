import { getServerSideSitemapIndex } from 'next-sitemap'

export async function GET() {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'https://indiastats.org'

  const sitemaps = [
    `${SITE_URL}/pages-sitemap.xml`,
    `${SITE_URL}/posts-sitemap.xml`,
    `${SITE_URL}/districts-sitemap.xml`,
    `${SITE_URL}/assemblies-sitemap.xml`,
  ]

  return getServerSideSitemapIndex(sitemaps)
}
