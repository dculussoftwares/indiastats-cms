import { getServerSideSitemapIndex } from 'next-sitemap'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const SITE_URL = getServerSideURL()

  const sitemaps = [
    `${SITE_URL}/pages-sitemap.xml`,
    `${SITE_URL}/posts-sitemap.xml`,
    `${SITE_URL}/districts-sitemap.xml`,
    `${SITE_URL}/assemblies-sitemap.xml`,
    `${SITE_URL}/predictions-sitemap.xml`,
  ]

  return getServerSideSitemapIndex(sitemaps)
}
