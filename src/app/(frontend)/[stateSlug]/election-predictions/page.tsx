import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ElectionPredictionMap from '@/components/ElectionPredictionMap'
import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'
import { getStateBySlug } from '@/config/states'
import { getElectionPredictionsData } from '@/lib/electionPredictions'

export const revalidate = 3600

interface Props {
  params: Promise<{ stateSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const canonicalUrl = `${baseUrl}/${stateSlug}/election-predictions`

  return {
    title: 'Tamil Nadu Election Prediction Map | IndiaStats',
    description:
      'Interactive Tamil Nadu assembly prediction map with seat calls, close contests, and predictor-led insights.',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Tamil Nadu Election Prediction Map',
      description:
        'Explore assembly-level forecasts, watchlist constituencies, and party call distributions on an interactive Tamil Nadu map.',
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Tamil Nadu Election Prediction Map',
      description:
        'Interactive assembly-level forecast map with close contests, type mix, and party calls.',
    },
  }
}

export default async function ElectionPredictionsPage({ params }: Props) {
  const { stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)

  if (!stateConfig || stateConfig.code !== 'TN') {
    notFound()
  }

  const initialData = await getElectionPredictionsData({
    stateCode: stateConfig.code,
  })

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <h1 className="text-2xl font-bold">Tamil Nadu Election Prediction Map</h1>
          <p className="text-sm text-muted-foreground">
            Interactive forecast view for all 234 assembly constituencies
          </p>
        </div>
      </div>

      <ElectionPredictionMap
        initialData={initialData}
        map={TamilNaduGeoJson}
        stateCode={stateConfig.code}
        stateName={stateConfig.name}
      />
    </div>
  )
}
