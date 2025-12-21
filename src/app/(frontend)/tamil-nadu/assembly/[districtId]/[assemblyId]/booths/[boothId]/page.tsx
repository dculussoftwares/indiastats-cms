import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothPageClient from './BoothPageClient'

interface Props {
  params: Promise<{
    districtId: string
    assemblyId: string
    boothId: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boothId } = await params

  return {
    title: `Booth ${boothId} | IndiaStats`,
    description: `View details and voter list for polling booth ${boothId}.`,
  }
}

export default async function BoothPage({ params }: Props) {
  const { districtId, assemblyId, boothId } = await params
  const payload = await getPayload({ config })

  // Fetch assembly info
  const assemblies = await payload.find({
    collection: 'assemblies',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })

  if (assemblies.docs.length === 0) {
    notFound()
  }

  const assembly = assemblies.docs[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voters = assembly.voters as any

  return (
    <BoothPageClient
      districtId={districtId}
      assemblyId={assemblyId}
      boothId={boothId}
      assemblyName={assembly.name || 'Assembly'}
      isReservedAc={voters?.isReservedAc || false}
    />
  )
}
