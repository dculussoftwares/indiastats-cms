import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { HomePageClient } from './HomePageClient'
import { getAllStates } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'
import { DataCatalogJsonLd } from '@/components/seo/JsonLd'

const baseUrl = getServerSideURL()

export const metadata: Metadata = {
  title: 'IndiaStats.org - India Election Data & Statistics',
  description: `Explore India's assembly constituencies — election history, voter data, booth statistics, and political analysis across Tamil Nadu, Uttar Pradesh, and more.`,
  keywords: [
    'India elections',
    'assembly constituency',
    'voter data',
    'MLA history',
    'election statistics',
    'Tamil Nadu elections',
    'Uttar Pradesh elections',
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
    images: [
      {
        url: `${baseUrl}/indiastats-logo-1024.png`,
        width: 1024,
        height: 1024,
        alt: 'IndiaStats.org',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IndiaStats.org - India Election Data',
    description: 'Comprehensive election data for assembly constituencies across India.',
    images: [`${baseUrl}/indiastats-logo-1024.png`],
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
  const states = getAllStates()
  return (
    <>
      <DataCatalogJsonLd
        totalAssemblies={stats.totalAssemblies}
        totalBooths={stats.totalBooths}
      />
      <HomePageClient stats={stats} states={states} />
    </>
  )
}
