'use client'
import * as React from 'react'
import { useState } from 'react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'
import { DistrictDetailsCard, DistrictDetailsData } from '@/components/DistrictDetailsCard'

interface AssemblyData {
  assemblyId: string
  districtId: string
  districtName: string
  name: string
  voters?: {
    male?: number
    female?: number
    trans?: number
    total?: number
  }
}

interface DashboardClientProps {
  assemblies: AssemblyData[]
  districts: District[]
}

export function DashboardClient({ assemblies, districts }: DashboardClientProps) {
  const [selectedDistrictDetails, setSelectedDistrictDetails] =
    useState<DistrictDetailsData | null>(null)

  const handleDistrictSearch = (district: District) => {
    // Calculate district details from assemblies
    const districtAssemblies = assemblies.filter((a) => a.districtName === district.districtName)

    // Aggregate voter data
    let totalMale = 0
    let totalFemale = 0
    let totalTrans = 0
    let totalVoters = 0

    districtAssemblies.forEach((assembly) => {
      if (assembly.voters) {
        totalMale += assembly.voters.male || 0
        totalFemale += assembly.voters.female || 0
        totalTrans += assembly.voters.trans || 0
        totalVoters += assembly.voters.total || 0
      }
    })

    setSelectedDistrictDetails({
      districtId: district.districtId,
      districtName: district.districtName,
      noOfAssemblies: districtAssemblies.length,
      voters: {
        male: totalMale,
        female: totalFemale,
        trans: totalTrans,
        total: totalVoters,
      },
    })
  }

  const handleAssemblySearch = (district: District, assembly: Assembly) => {
    // CTA action - not implementing redirect per user request
    console.log('Assembly selected:', { district, assembly })
  }

  return (
    <>
      {/* District Search Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">District Search</h2>
        <DistrictSearch districts={districts} onSearch={handleDistrictSearch} />

        {/* District Details - shown when a district is selected */}
        {selectedDistrictDetails && <DistrictDetailsCard data={selectedDistrictDetails} />}
      </section>

      {/* Assembly Search Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Assembly Search</h2>
        <AssemblySearch assemblies={assemblies} onSearch={handleAssemblySearch} />
      </section>
    </>
  )
}
