import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { Map, MapPinned, Locate, UsersRound } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { DashboardClient } from './DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | Tamil Nadu Election Data',
  description:
    'Comprehensive Tamil Nadu election data, assembly constituency analysis, and electoral insights',
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
  const { stats, assemblies, districts } = await getDashboardData()

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

      {/* Search Sections - Client Component */}
      <DashboardClient assemblies={assemblies} districts={districts} stateSlug={stateSlug} />
    </div>
  )
}
