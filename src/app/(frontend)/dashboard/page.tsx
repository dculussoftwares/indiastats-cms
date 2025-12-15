import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { Map, MapPinned, Locate, UsersRound } from 'lucide-react'
import { StatCard } from '@/components/StatCard'

export const metadata: Metadata = {
  title: 'Dashboard | Tamil Nadu Election Data',
  description:
    'Comprehensive Tamil Nadu election data, assembly constituency analysis, and electoral insights',
}

async function getDashboardStats() {
  const payload = await getPayload({ config })

  const [assemblies, districts, booths, electionHistory] = await Promise.all([
    payload.count({ collection: 'assemblies' }),
    payload.count({ collection: 'districts' }),
    payload.count({ collection: 'booths' }),
    payload.find({
      collection: 'assemblies',
      limit: 1000,
    }),
  ])

  // Calculate total voters from assemblies
  let totalVoters = 0
  electionHistory.docs.forEach((assembly: any) => {
    if (assembly.voters?.total) {
      totalVoters += Number(assembly.voters.total)
    }
  })

  return {
    totalDistricts: districts.totalDocs,
    totalAssemblies: assemblies.totalDocs,
    totalBooths: booths.totalDocs,
    totalVoters,
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Tamil Nadu Election Data Overview</p>
      </div>

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
    </div>
  )
}
