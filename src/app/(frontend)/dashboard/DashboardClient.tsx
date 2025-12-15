'use client'
import * as React from 'react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'

interface DashboardClientProps {
  assemblies: Assembly[]
  districts: District[]
}

export function DashboardClient({ assemblies, districts }: DashboardClientProps) {
  const handleDistrictSearch = (district: District) => {
    // CTA action - not implementing redirect per user request
    console.log('District selected:', district)
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
      </section>

      {/* Assembly Search Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Assembly Search</h2>
        <AssemblySearch assemblies={assemblies} onSearch={handleAssemblySearch} />
      </section>
    </>
  )
}
