import * as React from 'react'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import AssemblyMap from '@/components/AssemblyMap'
import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'

// Revalidate every 24 hours (ISR)
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Tamil Nadu Assembly Map - Interactive Constituency Visualization | IndiaStats',
  description:
    'Interactive map of Tamil Nadu assembly constituencies with detailed electoral data, geographical boundaries, and constituency information.',
  keywords:
    'Tamil Nadu assembly map, constituency map, electoral boundaries, assembly seats, district map',
}

// Fetch map stats at build time
async function getMapStats() {
  const payload = await getPayload({ config })
  const stateCode = 'TN'

  const assembliesResult = await payload.find({
    collection: 'assemblies',
    where: { stateCode: { equals: stateCode } },
    limit: 300,
  })

  const assemblies = assembliesResult.docs

  let totalMale = 0
  let totalFemale = 0
  let totalTrans = 0
  let totalVoters = 0
  let reservedSeats = 0
  let generalSeats = 0
  const districts = new Set<string>()

  assemblies.forEach((assembly: any) => {
    if (assembly.districtName) {
      districts.add(assembly.districtName)
    }
    if (assembly.voters) {
      totalMale += Number(assembly.voters.male) || 0
      totalFemale += Number(assembly.voters.female) || 0
      totalTrans += Number(assembly.voters.trans) || 0
      totalVoters += Number(assembly.voters.total) || 0
      if (assembly.voters.isReservedAc) {
        reservedSeats++
      } else {
        generalSeats++
      }
    }
  })

  let largestConstituency = { name: '', voters: 0, assemblyId: '' }
  let smallestConstituency = { name: '', voters: Infinity, assemblyId: '' }
  let highestFemaleRatio = { name: '', ratio: 0, assemblyId: '' }
  let mostBooths = { name: '', booths: 0, assemblyId: '' }

  assemblies.forEach((assembly: any) => {
    const total = Number(assembly.voters?.total) || 0
    const female = Number(assembly.voters?.female) || 0
    const booths = Number(assembly.noOfBooths) || 0
    const name = assembly.name || ''
    const assemblyId = assembly.assemblyId || ''

    if (total > largestConstituency.voters) {
      largestConstituency = { name, voters: total, assemblyId }
    }
    if (total > 0 && total < smallestConstituency.voters) {
      smallestConstituency = { name, voters: total, assemblyId }
    }
    if (total > 0 && female / total > highestFemaleRatio.ratio) {
      highestFemaleRatio = { name, ratio: female / total, assemblyId }
    }
    if (booths > mostBooths.booths) {
      mostBooths = { name, booths, assemblyId }
    }
  })

  return {
    totalAssemblies: assemblies.length,
    totalDistricts: districts.size,
    reservedSeats,
    generalSeats,
    voters: {
      male: totalMale,
      female: totalFemale,
      trans: totalTrans,
      total: totalVoters,
    },
    quickStats: {
      largestConstituency,
      smallestConstituency: smallestConstituency.voters === Infinity ? null : smallestConstituency,
      highestFemaleRatio: {
        ...highestFemaleRatio,
        ratio: Math.round(highestFemaleRatio.ratio * 100),
      },
      mostBooths,
    },
  }
}

// Fetch caste data at build time
async function getCasteData() {
  const payload = await getPayload({ config })
  const stateCode = 'TN'

  const casteData = await payload.find({
    collection: 'caste-census',
    where: { stateCode: { equals: stateCode } },
    limit: 500,
    sort: 'assemblyName',
  })

  // Transform to the map format expected by AssemblyMap
  const casteDataMap: Record<
    string,
    {
      caste: string | null
      percentage: number
      rank2Caste?: string | null
      rank2Percentage?: number
      rank3Caste?: string | null
      rank3Percentage?: number
      rank4Caste?: string | null
      rank4Percentage?: number
      rank5Caste?: string | null
      rank5Percentage?: number
    }
  > = {}

  casteData.docs.forEach((a: any) => {
    casteDataMap[a.assemblyId] = {
      caste: a.rank1Caste,
      percentage: a.rank1Percentage || 0,
      rank2Caste: a.rank2Caste,
      rank2Percentage: a.rank2Percentage || 0,
      rank3Caste: a.rank3Caste,
      rank3Percentage: a.rank3Percentage || 0,
      rank4Caste: a.rank4Caste,
      rank4Percentage: a.rank4Percentage || 0,
      rank5Caste: a.rank5Caste,
      rank5Percentage: a.rank5Percentage || 0,
    }
  })

  return casteDataMap
}

export default async function AssemblyMapPage() {
  // Fetch data at build time (server-side)
  const [mapStats, casteDataMap] = await Promise.all([getMapStats(), getCasteData()])

  return (
    <div className="container mx-auto py-6">
      {/* BBC Style Header */}
      <div className="mb-6">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <h1 className="text-2xl font-bold">Tamil Nadu Assembly Map</h1>
          <p className="text-sm text-muted-foreground">
            Interactive map showing all 234 assembly constituencies
          </p>
        </div>
      </div>
      <AssemblyMap
        map={TamilNaduGeoJson}
        prefetchedMapStats={mapStats}
        prefetchedCasteData={casteDataMap}
      />
    </div>
  )
}
