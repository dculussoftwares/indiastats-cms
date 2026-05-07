import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'
import { getStateBySlug } from '@/config/states'
import { ElectionResultsMap } from '@/components/ElectionResultsMap'
import { buildLiveResultsDataset, type LiveResultDoc } from '@/lib/liveResults'

// Full-screen TV page — always fresh (no ISR cache)
export const revalidate = 0

interface Props {
  params: Promise<{ stateSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)
  if (!stateConfig) return { title: 'Not Found' }

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const canonicalUrl = `${baseUrl}/${stateSlug}/election-results`
  const ogImageUrl = `${baseUrl}/api/og/state/${stateSlug}`
  const title = `${stateConfig.name} Election Results 2026 — Live Count | IndiaStats`
  const description = `Live assembly election results for ${stateConfig.name} 2026. Interactive TV-mode map with real-time seat counts, party tallies, and constituency-level results.`

  return {
    title,
    description,
    keywords: [
      `${stateConfig.name} election results 2026`,
      `${stateConfig.name} live election count`,
      'assembly results map',
      `${stateConfig.name} election 2026`,
      'seat tally live',
      `${stateConfig.name} election seat count`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${stateConfig.name} 2026 Election Results — Live`,
      description: `Interactive live results map for the ${stateConfig.name} assembly elections.`,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${stateConfig.name} 2026 Election Results`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${stateConfig.name} 2026 Election Results — Live`,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ElectionResultsPage({ params }: Props) {
  const { stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)

  if (!stateConfig || stateConfig.code !== 'TN') {
    notFound()
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'live-election-results',
    where: {
      stateCode: { equals: stateConfig.code },
      year: { equals: 2026 },
    },
    limit: 300,
    pagination: false,
    depth: 0,
  })

  const data = buildLiveResultsDataset(docs as unknown as LiveResultDoc[])

  return (
    <div className="relative h-screen overflow-hidden">
      <ElectionResultsMap data={data} geoJson={TamilNaduGeoJson} />
    </div>
  )
}
