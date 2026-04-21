import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ElectionPredictionMap from '@/components/ElectionPredictionMap'
import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'
import { getStateBySlug } from '@/config/states'
import { getElectionPredictionsData } from '@/lib/electionPredictions'

export const revalidate = 3600

interface Props {
  params: Promise<{ stateSlug: string; predictorId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, predictorId } = await params
  const stateConfig = getStateBySlug(stateSlug)

  if (!stateConfig || stateConfig.code !== 'TN') {
    return { title: 'Not Found' }
  }

  const initialData = await getElectionPredictionsData({
    stateCode: stateConfig.code,
    predictorId,
  })

  const predictorName = initialData.selectedPredictor?.name ?? 'Predictor'
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const canonicalUrl = `${baseUrl}/${stateSlug}/election-predictions/${predictorId}`

  return {
    title: `${predictorName} - Tamil Nadu Election Prediction Map | IndiaStats`,
    description: `Interactive Tamil Nadu assembly prediction map by ${predictorName} with seat calls, close contests, and predictor-led insights.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${predictorName} - Tamil Nadu Election Prediction Map`,
      description: `Explore assembly-level forecasts by ${predictorName} with watchlist constituencies and party call distributions.`,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${predictorName} - Tamil Nadu Election Prediction Map`,
      description: `Interactive assembly-level forecast map by ${predictorName} with close contests, type mix, and party calls.`,
    },
  }
}

export default async function PredictorPredictionMapPage({ params }: Props) {
  const { stateSlug, predictorId } = await params
  const stateConfig = getStateBySlug(stateSlug)

  if (!stateConfig || stateConfig.code !== 'TN') {
    notFound()
  }

  const initialData = await getElectionPredictionsData({
    stateCode: stateConfig.code,
    predictorId,
  })

  if (!initialData.selectedPredictor) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <ElectionPredictionMap
        initialData={initialData}
        map={TamilNaduGeoJson}
        stateCode={stateConfig.code}
        stateName={stateConfig.name}
      />
    </div>
  )
}
