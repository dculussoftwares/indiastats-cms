import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DistrictPageClient } from './DistrictPageClient'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

// Pre-generate all district pages at build time
export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const districts = await payload.find({
    collection: 'districts',
    limit: 100,
    select: { districtId: true },
  })

  // Generate params for all districts in Tamil Nadu
  return districts.docs.map((district: any) => ({
    stateSlug: 'tamil-nadu',
    districtId: district.districtId,
  }))
}

interface PageProps {
  params: Promise<{ districtId: string; stateSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { districtId } = await params
  const payload = await getPayload({ config })

  const district = await payload.find({
    collection: 'districts',
    where: { districtId: { equals: districtId } },
    limit: 1,
  })

  if (!district.docs[0]) {
    return { title: 'District Not Found' }
  }

  const districtName = district.docs[0].districtName
  const cleanName = districtName.split(' / ')[1] || districtName
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const canonicalUrl = `${baseUrl}/tamil-nadu/district/${districtId}`

  return {
    title: `${cleanName} District - Assembly Constituencies & Election Data`,
    description: `Complete election data for ${cleanName} district, Tamil Nadu. Explore all assembly constituencies, voter statistics, MLA history, and booth-level information.`,
    keywords: [
      `${cleanName} district`,
      'Tamil Nadu elections',
      'assembly constituencies',
      'voter data',
      'MLA history',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${cleanName} District - Tamil Nadu Election Data`,
      description: `View all assembly constituencies and election history for ${cleanName} district, Tamil Nadu.`,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cleanName} District - Election Data`,
      description: `Explore election data for ${cleanName} district assembly constituencies.`,
    },
  }
}

async function getDistrictData(districtId: string) {
  const payload = await getPayload({ config })

  // Get district info
  const districtResult = await payload.find({
    collection: 'districts',
    where: { districtId: { equals: districtId } },
    limit: 1,
  })

  if (!districtResult.docs[0]) {
    return null
  }

  const district = districtResult.docs[0]

  // Get assemblies in this district
  const assembliesResult = await payload.find({
    collection: 'assemblies',
    where: { districtName: { equals: district.districtName } },
    limit: 100,
  })

  // Aggregate voter data
  let totalMale = 0
  let totalFemale = 0
  let totalTrans = 0
  let totalVoters = 0
  let lastMale = 0
  let lastFemale = 0
  let lastTrans = 0
  let lastTotal = 0

  const assemblies = assembliesResult.docs.map((a: any) => {
    if (a.voters) {
      totalMale += Number(a.voters.male) || 0
      totalFemale += Number(a.voters.female) || 0
      totalTrans += Number(a.voters.trans) || 0
      totalVoters += Number(a.voters.total) || 0
    }
    if (a.lastElectionVoters) {
      lastMale += Number(a.lastElectionVoters.male) || 0
      lastFemale += Number(a.lastElectionVoters.female) || 0
      lastTrans += Number(a.lastElectionVoters.trans) || 0
      lastTotal += Number(a.lastElectionVoters.total) || 0
    }
    return {
      assemblyId: a.assemblyId,
      name: a.name,
      noOfBooths: a.noOfBooths || 0,
    }
  })

  // Get election history for all assemblies in this district
  const assemblyIds = assembliesResult.docs.map((a: any) => a.assemblyId)
  const historyResult = await payload.find({
    collection: 'election-history',
    where: {
      assemblyId: {
        in: assemblyIds,
      },
    },
    limit: 5000,
    sort: '-electionYear',
  })

  // Group history by year and assembly
  const historyByYearAndAssembly = new Map<string, any>()
  historyResult.docs.forEach((record: any) => {
    const key = `${record.electionYear}-${record.assemblyId}`
    if (!historyByYearAndAssembly.has(key)) {
      historyByYearAndAssembly.set(key, {
        year: record.electionYear,
        assemblyId: record.assemblyId,
        totalVoters: record.totalVoters || 0,
        noOfVotesPolled: record.votesPolled || 0,
        candidates: [],
      })
    }
    const entry = historyByYearAndAssembly.get(key)
    entry.candidates.push({
      name: record.candidateName,
      party: record.candidateParty || 'IND',
      votes: record.candidateVotes,
    })
  })

  // Convert to array and sort candidates by votes to calculate rank
  const electionHistory = Array.from(historyByYearAndAssembly.values()).map((entry) => {
    // Sort by votes descending and assign rank
    entry.candidates.sort((a: any, b: any) => b.votes - a.votes)
    entry.candidates.forEach((candidate: any, index: number) => {
      candidate.rank = index + 1
    })
    return entry
  })

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

  // Get caste census data for all assemblies in this district
  const casteAssemblyIds = assemblies.map((a) => a.assemblyId)
  const casteCensusResult = await payload.find({
    collection: 'caste-census',
    where: { assemblyId: { in: casteAssemblyIds } },
    limit: 100,
  })

  const assemblyCasteData = casteCensusResult.docs.map((doc: any) => ({
    assemblyId: doc.assemblyId,
    assemblyName: doc.assemblyName,
    rank1Caste: doc.rank1Caste,
    rank1Percentage: doc.rank1Percentage,
    rank2Caste: doc.rank2Caste,
    rank2Percentage: doc.rank2Percentage,
    rank3Caste: doc.rank3Caste,
    rank3Percentage: doc.rank3Percentage,
    rank4Caste: doc.rank4Caste,
    rank4Percentage: doc.rank4Percentage,
    rank5Caste: doc.rank5Caste,
    rank5Percentage: doc.rank5Percentage,
  }))

  return {
    districtId: district.districtId,
    districtName: district.districtName,
    noOfAssemblies: assemblies.length,
    voters: {
      male: totalMale,
      female: totalFemale,
      trans: totalTrans,
      total: totalVoters,
    },
    lastElectionVoters: {
      male: lastMale,
      female: lastFemale,
      trans: lastTrans,
      total: lastTotal,
    },
    assemblies,
    electionHistory,
    allianceData,
    assemblyCasteData,
  }
}

export default async function DistrictPage({ params }: PageProps) {
  const { districtId, stateSlug } = await params
  const data = await getDistrictData(districtId)

  if (!data) {
    notFound()
  }

  return <DistrictPageClient data={data} stateSlug={stateSlug} />
}
