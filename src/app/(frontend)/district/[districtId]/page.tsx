import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DistrictPageClient } from './DistrictPageClient'

interface PageProps {
  params: Promise<{ districtId: string }>
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

  return {
    title: `${cleanName} District - Election Data | Tamil Nadu`,
    description: `Comprehensive election data for ${cleanName} district, Tamil Nadu. View all assembly constituencies and voter statistics.`,
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
  }
}

export default async function DistrictPage({ params }: PageProps) {
  const { districtId } = await params
  const data = await getDistrictData(districtId)

  if (!data) {
    notFound()
  }

  return <DistrictPageClient data={data} />
}
