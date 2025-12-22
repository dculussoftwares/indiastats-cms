import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AssemblyPageClient } from './AssemblyPageClient'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

// Pre-generate all assembly pages at build time
export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    limit: 300,
    select: { assemblyId: true, districtId: true },
  })

  // Generate params for all assemblies in Tamil Nadu
  return assemblies.docs.map((assembly: any) => ({
    stateSlug: 'tamil-nadu',
    districtId: assembly.districtId || 'dt1', // Fallback if missing
    assemblyId: assembly.assemblyId,
  }))
}

interface PageProps {
  params: Promise<{ districtId: string; assemblyId: string; stateSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { assemblyId } = await params
  const payload = await getPayload({ config })

  const assembly = await payload.find({
    collection: 'assemblies',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })

  if (!assembly.docs[0]) {
    return { title: 'Assembly Not Found' }
  }

  const assemblyDoc = assembly.docs[0] as any
  const assemblyName = assemblyDoc.name
  const cleanName = assemblyName.split(' / ')[1] || assemblyName

  return {
    title: `${cleanName} Assembly - Election Data | Tamil Nadu`,
    description: `Comprehensive election data for ${cleanName} assembly constituency, Tamil Nadu. View voter statistics, election history, and booth information.`,
  }
}

async function getAssemblyData(districtId: string, assemblyId: string) {
  const payload = await getPayload({ config })

  // Get assembly info
  const assemblyResult = await payload.find({
    collection: 'assemblies',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })

  if (!assemblyResult.docs[0]) {
    return null
  }

  const assembly = assemblyResult.docs[0] as any

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
  const electionHistory = Array.from(historyByYear.entries())
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

  // Get booth count
  const boothsCount = await payload.count({
    collection: 'booths',
    where: { assemblyId: { equals: assemblyId } },
  })

  return {
    assemblyId: assembly.assemblyId,
    districtId: districtId,
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
  }
}

export default async function AssemblyPage({ params }: PageProps) {
  const { districtId, assemblyId, stateSlug } = await params
  const data = await getAssemblyData(districtId, assemblyId)

  if (!data) {
    notFound()
  }

  return <AssemblyPageClient data={data} stateSlug={stateSlug} />
}
