import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { DistrictPageClient } from './DistrictPageClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getStateByCode, getStateBySlug } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'
import { DistrictPageJsonLd } from '@/components/seo/JsonLd'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

// Pre-generate all district pages at build time
export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const districts = await payload.find({
    collection: 'districts',
    limit: 500,
    select: { slug: true, stateCode: true },
  })

  if (districts.totalDocs > districts.docs.length) {
    console.warn(`generateStaticParams: fetched ${districts.docs.length}/${districts.totalDocs} districts — increase limit`)
  }

  return districts.docs
    .filter((district: any) => district.slug && district.stateCode)
    .map((district: any) => ({
      stateSlug: getStateByCode(district.stateCode)?.slug ?? district.stateCode.toLowerCase(),
      districtSlug: district.slug,
    }))
}

interface PageProps {
  params: Promise<{ districtSlug: string; stateSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { districtSlug, stateSlug } = await params
  const payload = await getPayload({ config })
  const stateName = getStateBySlug(stateSlug)?.name ?? stateSlug

  const district = await payload.find({
    collection: 'districts',
    where: { slug: { equals: districtSlug } },
    limit: 1,
  })

  if (!district.docs[0]) {
    return { title: 'District Not Found' }
  }

  const districtDoc = district.docs[0] as any
  const districtName = districtDoc.districtName
  const cleanName = districtName.split(' / ')[1] || districtName
  const baseUrl = getServerSideURL()
  const ogImageUrl = `${baseUrl}/api/og/district/${districtDoc.districtId}`
  const canonicalUrl = `${baseUrl}/${stateSlug}/district/${districtSlug}`

  return {
    title: `${cleanName} District - Assembly Constituencies & Election Data`,
    description:
      districtDoc.metaDescription ||
      `Complete election data for ${cleanName} district, ${stateName}. Explore all assembly constituencies, voter statistics, MLA history, and booth-level information.`,
    keywords: [
      `${cleanName} district`,
      `${stateName} elections`,
      'assembly constituencies',
      'voter data',
      'MLA history',
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${cleanName} District - ${stateName} Election Data`,
      description:
        districtDoc.metaDescription ||
        `View all assembly constituencies and election history for ${cleanName} district, ${stateName}.`,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${cleanName} District Election Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cleanName} District - Election Data`,
      description:
        districtDoc.metaDescription ||
        `Explore election data for ${cleanName} district assembly constituencies.`,
      images: [ogImageUrl],
    },
  }
}

async function _getDistrictData(districtSlug: string) {
  const payload = await getPayload({ config })

  // Get district info by slug
  const districtResult = await payload.find({
    collection: 'districts',
    where: { slug: { equals: districtSlug } },
    limit: 1,
  })

  if (!districtResult.docs[0]) {
    return null
  }

  const district = districtResult.docs[0] as any

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
      assemblySlug: a.slug || a.assemblyId,
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

  // Keep one row per assembly to avoid duplicate UI rows/React keys.
  const seenAssemblyIds = new Set<string>()
  const assemblyCasteData = casteCensusResult.docs
    .filter((doc: any) => {
      const assemblyId = doc.assemblyId
      if (!assemblyId || seenAssemblyIds.has(assemblyId)) return false
      seenAssemblyIds.add(assemblyId)
      return true
    })
    .map((doc: any) => ({
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
    districtSlug: district.slug,
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
    description: (district.description as string) || null,
    metaDescription: (district.metaDescription as string) || null,
    knownBusinesses: (district.knownBusinesses as any) || null,
  }
}

const getDistrictData = (districtSlug: string) =>
  unstable_cache(() => _getDistrictData(districtSlug), ['district-data', districtSlug], {
    tags: [`district_${districtSlug}`],
    revalidate: 86400, // 24 hours
  })()

export default async function DistrictPage({ params }: PageProps) {
  const { districtSlug, stateSlug } = await params
  const stateName = getStateBySlug(stateSlug)?.name ?? stateSlug
  const data = await getDistrictData(districtSlug)

  if (!data) {
    notFound()
  }

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          { name: stateName, url: `/${stateSlug}/dashboard` },
          {
            name: data.districtName.split(' / ')[1] || data.districtName,
            url: `/${stateSlug}/district/${districtSlug}`,
          },
        ]}
      />
      <DistrictPageJsonLd
        districtName={data.districtName.split(' / ')[1] || data.districtName}
        description={
          data.metaDescription || `Election data for ${data.districtName} district, ${stateName}.`
        }
        url={`https://indiastats.org/${stateSlug}/district/${districtSlug}`}
        assemblies={data.assemblies.map((a) => ({ name: a.name.split(' / ')[1] || a.name }))}
      />
      <DistrictPageClient data={data} stateSlug={stateSlug} stateName={stateName} />
    </div>
  )
}
