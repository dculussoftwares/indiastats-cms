'use client'
import * as React from 'react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'

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
  const handleAssemblySearch = (district: District, assembly: Assembly) => {
    // CTA action - not implementing redirect per user request
    console.log('Assembly selected:', { district, assembly })
  }

  return (
    <>
      {/* District Search Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">District Search</h2>
        <DistrictSearch districts={districts} />
      </section>

      {/* Assembly Search Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Assembly Search</h2>
        <AssemblySearch
          assemblies={assemblies}
          districts={districts}
          onSearch={handleAssemblySearch}
        />
      </section>
    </>
  )
}
