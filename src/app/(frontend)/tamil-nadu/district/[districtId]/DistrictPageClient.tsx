'use client'
import * as React from 'react'
import Link from 'next/link'
import { DistrictDetailsCard, DistrictDetailsData } from '@/components/DistrictDetailsCard'
import { PopulationChangeCard } from '@/components/PopulationChangeCard'
import { GenderChart } from '@/components/GenderChart'
import { PartyWinsChart } from '@/components/PartyWinsChart'
import { MostWinningPartiesCard } from '@/components/MostWinningPartiesCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight, Building2, MapPin } from 'lucide-react'

interface Assembly {
  assemblyId: string
  name: string
  noOfBooths: number
}

interface ElectionData {
  year: number
  assemblyId: string
  totalVoters: number
  noOfVotesPolled: number
  candidates: {
    name: string
    party: string
    votes: number
    rank: number
  }[]
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
  electionHistory: ElectionData[]
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
        <Link href="/tamil-nadu/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* BBC Style District Title */}
      <div className="mb-8">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <h1 className="text-3xl font-bold text-foreground">{data.districtName}</h1>
          <p className="text-muted-foreground text-sm">
            District Details and Assembly Constituencies
          </p>
        </div>
      </div>

      {/* View on Map Card */}
      <section className="mb-8">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">View on Map</p>
                  <p className="text-xs text-muted-foreground">
                    See {data.districtName} assemblies on the interactive map
                  </p>
                </div>
              </div>
              <Link href="/tamil-nadu/assembly-map">
                <Button variant="outline" size="sm" className="text-sm">
                  Open Map
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* District Details Card */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">District Overview</h2>
        <DistrictDetailsCard data={districtDetailsData} />
      </section>

      {/* Population Changes */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Population Changes since 2019
        </h2>
        <PopulationChangeCard voters={data.voters} lastElectionVoters={data.lastElectionVoters} />
      </section>

      {/* Gender Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Gender Distribution
        </h2>
        <GenderChart voters={data.voters} />
      </section>

      {/* Most Winning Parties */}
      {data.electionHistory && data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Most Winning Parties since ADMK formed
          </h2>
          <MostWinningPartiesCard historicData={data.electionHistory} />
        </section>
      )}

      {/* Year-wise Party Performance */}
      {data.electionHistory && data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Year-wise Party Performance
          </h2>
          <PartyWinsChart historicData={data.electionHistory} />
        </section>
      )}

      {/* Assemblies List */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Assemblies in this District ({data.assemblies.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.assemblies.map((assembly) => (
            <Card key={assembly.assemblyId}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{assembly.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {assembly.noOfBooths} booths
                    </p>
                  </div>
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <div className="mt-3">
                  <Link href={`/tamil-nadu/assembly/${data.districtId}/${assembly.assemblyId}`}>
                    <Button variant="outline" size="sm" className="w-full text-sm">
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
