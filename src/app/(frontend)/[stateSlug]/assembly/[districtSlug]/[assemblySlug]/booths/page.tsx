import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothsPageClient from './BoothsPageClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getStateBySlug, stateCodeToSlug } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

// Pre-generate all booth pages at build time to avoid cold-start 5xx
export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    limit: 1000,
    select: { slug: true, districtId: true, stateCode: true },
  })

  const districts = await payload.find({
    collection: 'districts',
    limit: 200,
    select: { districtId: true, slug: true },
  })

  const districtIdToSlug = new Map<string, string>()
  districts.docs.forEach((d: any) => {
    if (d.districtId && d.slug) {
      districtIdToSlug.set(d.districtId, d.slug)
    }
  })

  return assemblies.docs
    .filter((assembly: any) => assembly.slug && assembly.districtId && assembly.stateCode)
    .map((assembly: any) => ({
      stateSlug: stateCodeToSlug(assembly.stateCode),
      districtSlug: districtIdToSlug.get(assembly.districtId) || assembly.districtId,
      assemblySlug: assembly.slug,
    }))
}

interface Props {
  params: Promise<{
    districtSlug: string
    assemblySlug: string
    stateSlug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assemblySlug, districtSlug, stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)
  const stateCode = stateConfig?.code ?? 'TN'
  const stateName = stateConfig?.name ?? stateSlug
  const payload = await getPayload({ config })

  const assemblies = await payload.find({
    collection: 'assemblies',
    where: {
      and: [
        { slug: { equals: assemblySlug } },
        { stateCode: { equals: stateCode } }
      ]
    },
    limit: 1,
  })

  const assembly = assemblies.docs[0] as any
  if (!assembly) {
    return { title: 'Booths Not Found' }
  }
  const name = assembly.name || 'Assembly'
  const cleanName = name.split(' / ')[1] || name

  const baseUrl = getServerSideURL()
  const ogImageUrl = `${baseUrl}/api/og/${assembly.assemblyId}`
  const canonicalUrl = `${baseUrl}/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths`

  return {
    title: `Polling Booths in ${cleanName} Assembly - ${stateName}`,
    description: `Complete list of polling booths in ${cleanName} assembly constituency, ${assembly?.districtName || ''}. Find booth numbers, locations, and voter statistics.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Polling Booths in ${cleanName} Assembly`,
      description: `Explore all polling booths in ${cleanName} assembly constituency.`,
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${cleanName} Assembly Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Polling Booths in ${cleanName} Assembly`,
      description: `Complete list of polling booths in ${cleanName} assembly constituency.`,
      images: [ogImageUrl],
    },
  }
}

export default async function BoothsPage({ params }: Props) {
  const { districtSlug, assemblySlug, stateSlug } = await params
  const stateConfig = getStateBySlug(stateSlug)
  if (!stateConfig) {
    notFound()
  }
  const payload = await getPayload({ config })

  // Fetch assembly info by slug and stateCode
  const assemblies = await payload.find({
    collection: 'assemblies',
    where: {
      and: [
        { slug: { equals: assemblySlug } },
        { stateCode: { equals: stateConfig.code } }
      ]
    },
    limit: 1,
  })

  if (assemblies.docs.length === 0) {
    notFound()
  }

  const assembly = assemblies.docs[0] as any

  // Fetch district info by slug and stateCode
  const districts = await payload.find({
    collection: 'districts',
    where: {
      and: [
        { slug: { equals: districtSlug } },
        { stateCode: { equals: stateConfig.code } }
      ]
    },
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
            name: stateSlug
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
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
