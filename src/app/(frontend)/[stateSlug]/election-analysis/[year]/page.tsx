import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStateBySlug } from '@/config/states'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ElectionAnalysisClient } from './ElectionAnalysisClient'
import { computeElectionAnalysis } from '@/lib/electionAnalysis'
import type { ElectionAnalysisResponse } from '@/lib/electionAnalysis'

interface Props {
  params: Promise<{ stateSlug: string; year: string }>
}

export async function generateStaticParams() {
  return [
    { stateSlug: 'tamil-nadu', year: '2026' },
    { stateSlug: 'tamil-nadu', year: '2021' },
  ]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, year } = await params
  const stateConfig = getStateBySlug(stateSlug)
  if (!stateConfig) return { title: 'Not Found' }
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  return {
    title: `${stateConfig.name} ${year} Election Analysis | IndiaStats`,
    description: `Deep dive into the ${stateConfig.name} ${year} assembly election — vote shares, seat flips, closest races, turnout trends, and district-level insights.`,
    alternates: { canonical: `${baseUrl}/${stateSlug}/election-analysis/${year}` },
    openGraph: {
      title: `${stateConfig.name} ${year} Election — Full Analysis`,
      description: `Comprehensive data analysis of the ${year} ${stateConfig.name} assembly election.`,
    },
  }
}

export default async function ElectionAnalysisPage({ params }: Props) {
  const { stateSlug, year: yearStr } = await params
  const stateConfig = getStateBySlug(stateSlug)
  if (!stateConfig) notFound()

  const year = parseInt(yearStr, 10)
  if (isNaN(year) || !stateConfig.electionYears.includes(year)) notFound()

  let data: ElectionAnalysisResponse
  try {
    data = await computeElectionAnalysis(year, stateConfig.code)
  } catch (err) {
    console.error('[election-analysis] page error:', err)
    notFound()
  }

  const electionYears = stateConfig.electionYears.filter((y) => y <= new Date().getFullYear())

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          {
            name: stateConfig.name,
            url: `/${stateSlug}/dashboard`,
          },
          {
            name: `${year} Election Analysis`,
            url: `/${stateSlug}/election-analysis/${year}`,
          },
        ]}
      />
      <ElectionAnalysisClient
        data={data}
        stateSlug={stateSlug}
        stateCode={stateConfig.code}
        availableYears={electionYears}
      />
    </div>
  )
}
