'use client'
import * as React from 'react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'
import { trackViewed, PAGE_NAMES } from '@/analytics'

interface AssemblyData {
  assemblyId: string
  assemblySlug: string
  districtId: string
  districtSlug: string
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
  stateSlug: string
}

export function DashboardClient({ assemblies, districts, stateSlug }: DashboardClientProps) {
  React.useEffect(() => {
    trackViewed({ name: 'dashboard_page',
      page_name: PAGE_NAMES.DASHBOARD,
      page_type: 'other',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

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
