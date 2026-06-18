const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://indiastats.org'

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: [
    '/posts-sitemap.xml',
    '/pages-sitemap.xml',
    '/districts-sitemap.xml',
    '/assemblies-sitemap.xml',
    '/predictions-sitemap.xml',
    '/admin/*',
    '/api/*',
    '/*',
    '/posts/*',
    '/tamil-nadu/district/*',
    '/tamil-nadu/assembly/*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    // Only reference the sitemap index — it already lists all child sitemaps.
    // Listing child sitemaps individually here is redundant and creates a maintenance hazard.
    additionalSitemaps: [],
  },
}
