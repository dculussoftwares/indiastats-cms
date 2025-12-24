import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { HomePageClient } from './HomePageClient'

export const metadata: Metadata = {
  title: 'IndiaStats - Comprehensive Election Data Platform',
  description:
    "Explore detailed election history, constituency demographics, and voting patterns across India. Start with Tamil Nadu's 234 assembly constituencies.",
  openGraph: {
    title: "IndiaStats - India's Most Comprehensive Election Data Platform",
    description:
      "Explore detailed election history, constituency demographics, and voting patterns across Tamil Nadu's 234 assembly constituencies.",
    type: 'website',
  },
}

async function getHomePageData() {
  const payload = await getPayload({ config })

  const [assembliesCount, districtsCount, boothsCount, assembliesData] = await Promise.all([
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
  assembliesData.docs.forEach((assembly: any) => {
    if (assembly.voters?.total) {
      totalVoters += Number(assembly.voters.total)
    }
  })

  return {
    stats: {
      totalDistricts: districtsCount.totalDocs,
      totalAssemblies: assembliesCount.totalDocs,
      totalBooths: boothsCount.totalDocs,
      totalVoters,
    },
  }
}

export default async function HomePage() {
  const { stats } = await getHomePageData()

  return <HomePageClient stats={stats} />
}
