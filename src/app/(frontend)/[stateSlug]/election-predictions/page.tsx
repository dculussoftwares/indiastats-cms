import * as React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ChevronRight, MapPin, TrendingUp, User } from 'lucide-react'

import { getStateBySlug } from '@/config/states'
import { getPredictorsWithSummaries } from '@/lib/electionPredictions'
import { predictorHref } from '@/utilities/predictorUrl'
import { getPartyColor } from '@/lib/partyColors'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 3600

interface Props {
  params: Promise<{ stateSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)
  const stateName = stateConfig?.name ?? ''
  const baseUrl = getServerSideURL()
  const canonicalUrl = `${baseUrl}/${stateSlug}/election-predictions`
  const ogImageUrl = `${baseUrl}/api/og/state/${stateSlug}`

  return {
    title: `${stateName} Election Predictions 2026 | IndiaStats`,
    description: `Browse 2026 ${stateName} assembly election prediction maps from multiple expert predictors. Compare seat forecasts, close contests, and party-wise call distributions across all ${stateConfig?.assemblyCount ?? ''} constituencies.`,
    keywords: [
      `${stateName} election predictions 2026`,
      `${stateName} assembly election forecast`,
      `${stateName} election 2026`,
      'election predictor',
      'assembly constituency forecast',
      'seat prediction',
      'close contest',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${stateName} Election Predictions 2026 | IndiaStats`,
      description: `Explore assembly-level 2026 election forecasts from multiple predictors — seat calls, close contests, and party distributions across all ${stateConfig?.assemblyCount ?? ''} ${stateName} constituencies.`,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${stateName} Election Predictions 2026`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${stateName} Election Predictions 2026 | IndiaStats`,
      description: `Browse interactive prediction maps from multiple expert predictors for all ${stateConfig?.assemblyCount ?? ''} ${stateName} assembly constituencies.`,
      images: [ogImageUrl],
    },
  }
}

export default async function ElectionPredictionsListingPage({ params }: Props) {
  const { stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)

  if (!stateConfig) {
    notFound()
  }

  const predictors = await getPredictorsWithSummaries({
    stateCode: stateConfig.code,
  })

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <h1 className="text-2xl font-bold md:text-3xl">Election Predictions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stateConfig.name} {new Date().getFullYear()} &middot; Assembly-level forecasts from
            independent predictors
          </p>
        </div>
      </div>

      {predictors.length === 0 ? (
        <div className="rounded border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-950">
          <MapPin className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            No predictions available yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon for assembly-level forecasts.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {predictors.map((predictor) => (
            <Link
              key={predictor.id}
              href={predictorHref(stateSlug, predictor.id, predictor.name)}
              className="group"
            >
              <div className="h-full rounded border border-gray-200 bg-white p-5 transition-all hover:border-red-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-red-900">
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-red-200 bg-white">
                    {predictor.imagePath ? (
                      <Image
                        src={predictor.imagePath}
                        alt={predictor.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-red-100 text-red-700">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-gray-900 group-hover:text-red-600 dark:text-gray-100 dark:group-hover:text-red-400">
                        {predictor.name}
                      </h2>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" />
                    </div>
                    {predictor.latestYear && (
                      <span className="mt-1 inline-block rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {predictor.latestYear} Forecast
                      </span>
                    )}
                    {predictor.bio && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {predictor.bio}
                      </p>
                    )}
                  </div>
                </div>

                {predictor.totalPredictions > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
                        Called
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                        {predictor.calledSeats}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{predictor.totalPredictions}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
                        Too Close
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                        {predictor.tooCloseToCall}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
                        Leading
                      </p>
                      {predictor.leadingParty ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="inline-block rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
                            style={{ backgroundColor: getPartyColor(predictor.leadingParty) }}
                          >
                            {predictor.leadingParty}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {predictor.leadingPartySeats}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-sm text-muted-foreground">&mdash;</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-red-600 group-hover:text-red-700 dark:text-red-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  View prediction map
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
