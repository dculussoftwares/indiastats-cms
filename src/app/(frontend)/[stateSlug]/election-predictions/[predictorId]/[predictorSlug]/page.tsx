import * as React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import ElectionPredictionMap from '@/components/ElectionPredictionMap'
import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'
import { getStateBySlug } from '@/config/states'
import {
  getElectionPredictionsData,
  predictorNameSlug,
  predictorHref,
} from '@/lib/electionPredictions'

export const revalidate = 3600

interface Props {
  params: Promise<{ stateSlug: string; predictorId: string; predictorSlug: string }>
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

  const predictor = initialData.selectedPredictor
  if (!predictor) return { title: 'Not Found' }

  const predictorName = predictor.name
  const stateName = stateConfig.name
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  // Canonical URL always includes the name slug
  const canonicalUrl = `${baseUrl}` + predictorHref(stateSlug, predictorId, predictorName)

  const ogImageUrl = `${baseUrl}/api/og/prediction/${predictorId}`

  const { calledSeats, tooCloseToCall } = initialData.summary
  const description = `${predictorName}'s 2026 ${stateName} election forecast — ${calledSeats} seats called, ${tooCloseToCall} too close to call. Interactive assembly-level prediction map with party distributions and watchlist constituencies.`

  return {
    title: `${predictorName} - ${stateName} 2026 Election Prediction Map | IndiaStats`,
    description,
    keywords: [
      `${predictorName} election prediction`,
      `${stateName} election 2026 forecast`,
      `${stateName} assembly prediction map`,
      'Tamil Nadu election predictor',
      'seat forecast 2026',
      'assembly constituency prediction',
      predictorNameSlug(predictorName),
      predictorName,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${predictorName} - ${stateName} 2026 Election Prediction Map`,
      description,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${predictorName} - ${stateName} Election Prediction 2026`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${predictorName} - ${stateName} 2026 Election Prediction Map`,
      description,
      images: [ogImageUrl],
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
    <div className="relative h-[100dvh] overflow-hidden">
      <ElectionPredictionMap
        initialData={initialData}
        map={TamilNaduGeoJson}
        stateCode={stateConfig.code}
        stateName={stateConfig.name}
      />
    </div>
  )
}
