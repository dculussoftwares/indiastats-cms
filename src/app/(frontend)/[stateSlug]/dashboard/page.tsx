import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { Map, MapPinned, Locate, UsersRound, TrendingUp, User, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { DashboardClient } from './DashboardClient'
import { getPredictorsWithSummaries } from '@/lib/electionPredictions'
import { getPartyColor } from '@/lib/partyColors'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const ogImageUrl = `${baseUrl}/api/og/state/${stateSlug}`
  const canonicalUrl = `${baseUrl}/${stateSlug}/dashboard`

  return {
    title: 'Dashboard | IndiaStats.org',
    description: 'Comprehensive Tamil Nadu election data, assembly constituency analysis, and electoral insights.',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Tamil Nadu Election Dashboard - IndiaStats.org',
      description: 'Explore state-wide election statistics, district-wise assembly constituencies, and voter data.',
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Tamil Nadu Election Data Dashboard',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Tamil Nadu Election Data Dashboard',
      description: 'Explore state-wide election statistics and voter data on IndiaStats.org.',
      images: [ogImageUrl],
    },
  }
}

async function getDashboardData() {
  const payload = await getPayload({ config })

  const [assembliesCount, districtsCount, boothsCount, assembliesData, districtsData] =
    await Promise.all([
      payload.count({ collection: 'assemblies' }),
      payload.count({ collection: 'districts' }),
      payload.count({ collection: 'booths' }),
      payload.find({
        collection: 'assemblies',
        limit: 1000,
      }),
      payload.find({
        collection: 'districts',
        limit: 100,
      }),
    ])

  // Calculate total voters from assemblies
  let totalVoters = 0
  assembliesData.docs.forEach((assembly: any) => {
    if (assembly.voters?.total) {
      totalVoters += Number(assembly.voters.total)
    }
  })

  // Create maps for lookup
  const districtNameToIdMap: Record<string, string> = {}
  const districtNameToSlugMap: Record<string, string> = {}
  districtsData.docs.forEach((d: any) => {
    districtNameToIdMap[d.districtName] = d.districtId
    districtNameToSlugMap[d.districtName] = d.slug || d.districtId
  })

  // Transform assemblies for search components (include voters for district details)
  // Note: Assemblies collection only has districtName, so we look up districtId from districts
  const assemblies = assembliesData.docs.map((a: any) => ({
    assemblyId: a.assemblyId,
    assemblySlug: a.slug || a.assemblyId,
    districtId: districtNameToIdMap[a.districtName] || '',
    districtSlug:
      districtNameToSlugMap[a.districtName] || districtNameToIdMap[a.districtName] || '',
    districtName: a.districtName,
    name: a.name,
    voters: a.voters
      ? {
          male: Number(a.voters.male) || 0,
          female: Number(a.voters.female) || 0,
          trans: Number(a.voters.trans) || 0,
          total: Number(a.voters.total) || 0,
        }
      : undefined,
  }))

  // Transform districts
  const districts = districtsData.docs.map((d: any) => ({
    districtId: d.districtId,
    districtSlug: d.slug || d.districtId,
    districtName: d.districtName,
  }))

  return {
    stats: {
      totalDistricts: districtsCount.totalDocs,
      totalAssemblies: assembliesCount.totalDocs,
      totalBooths: boothsCount.totalDocs,
      totalVoters,
    },
    assemblies,
    districts,
  }
}

interface Props {
  params: Promise<{ stateSlug: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { stateSlug } = await params
  const [{ stats, assemblies, districts }, predictors] = await Promise.all([
    getDashboardData(),
    getPredictorsWithSummaries({ stateCode: 'TN' }),
  ])

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Tamil Nadu Election Data Overview</p>
      </div>

      {/* Statistics Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Districts"
            value={stats.totalDistricts}
            icon={<Map className="h-4 w-4" />}
            description={`${stats.totalDistricts} districts`}
          />
          <StatCard
            title="Assemblies"
            value={stats.totalAssemblies}
            icon={<MapPinned className="h-4 w-4" />}
            description={`${stats.totalAssemblies} assembly constituencies`}
          />
          <StatCard
            title="Booths"
            value={stats.totalBooths}
            icon={<Locate className="h-4 w-4" />}
            description={`${stats.totalBooths} polling booths`}
          />
          <StatCard
            title="Voters"
            value={stats.totalVoters}
            icon={<UsersRound className="h-4 w-4" />}
            description={`${stats.totalVoters.toLocaleString()} registered voters`}
          />
        </div>
      </section>

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
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictors.map((predictor) => (
              <Link
                key={predictor.id}
                href={`/${stateSlug}/election-predictions/${predictor.id}`}
                className="group rounded border border-gray-200 bg-white p-4 transition-all hover:border-red-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-red-900"
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
                      <p className="text-xs text-muted-foreground">{predictor.latestYear} Forecast</p>
                    )}
                  </div>
                </div>

                {predictor.totalPredictions > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">Called</p>
                      <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
                        {predictor.calledSeats}
                        <span className="text-xs font-normal text-muted-foreground">/{predictor.totalPredictions}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">Close</p>
                      <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
                        {predictor.tooCloseToCall}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600">Leading</p>
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

      {/* Search Sections - Client Component */}
      <DashboardClient assemblies={assemblies} districts={districts} stateSlug={stateSlug} />
    </div>
  )
}
