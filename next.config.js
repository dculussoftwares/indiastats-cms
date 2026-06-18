import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.__NEXT_PRIVATE_ORIGIN ||
    'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true, // Allow build with ESLint warnings
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // AdSense also loads scripts from partner.googleadservices.com, tpc.googlesyndication.com, adservice.google.com
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://adservice.google.com https://www.googletagmanager.com https://www.googletagservices.com https://www.clarity.ms https://cdn.clarity.ms",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              // AdSense connects to doubleclick and adservice domains for ad requests
              "connect-src 'self' https://region1.analytics.google.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://stats.g.doubleclick.net https://adservice.google.com https://pagead2.googlesyndication.com https://t.indiastats.org https://api.mixpanel.com https://api-js.mixpanel.com wss://t.indiastats.org",
              // AdSense renders ad creatives inside iframes hosted on these domains
              "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      // Party logos and static images — immutable assets, 1 year cache
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // GeoJSON — changes at election delimitation only, 24h CDN + 7d stale-while-revalidate
      {
        source: '/geojson/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // llms.txt — update when site changes, 1h CDN
      {
        source: '/llms.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
