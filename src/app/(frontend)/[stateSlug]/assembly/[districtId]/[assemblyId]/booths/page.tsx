import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothsPageClient from './BoothsPageClient'

interface Props {
  params: Promise<{
    districtId: string
    assemblyId: string
    stateSlug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { districtId, assemblyId } = await params
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    where: { assemblyId: { equals: assemblyId } },
    limit: 1,
  })

  const assembly = assemblies.docs[0]
  const name = assembly?.name || 'Assembly'

  return {
    title: `Booths in ${name} | IndiaStats`,
    description: `View all polling booths in ${name} constituency. Voter lists and booth locations.`,
  }
}

export default async function BoothsPage({ params }: Props) {
  const { districtId, assemblyId, stateSlug } = await params
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

  // Fetch district info
  const districts = await payload.find({
    collection: 'districts',
    where: { districtId: { equals: districtId } },
    limit: 1,
  })

  const district = districts.docs[0]

  return (
    <BoothsPageClient
      districtId={districtId}
      assemblyId={assemblyId}
      assemblyName={assembly.name || 'Assembly'}
      districtName={district?.districtName || 'District'}
      stateSlug={stateSlug}
    />
  )
}
