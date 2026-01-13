import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothPageClient from './BoothPageClient'

interface Props {
  params: Promise<{
    districtSlug: string
    assemblySlug: string
    boothId: string
    stateSlug: string
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
  const { districtSlug, assemblySlug, boothId, stateSlug } = await params
  const payload = await getPayload({ config })

  // Fetch assembly info by slug
  const assemblies = await payload.find({
    collection: 'assemblies',
    where: { slug: { equals: assemblySlug } },
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
      districtSlug={districtSlug}
      assemblySlug={assemblySlug}
      boothId={boothId}
      assemblyName={assembly.name || 'Assembly'}
      isReservedAc={voters?.isReservedAc || false}
      stateSlug={stateSlug}
    />
  )
}
