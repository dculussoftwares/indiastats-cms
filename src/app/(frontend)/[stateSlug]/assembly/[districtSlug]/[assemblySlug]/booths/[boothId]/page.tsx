import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import BoothPageClient from './BoothPageClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getStateBySlug } from '@/config/states'
import { getServerSideURL } from '@/utilities/getURL'

interface Props {
  params: Promise<{
    districtSlug: string
    assemblySlug: string
    boothId: string
    stateSlug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boothId, assemblySlug, districtSlug, stateSlug } = await params
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
    return { title: 'Booth Not Found' }
  }
  const assemblyName = assembly.name || 'Assembly'
  const cleanName = assemblyName.split(' / ')[1] || assemblyName

  const baseUrl = getServerSideURL()
  const ogImageUrl = `${baseUrl}/api/og/${assembly.assemblyId}`
  const canonicalUrl = `${baseUrl}/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths/${boothId}`

  return {
    title: `Polling Booth ${boothId} - ${cleanName} Assembly | IndiaStats`,
    description: `Detailed voter information and statistics for polling booth ${boothId} in ${cleanName} assembly constituency, ${assembly?.districtName || ''}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Booth ${boothId} - ${cleanName} Assembly`,
      description: `View details for polling booth ${boothId} in ${cleanName} constituency.`,
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
      title: `Booth ${boothId} - ${cleanName} Assembly`,
      description: `Detailed voter information for polling booth ${boothId}.`,
      images: [ogImageUrl],
    },
  }
}

export default async function BoothPage({ params }: Props) {
  const { districtSlug, assemblySlug, boothId, stateSlug } = await params
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

  const assembly = assemblies.docs[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const voters = assembly.voters as any

  const assemblyName = assembly.name || 'Assembly'

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[
          {
            name: stateSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            url: `/${stateSlug}/dashboard`,
          },
          {
            name: (assembly as any).districtName?.split(' / ')[1] || (assembly as any).districtName || 'District',
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
          {
            name: `Booth ${boothId}`,
            url: `/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths/${boothId}`,
          },
        ]}
      />
      <BoothPageClient
        districtSlug={districtSlug}
        assemblySlug={assemblySlug}
        boothId={boothId}
        assemblyName={assemblyName}
        isReservedAc={voters?.isReservedAc || false}
        stateSlug={stateSlug}
      />
    </div>
  )
}
