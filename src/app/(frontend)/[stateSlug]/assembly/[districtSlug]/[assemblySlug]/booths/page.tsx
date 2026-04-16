import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothsPageClient from './BoothsPageClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'

interface Props {
  params: Promise<{
    districtSlug: string
    assemblySlug: string
    stateSlug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assemblySlug, districtSlug, stateSlug } = await params
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    where: { slug: { equals: assemblySlug } },
    limit: 1,
  })

  const assembly = assemblies.docs[0] as any
  const name = assembly?.name || 'Assembly'
  const cleanName = name.split(' / ')[1] || name

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const canonicalUrl = `${baseUrl}/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths`

  return {
    title: `Polling Booths in ${cleanName} Assembly - Tamil Nadu`,
    description: `Complete list of polling booths in ${cleanName} assembly constituency, ${assembly?.districtName || ''}. Find booth numbers, locations, and voter statistics.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Polling Booths in ${cleanName} Assembly`,
      description: `Explore all polling booths in ${cleanName} assembly constituency.`,
      url: canonicalUrl,
    },
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

  const assemblyName = assembly.name || 'Assembly'
  const districtName = district?.districtName || 'District'

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          {
            name: stateSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            url: `/${stateSlug}/dashboard`,
          },
          {
            name: districtName.split(' / ')[1] || districtName,
            url: `/${stateSlug}/district/${districtSlug}`,
          },
          {
            name: assemblyName.split(' / ')[1] || assemblyName,
            url: `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}`,
          },
          {
            name: 'Booths',
            url: `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths`,
          },
        ]}
      />
      <BoothsPageClient
        districtSlug={districtSlug}
        assemblySlug={assemblySlug}
        assemblyId={assembly.assemblyId}
        assemblyName={assemblyName}
        districtName={districtName}
        stateSlug={stateSlug}
      />
    </div>
  )
}
