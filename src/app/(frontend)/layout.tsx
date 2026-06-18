import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import Script from 'next/script'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins — saves ~150-300ms on first script load */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://t.indiastats.org" />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        )}
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MS8LQ9GB');`,
          }}
        />
        {/* Google AdSense */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <>
            <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID} />
            <Script
              id="adsense-script"
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          </>
        )}
        <InitTheme />
        <link href="/icon.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/icon.png" rel="icon" type="image/png" sizes="192x192" />
        <link href="/icon.png" rel="apple-touch-icon" />
      </head>
      <body>
        <Providers>
          <OrganizationJsonLd />
          <WebsiteJsonLd />
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'IndiaStats.org - Tamil Nadu Election Data & Statistics',
    template: '%s | IndiaStats.org',
  },
  description:
    'Comprehensive election data, voter statistics, and political insights for Tamil Nadu assembly constituencies. Explore MLA history, booth-level data, and demographic trends.',
  keywords: [
    'Tamil Nadu elections',
    'assembly constituency',
    'voter data',
    'MLA history',
    'election statistics',
    'India elections',
  ],
  authors: [{ name: 'IndiaStats.org' }],
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@IndiaStatsOrg',
    site: '@IndiaStatsOrg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
