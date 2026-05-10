import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { HomePageClient } from './HomePageClient'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'

export const metadata: Metadata = {
  title: 'IndiaStats.org - India Election Data & Statistics',
  description:
    "Explore detailed election history, constituency demographics, and voting patterns across India. Start with Tamil Nadu's 234 assembly constituencies, 50,000+ booths, and 6+ crore voters.",
  keywords: [
    'India elections',
    'assembly constituency',
    'voter data',
    'MLA history',
    'election statistics',
    'Tamil Nadu elections',
    'Tamil Nadu MLAs',
    'booth data',
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "IndiaStats.org - India's Most Comprehensive Election Data Platform",
    description:
      'Explore detailed election history, constituency demographics, and voting patterns across Indian assembly constituencies.',
    type: 'website',
    url: baseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IndiaStats.org - India Election Data',
    description: 'Comprehensive election data for assembly constituencies across India.',
  },
}

async function _getHomePageData() {
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

const getHomePageData = unstable_cache(_getHomePageData, ['home-page-data'], {
  tags: ['home', 'assemblies'],
  revalidate: 86400, // 24 hours
})

export default async function HomePage() {
  const { stats } = await getHomePageData()
  return <HomePageClient stats={stats} />
}
