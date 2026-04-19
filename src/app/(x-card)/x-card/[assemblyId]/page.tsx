import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { XCardPreview } from './XCardPreview'

interface PageProps {
  params: Promise<{ assemblyId: string }>
  searchParams: Promise<{ template?: string }>
}

async function getAssemblyCardData(assemblyId: string) {
  const payload = await getPayload({ config })

  const assemblyResult = await payload.find({
    collection: 'assemblies',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })

  if (!assemblyResult.docs[0]) return null
  const assembly = assemblyResult.docs[0] as any

  // Election history
  const historyResult = await payload.find({
    collection: 'election-history',
    where: { assemblyId: { equals: assemblyId } },
    sort: '-electionYear',
    limit: 500,
  })

  const historyByYear = new Map<number, any[]>()
  historyResult.docs.forEach((record: any) => {
    const year = record.electionYear
    if (!historyByYear.has(year)) historyByYear.set(year, [])
    historyByYear.get(year)!.push({
      name: record.candidateName,
      party: record.candidateParty || 'IND',
      votes: record.candidateVotes,
      totalVoters: record.totalVoters,
      votesPolled: record.votesPolled,
    })
  })

  const electionHistory = Array.from(historyByYear.entries())
    .map(([year, candidates]) => {
      candidates.sort((a, b) => b.votes - a.votes)
      const winner = candidates[0]
      const runnerUp = candidates[1]
      const margin = winner && runnerUp ? winner.votes - runnerUp.votes : 0
      const turnout = winner?.votesPolled && winner?.totalVoters
        ? ((winner.votesPolled / winner.totalVoters) * 100)
        : 0
      return {
        year,
        winner: winner?.name || 'Unknown',
        winnerParty: winner?.party || 'IND',
        winnerVotes: winner?.votes || 0,
        runnerUp: runnerUp?.name || '',
        runnerUpParty: runnerUp?.party || 'IND',
        runnerUpVotes: runnerUp?.votes || 0,
        margin,
        totalVoters: winner?.totalVoters || 0,
        votesPolled: winner?.votesPolled || 0,
        turnout,
        candidates: candidates.slice(0, 5),
      }
    })
    .sort((a, b) => b.year - a.year)

  // Caste data
  const casteCensusResult = await payload.find({
    collection: 'caste-census',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })
  const casteDoc = casteCensusResult.docs[0] as any
  const topCastes: { name: string; percentage: number }[] = []
  if (casteDoc) {
    for (let i = 1; i <= 3; i++) {
      const name = casteDoc[`rank${i}Caste`]
      const pct = casteDoc[`rank${i}Percentage`]
      if (name && pct) topCastes.push({ name, percentage: pct })
    }
  }

  // Alliances
  const alliancesResult = await payload.find({
    collection: 'alliances',
    limit: 500,
  })
  const allianceData: Record<number, { allianceName: string; parties: { partyName: string }[] }[]> = {}
  alliancesResult.docs.forEach((a: any) => {
    if (!allianceData[a.electionYear]) allianceData[a.electionYear] = []
    allianceData[a.electionYear].push({
      allianceName: a.allianceName,
      parties: a.parties,
    })
  })

  return {
    assemblyId: assembly.assemblyId,
    stateCode: assembly.stateCode || 'TN',
    name: assembly.name,
    districtName: assembly.districtName,
    districtId: assembly.districtId,
    isReserved: assembly.voters?.isReservedAc || false,
    voters: assembly.voters ? {
      male: Number(assembly.voters.male) || 0,
      female: Number(assembly.voters.female) || 0,
      total: Number(assembly.voters.total) || 0,
    } : null,
    lastElectionVoters: assembly.lastElectionVoters ? {
      total: Number(assembly.lastElectionVoters.total) || 0,
    } : null,
    electionHistory,
    topCastes,
    allianceData,
  }
}

export default async function XCardPage({ params, searchParams }: PageProps) {
  const { assemblyId } = await params
  const { template } = await searchParams
  const data = await getAssemblyCardData(assemblyId)

  if (!data) notFound()

  return <XCardPreview data={data} selectedTemplate={template} />
}
