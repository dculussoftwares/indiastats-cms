'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, TrendingUp, User } from 'lucide-react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'
import { trackViewed, trackClicked, getPageContext, PAGE_NAMES } from '@/analytics'
import { getPartyColor } from '@/lib/partyColors'
import type { PredictorSummary } from '@/lib/electionPredictions'
import { predictorHref } from '@/utilities/predictorUrl'

interface AssemblyData {
  assemblyId: string
  assemblySlug: string
  districtId: string
  districtSlug: string
  districtName: string
  name: string
  voters?: {
    male?: number
    female?: number
    trans?: number
    total?: number
  }
}

interface DashboardClientProps {
  assemblies: AssemblyData[]
  districts: District[]
  stateSlug: string
  predictors: PredictorSummary[]
}

export function DashboardClient({
  assemblies,
  districts,
  stateSlug,
  predictors,
}: DashboardClientProps) {
  React.useEffect(() => {
    trackViewed({
      name: 'dashboard_page',
      page_name: PAGE_NAMES.DASHBOARD,
      page_type: 'other',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

  const handleAssemblySearch = (district: District, assembly: Assembly) => {
    console.log('Assembly selected:', { district, assembly })
  }

  return (
    <>
      {/* Election Predictions Section */}
      {predictors.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="border-l-4 border-red-600 pl-3 text-lg font-bold">
              Election Predictions 2026
            </h2>
            <Link
              href={`/${stateSlug}/election-predictions`}
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
              onClick={() => {
                const ctx = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: ctx.page_name || PAGE_NAMES.DASHBOARD,
                  link_name: 'view_all_predictions',
                  link_location: 'dashboard_predictions_section',
                })
              }}
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictors.map((predictor) => (
              <Link
                key={predictor.id}
                href={predictorHref(stateSlug, predictor.id, predictor.name)}
                className="group rounded border border-gray-200 bg-white p-4 transition-all hover:border-red-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-red-900"
                onClick={() => {
                  const ctx = getPageContext()
                  trackClicked({
                    name: 'link',
                    page_name: ctx.page_name || PAGE_NAMES.DASHBOARD,
                    link_name: 'predictor_card',
                    link_location: 'dashboard_predictions_section',
                  })
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-red-100 bg-white">
                    {predictor.imagePath ? (
                      <Image
                        src={predictor.imagePath}
                        alt={predictor.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-red-50 text-red-600">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900 group-hover:text-red-600 dark:text-gray-100 dark:group-hover:text-red-400">
                      {predictor.name}
                    </p>
                    {predictor.latestYear && (
                      <p className="text-xs text-muted-foreground">
                        {predictor.latestYear} Forecast
                      </p>
                    )}
                  </div>
                </div>

                {predictor.totalPredictions > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">
                        Called
                      </p>
                      <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
                        {predictor.calledSeats}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{predictor.totalPredictions}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">
                        Close
                      </p>
                      <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
                        {predictor.tooCloseToCall}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">
                        Leading
                      </p>
                      {predictor.leadingParty ? (
                        <span
                          className="mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
                          style={{ backgroundColor: getPartyColor(predictor.leadingParty) }}
                        >
                          {predictor.leadingParty}
                        </span>
                      ) : (
                        <p className="mt-0.5 text-sm text-muted-foreground">&mdash;</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-red-600 group-hover:text-red-700 dark:text-red-400">
                  <TrendingUp className="h-3 w-3" />
                  View prediction map
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* District Search Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">District Search</h2>
        <DistrictSearch districts={districts} />
      </section>

      {/* Assembly Search Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Assembly Search</h2>
        <AssemblySearch
          assemblies={assemblies}
          districts={districts}
          onSearch={handleAssemblySearch}
        />
      </section>
    </>
  )
}
