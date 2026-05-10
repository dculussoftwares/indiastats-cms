import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { AssemblyPageClient } from './AssemblyPageClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getStateBySlug } from '@/config/states'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

// Pre-generate all assembly pages at build time
export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    limit: 300,
    select: { slug: true, districtId: true },
  })

  // Get district slugs mapping
  const districts = await payload.find({
    collection: 'districts',
    limit: 100,
    select: { districtId: true, slug: true },
  })

  const districtIdToSlug = new Map<string, string>()
  districts.docs.forEach((d: any) => {
    if (d.districtId && d.slug) {
      districtIdToSlug.set(d.districtId, d.slug)
    }
  })

  // Generate params for all assemblies
  return assemblies.docs
    .filter((assembly: any) => assembly.slug && assembly.districtId)
    .map((assembly: any) => ({
      stateSlug: 'tamil-nadu',
      districtSlug: districtIdToSlug.get(assembly.districtId) || assembly.districtId,
      assemblySlug: assembly.slug,
    }))
}

interface PageProps {
  params: Promise<{ districtSlug: string; assemblySlug: string; stateSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { assemblySlug, districtSlug, stateSlug } = await params
  const stateName = getStateBySlug(stateSlug)?.name ?? stateSlug
  const payload = await getPayload({ config })

  const assembly = await payload.find({
    collection: 'assemblies',
    where: { slug: { equals: assemblySlug } },
    limit: 1,
  })

  if (!assembly.docs[0]) {
    return { title: 'Assembly Not Found' }
  }

  const assemblyDoc = assembly.docs[0] as any
  const assemblyName = assemblyDoc.name
  const cleanName = assemblyName.split(' / ')[1] || assemblyName

  // Generate OG image URL
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const ogImageUrl = `${baseUrl}/api/og/${assemblyDoc.assemblyId}`
  const canonicalUrl = `${baseUrl}/${stateSlug}/assembly/${districtSlug}/${assemblySlug}`

  return {
    title: `${cleanName} Assembly - Voter Data & Election History`,
    description:
      assemblyDoc.metaDescription ||
      `Complete election data for ${cleanName} assembly constituency, ${stateName}. Includes ${assemblyDoc.noOfBooths || 'multiple'} polling booths, voter statistics, MLA history since 1972, and demographic insights.`,
    keywords: [
      `${cleanName} assembly`,
      `${cleanName} MLA`,
      `${stateName} elections`,
      `${assemblyDoc.districtName} district`,
      'voter data',
      'election history',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${cleanName} Assembly - Election Data & Statistics`,
      description:
        assemblyDoc.metaDescription ||
        `View election history, voter stats, and political insights for ${cleanName} Assembly, ${assemblyDoc.districtName} District, ${stateName}.`,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${cleanName} Assembly Quick View`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cleanName} Assembly - Election Data`,
      description:
        assemblyDoc.metaDescription ||
        `View election history, voter stats, and political insights for ${cleanName} Assembly, ${stateName}.`,
      images: [ogImageUrl],
    },
  }
}

async function _getAssemblyData(districtSlug: string, assemblySlug: string) {
  const payload = await getPayload({ config })

  // Get assembly info by slug
  const assemblyResult = await payload.find({
    collection: 'assemblies',
    where: { slug: { equals: assemblySlug } },
    limit: 1,
  })

  if (!assemblyResult.docs[0]) {
    return null
  }

  const assembly = assemblyResult.docs[0] as any
  const assemblyId = assembly.assemblyId

  // Get election history for this assembly
  const historyResult = await payload.find({
    collection: 'election-history',
    where: { assemblyId: { equals: assemblyId } },
    sort: '-electionYear',
    limit: 500,
  })

  // Process election history - group by year and find winners
  const historyByYear = new Map<number, any[]>()
  historyResult.docs.forEach((record: any) => {
    const year = record.electionYear
    if (!historyByYear.has(year)) {
      historyByYear.set(year, [])
    }
    historyByYear.get(year)!.push({
      name: record.candidateName,
      party: record.candidateParty || 'IND',
      votes: record.candidateVotes,
      totalVoters: record.totalVoters,
      votesPolled: record.votesPolled,
    })
  })

  // Sort candidates by votes and get election results
  let electionHistory = Array.from(historyByYear.entries())
    .map(([year, candidates]) => {
      candidates.sort((a, b) => b.votes - a.votes)
      const winner = candidates[0]
      return {
        year,
        winner: winner?.name || 'Unknown',
        winnerParty: winner?.party || 'IND',
        winnerVotes: winner?.votes || 0,
        totalVoters: winner?.totalVoters || 0,
        votesPolled: winner?.votesPolled || 0,
        candidates: candidates.slice(0, 5), // Top 5 candidates
      }
    })
    .sort((a, b) => b.year - a.year)

  // Merge live election results (overrides historical data for the same year)
  const liveResult = await payload.find({
    collection: 'live-election-results',
    where: {
      and: [{ assemblyId: { equals: assemblyId } }, { status: { not_equals: 'pending' } }],
    },
    limit: 10,
  })
  if (liveResult.docs.length > 0) {
    const liveYears = new Set(liveResult.docs.map((doc: any) => doc.year as number))
    const liveHistory = liveResult.docs.map((doc: any) => {
      const parties = ((doc.parties as any[]) || [])
        .slice()
        .sort((a: any, b: any) => b.votes - a.votes)
      const winner = parties[0]
      return {
        year: doc.year as number,
        winner: winner?.candidateName || 'Unknown',
        winnerParty: winner?.name || 'IND',
        winnerVotes: winner?.votes || 0,
        totalVoters: doc.electors || 0,
        votesPolled: doc.votes || 0,
        candidates: parties.map((p: any) => ({
          name: p.candidateName || '',
          party: p.name || 'IND',
          votes: p.votes || 0,
        })),
      }
    })
    electionHistory = [
      ...liveHistory,
      ...electionHistory.filter((e) => !liveYears.has(e.year)),
    ].sort((a, b) => b.year - a.year)
  }

  // Get booth count
  const boothsCount = await payload.count({
    collection: 'booths',
    where: { assemblyId: { equals: assemblyId } },
  })

  // Get caste census data for this assembly
  const casteCensusResult = await payload.find({
    collection: 'caste-census',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })

  const casteData = casteCensusResult.docs[0]
    ? {
        assemblyId: (casteCensusResult.docs[0] as any).assemblyId,
        assemblyName: (casteCensusResult.docs[0] as any).assemblyName,
        rank1Caste: (casteCensusResult.docs[0] as any).rank1Caste,
        rank1Percentage: (casteCensusResult.docs[0] as any).rank1Percentage,
        rank2Caste: (casteCensusResult.docs[0] as any).rank2Caste,
        rank2Percentage: (casteCensusResult.docs[0] as any).rank2Percentage,
        rank3Caste: (casteCensusResult.docs[0] as any).rank3Caste,
        rank3Percentage: (casteCensusResult.docs[0] as any).rank3Percentage,
        rank4Caste: (casteCensusResult.docs[0] as any).rank4Caste,
        rank4Percentage: (casteCensusResult.docs[0] as any).rank4Percentage,
        rank5Caste: (casteCensusResult.docs[0] as any).rank5Caste,
        rank5Percentage: (casteCensusResult.docs[0] as any).rank5Percentage,
      }
    : null

  // Get all alliances data (grouped by year)
  const alliancesResult = await payload.find({
    collection: 'alliances',
    limit: 500,
  })

  const allianceData: Record<
    number,
    { allianceName: string; parties: { partyName: string }[]; color: string }[]
  > = {}
  alliancesResult.docs.forEach((alliance: any) => {
    const year = alliance.electionYear
    if (!allianceData[year]) {
      allianceData[year] = []
    }
    allianceData[year].push({
      allianceName: alliance.allianceName,
      parties: alliance.parties,
      color: alliance.color,
    })
  })

  return {
    assemblyId: assembly.assemblyId,
    assemblySlug: assembly.slug,
    districtSlug: districtSlug,
    districtId: assembly.districtId,
    name: assembly.name,
    districtName: assembly.districtName,
    noOfBooths: assembly.noOfBooths || boothsCount.totalDocs,
    voters: assembly.voters
      ? {
          male: Number(assembly.voters.male) || 0,
          female: Number(assembly.voters.female) || 0,
          trans: Number(assembly.voters.trans) || 0,
          total: Number(assembly.voters.total) || 0,
          isReservedAc: assembly.voters.isReservedAc || false,
        }
      : null,
    lastElectionVoters: assembly.lastElectionVoters
      ? {
          male: Number(assembly.lastElectionVoters.male) || 0,
          female: Number(assembly.lastElectionVoters.female) || 0,
          trans: Number(assembly.lastElectionVoters.trans) || 0,
          total: Number(assembly.lastElectionVoters.total) || 0,
        }
      : null,
    electedMla: assembly.electedMla,
    electionHistory,
    casteData,
    allianceData,
    description: (assembly.description as string) || null,
    metaDescription: (assembly.metaDescription as string) || null,
    knownBusinesses: (assembly.knownBusinesses as any) || null,
  }
}

const getAssemblyData = (districtSlug: string, assemblySlug: string) =>
  unstable_cache(
    () => _getAssemblyData(districtSlug, assemblySlug),
    ['assembly-data', districtSlug, assemblySlug],
    {
      tags: [`assembly_${assemblySlug}`],
      revalidate: 86400, // 24 hours
    },
  )()

export default async function AssemblyPage({ params }: PageProps) {
  const { districtSlug, assemblySlug, stateSlug } = await params
  const data = await getAssemblyData(districtSlug, assemblySlug)

  if (!data) {
    notFound()
  }

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          {
            name: stateSlug
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            url: `/${stateSlug}/dashboard`,
          },
          {
            name: data.districtName.split(' / ')[1] || data.districtName,
            url: `/${stateSlug}/district/${districtSlug}`,
          },
          {
            name: data.name.split(' / ')[1] || data.name,
            url: `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}`,
          },
        ]}
      />
      <AssemblyPageClient data={data} stateSlug={stateSlug} />
    </div>
  )
}
