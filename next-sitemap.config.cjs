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
        disallow: ['/admin/*', '/api/*'],
      },
    ],
    additionalSitemaps: [
      `${SITE_URL}/pages-sitemap.xml`,
      `${SITE_URL}/posts-sitemap.xml`,
      `${SITE_URL}/districts-sitemap.xml`,
      `${SITE_URL}/assemblies-sitemap.xml`,
    ],
  },
}
