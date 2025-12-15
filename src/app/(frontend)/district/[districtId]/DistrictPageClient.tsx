'use client'
import * as React from 'react'
import Link from 'next/link'
import { DistrictDetailsCard, DistrictDetailsData } from '@/components/DistrictDetailsCard'
import { PopulationChangeCard } from '@/components/PopulationChangeCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight, Building2 } from 'lucide-react'

interface Assembly {
  assemblyId: string
  name: string
  noOfBooths: number
}

interface DistrictData {
  districtId: string
  districtName: string
  noOfAssemblies: number
  voters: {
    male: number
    female: number
    trans: number
    total: number
  }
  lastElectionVoters: {
    male: number
    female: number
    trans: number
    total: number
  }
  assemblies: Assembly[]
}

interface DistrictPageClientProps {
  data: DistrictData
}

export function DistrictPageClient({ data }: DistrictPageClientProps) {
  const districtDetailsData: DistrictDetailsData = {
    districtId: data.districtId,
    districtName: data.districtName,
    noOfAssemblies: data.noOfAssemblies,
    voters: data.voters,
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* District Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{data.districtName}</h1>
        <p className="text-muted-foreground">District Details and Assembly Constituencies</p>
      </div>

      {/* District Details Card */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">District Overview</h2>
        <DistrictDetailsCard data={districtDetailsData} />
      </section>

      {/* Population Changes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Population Changes since 2019</h2>
        <PopulationChangeCard voters={data.voters} lastElectionVoters={data.lastElectionVoters} />
      </section>

      {/* Assemblies List */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Assemblies in this District ({data.assemblies.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.assemblies.map((assembly) => (
            <Card key={assembly.assemblyId} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{assembly.name}</h3>
                    <p className="text-sm text-muted-foreground">{assembly.noOfBooths} booths</p>
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-4">
                  <Link href={`/assembly/${data.districtId}/${assembly.assemblyId}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Assembly
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
