import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothsPageClient from './BoothsPageClient'

interface Props {
  params: Promise<{
    districtSlug: string
    assemblySlug: string
    stateSlug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assemblySlug } = await params
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    where: { slug: { equals: assemblySlug } },
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
  const { districtSlug, assemblySlug, stateSlug } = await params
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

  const assembly = assemblies.docs[0] as any

  // Fetch district info by slug
  const districts = await payload.find({
    collection: 'districts',
    where: { slug: { equals: districtSlug } },
    limit: 1,
  })

  const district = districts.docs[0] as any

  return (
    <BoothsPageClient
      districtSlug={districtSlug}
      assemblySlug={assemblySlug}
      assemblyId={assembly.assemblyId}
      assemblyName={assembly.name || 'Assembly'}
      districtName={district?.districtName || 'District'}
      stateSlug={stateSlug}
    />
  )
}
