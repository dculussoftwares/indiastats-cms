import * as React from 'react'
import { redirect, notFound } from 'next/navigation'

import { getStateBySlug } from '@/config/states'
import { getElectionPredictionsData, predictorHref } from '@/lib/electionPredictions'

export const revalidate = 3600

interface Props {
  params: Promise<{ stateSlug: string; predictorId: string }>
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
