import * as React from 'react'
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'

import { getStateBySlug } from '@/config/states'
import { getElectionPredictionsData, predictorHref } from '@/lib/electionPredictions'

export const revalidate = 3600

interface Props {
  params: Promise<{ stateSlug: string; predictorId: string }>
}

// This route is a permanent redirect to the SEO-friendly slug URL.
// Mark it noindex so search engines index only the canonical slug variant.
export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: true },
  }
}

/**
 * Permanently redirects `/election-predictions/[predictorId]`
 * → `/election-predictions/[predictorId]/[predictor-name-slug]`
 * so the SEO-friendly URL is always the canonical one.
 */
export default async function PredictorRedirectPage({ params }: Props) {
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

  redirect(predictorHref(stateSlug, predictorId, initialData.selectedPredictor.name))
}
