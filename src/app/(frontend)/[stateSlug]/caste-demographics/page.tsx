import { getPayload } from 'payload'
import config from '@payload-config'
import { Metadata } from 'next'
import { CasteDemographicsClient } from './CasteDemographicsClient'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://indiastats.org'
  const ogImageUrl = `${baseUrl}/api/og/state/${stateSlug}`
  const canonicalUrl = `${baseUrl}/${stateSlug}/caste-demographics`

  return {
    title: 'Caste Demographics - Tamil Nadu Assembly Constituencies | IndiaStats',
    description: 'Explore caste composition data across all 234 assembly constituencies in Tamil Nadu. Search, filter, and analyze demographic patterns.',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: 'Tamil Nadu Caste Demographics - IndiaStats.org',
      description: 'Explore caste composition data across all 234 assembly constituencies in Tamil Nadu.',
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Tamil Nadu Caste Demographics Profile',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Tamil Nadu Caste Demographics',
      description: 'Detailed caste composition data for Tamil Nadu assembly constituencies.',
      images: [ogImageUrl],
    },
  }
}

interface CasteData {
  id: string
  assemblyId: string
  assemblyName: string
  rank1Caste: string | null
  rank1Percentage: number | null
  rank2Caste: string | null
  rank2Percentage: number | null
  rank3Caste: string | null
  rank3Percentage: number | null
  rank4Caste: string | null
  rank4Percentage: number | null
  rank5Caste: string | null
  rank5Percentage: number | null
}

interface Props {
  params: Promise<{ stateSlug: string }>
}

async function getCasteData(): Promise<CasteData[]> {
  const payload = await getPayload({ config })
  const stateCode = 'TN'

  const casteData = await payload.find({
    collection: 'caste-census',
    where: { stateCode: { equals: stateCode } },
    limit: 500,
    sort: 'assemblyName',
  })

  return casteData.docs.map((doc: any) => ({
    id: doc.id,
    assemblyId: doc.assemblyId,
    assemblyName: doc.assemblyName,
    rank1Caste: doc.rank1Caste,
    rank1Percentage: doc.rank1Percentage,
    rank2Caste: doc.rank2Caste,
    rank2Percentage: doc.rank2Percentage,
    rank3Caste: doc.rank3Caste,
    rank3Percentage: doc.rank3Percentage,
    rank4Caste: doc.rank4Caste,
    rank4Percentage: doc.rank4Percentage,
    rank5Caste: doc.rank5Caste,
    rank5Percentage: doc.rank5Percentage,
  }))
}

export default async function CasteDemographicsPage({ params }: Props) {
  const { stateSlug } = await params

  // Fetch data at build time (server-side)
  const casteData = await getCasteData()

  return <CasteDemographicsClient stateSlug={stateSlug} prefetchedData={casteData} />
}
