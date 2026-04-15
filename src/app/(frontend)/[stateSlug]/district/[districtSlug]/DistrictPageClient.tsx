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
import { CasteComparisonTable } from '@/components/CasteComparisonTable'
import {
  ArrowLeft, ChevronRight, Building2, MapPin, Locate, BookOpen,
  Factory, GraduationCap, HeartPulse, Bus, Landmark, Briefcase, Store,
} from 'lucide-react'
import { trackViewed, trackClicked, getPageContext, setPageContext, PAGE_NAMES } from '@/analytics'
import { getCurrentUTM } from '@/utilities/utm'
import { DistrictPageJsonLd } from '@/components/seo/JsonLd'

interface Assembly {
  assemblyId: string
  assemblySlug: string
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

interface AllianceData {
  allianceName: string
  parties: { partyName: string }[]
  color: string
}

interface CasteData {
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

interface DistrictData {
  districtId: string
  districtSlug: string
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
  allianceData: Record<number, AllianceData[]>
  assemblyCasteData: CasteData[]
  description: string | null
  metaDescription: string | null
  knownBusinesses: KnownBusinesses | null
}

interface KnownBusinesses {
  economicMix: { category: string; percentage: number }[]
  majorIndustries: { name: string; percentage?: number }[]
  topEmployers: { name: string; workers?: number }[]
  localBusinessTypes: { name: string; percentage?: number }[]
  commercialLandmarks: string[]
  education: { name: string; type?: string }[]
  healthcare: { name: string; type?: string }[]
  transport: { name: string; type?: string }[]
  landmarks: { name: string; type?: string }[]
  businessSummary: string
}

interface DistrictPageClientProps {
  data: DistrictData
  stateSlug: string
}

export function DistrictPageClient({ data, stateSlug }: DistrictPageClientProps) {
  React.useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.DISTRICT_DETAIL,
      page_url: window.location.href,
      page_path: window.location.pathname,
      ...getCurrentUTM(window.location.search),
    })
    trackViewed({ name: 'district_page',
      page_name: PAGE_NAMES.DISTRICT_DETAIL,
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_type: 'district',
      district_id: data.districtId,
      district_name: data.districtName,
      assembly_count: data.noOfAssemblies,
    })
  }, [])

  const districtDetailsData: DistrictDetailsData = {
    districtId: data.districtId,
    districtName: data.districtName,
    noOfAssemblies: data.noOfAssemblies,
    voters: data.voters,
  }

  // Calculate total booths across all assemblies
  const totalBooths = data.assemblies.reduce((sum, a) => sum + (a.noOfBooths || 0), 0)

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href={`/${stateSlug}/dashboard`}>
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
              <Link
                href={`/${stateSlug}/assembly-map?district=${encodeURIComponent(data.districtName)}`}
                onClick={() => {
                  const pageContext = getPageContext()
                  trackClicked({ name: 'link',
                    page_name: pageContext.page_name || 'District Detail',
                    link_name: 'view_on_map',
                    link_location: 'district_header',
                  })
                }}
              >
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

        {/* Total Booths Summary */}
        <Card className="mt-4">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 dark:bg-green-950/30 p-2.5 rounded-lg">
                  <Locate className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalBooths.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Polling Booths across {data.assemblies.length} assemblies
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Avg per assembly</p>
                <p className="text-lg font-semibold">
                  {data.assemblies.length > 0
                    ? Math.round(totalBooths / data.assemblies.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Most Winning Parties */}
      {data.electionHistory && data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Most Winning Parties since ADMK formed
          </h2>
          <MostWinningPartiesCard
            historicData={data.electionHistory}
            allianceData={data.allianceData}
          />
        </section>
      )}

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

      {/* Caste Demographics by Assembly */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Caste Demographics by Assembly
        </h2>
        <CasteComparisonTable assemblyCasteData={data.assemblyCasteData} />
      </section>

      {/* Year-wise Party Performance */}
      {data.electionHistory && data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Year-wise Party Performance
          </h2>
          <PartyWinsChart historicData={data.electionHistory} />
        </section>
      )}

      {/* District Description */}
      {data.description && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            About this District
          </h2>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded">
                  <BookOpen className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  {data.description.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-sm text-muted-foreground leading-relaxed mb-3 last:mb-0"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60 italic border-t pt-3 mt-3">
                AI-generated summary based on Wikipedia and election data
              </p>
            </CardContent>
          </Card>
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
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/${stateSlug}/assembly/${data.districtSlug}/${assembly.assemblySlug}`}
                    className="flex-1"
                    onClick={() => {
                      const pageContext = getPageContext()
                      trackClicked({ name: 'link',
                        page_name: pageContext.page_name || 'District Detail',
                        link_name: 'view_assembly',
                        link_location: 'assembly_card',
                      })
                    }}
                  >
                    <Button variant="outline" size="sm" className="w-full text-sm">
                      View Assembly
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    href={`/${stateSlug}/assembly/${data.districtSlug}/${assembly.assemblySlug}/booths`}
                    onClick={() => {
                      const pageContext = getPageContext()
                      trackClicked({ name: 'link',
                        page_name: pageContext.page_name || 'District Detail',
                        link_name: 'view_booths',
                        link_location: 'assembly_card',
                      })
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-green-600 hover:text-green-700"
                    >
                      <Locate className="h-4 w-4 mr-1" />
                      Booths
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Known Businesses & Local Info */}
      {data.knownBusinesses && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Economy & Local Information
          </h2>

          {data.knownBusinesses.businessSummary && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {data.knownBusinesses.businessSummary}
            </p>
          )}

          {/* Economic Mix */}
          {data.knownBusinesses.economicMix.length > 0 && (
            <Card className="mb-4">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Economic Composition</p>
                <div className="flex w-full h-6 rounded overflow-hidden mb-2">
                  {data.knownBusinesses.economicMix.map((item, i) => {
                    const colors = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-gray-400']
                    return (
                      <div key={item.category} className={`${colors[i % colors.length]} flex items-center justify-center`}
                        style={{ width: `${item.percentage}%` }} title={`${item.category}: ${item.percentage}%`}>
                        {item.percentage >= 12 && <span className="text-[10px] font-bold text-white truncate px-1">{item.percentage}%</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {data.knownBusinesses.economicMix.map((item, i) => {
                    const dots = ['bg-red-600', 'bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-gray-400']
                    return (
                      <div key={item.category} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${dots[i % dots.length]}`} />
                        <span className="text-xs text-muted-foreground">{item.category} {item.percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Industries + Employers */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {data.knownBusinesses.majorIndustries.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Factory className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Major Industries</p>
                  </div>
                  <div className="space-y-2">
                    {data.knownBusinesses.majorIndustries.map((item, idx) => (
                      <div key={`ind-${idx}`} className="flex items-center justify-between">
                        <span className="text-sm">{item.name}</span>
                        {item.percentage && <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">{item.percentage}%</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.knownBusinesses.topEmployers.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Top Employers</p>
                  </div>
                  <div className="space-y-2">
                    {data.knownBusinesses.topEmployers.map((item, idx) => (
                      <div key={`emp-${idx}`} className="flex items-center justify-between">
                        <span className="text-sm">{item.name}</span>
                        {item.workers && <span className="text-xs text-muted-foreground">~{item.workers.toLocaleString()} workers</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Local Business + Commercial Landmarks */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {data.knownBusinesses.localBusinessTypes.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Local Business Types</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.knownBusinesses.localBusinessTypes.map((item, idx) => (
                      <span key={`local-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded text-xs">
                        {item.name}{item.percentage && <span className="text-muted-foreground">({item.percentage}%)</span>}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.knownBusinesses.commercialLandmarks.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Commercial Landmarks</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.knownBusinesses.commercialLandmarks.map((name, idx) => (
                      <span key={`cl-${idx}`} className="px-2.5 py-1 bg-muted rounded text-xs">{name}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Education, Healthcare, Transport, Landmarks */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.knownBusinesses.education.length > 0 && (
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3"><GraduationCap className="h-4 w-4 text-red-600" /><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Education</p></div>
                <ul className="space-y-1.5">{data.knownBusinesses.education.map((item, idx) => (
                  <li key={`edu-${idx}`} className="text-xs"><span className="font-medium">{item.name}</span>{item.type && <span className="text-muted-foreground"> — {item.type}</span>}</li>
                ))}</ul>
              </CardContent></Card>
            )}
            {data.knownBusinesses.healthcare.length > 0 && (
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3"><HeartPulse className="h-4 w-4 text-red-600" /><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Healthcare</p></div>
                <ul className="space-y-1.5">{data.knownBusinesses.healthcare.map((item, idx) => (
                  <li key={`health-${idx}`} className="text-xs"><span className="font-medium">{item.name}</span>{item.type && <span className="text-muted-foreground"> — {item.type}</span>}</li>
                ))}</ul>
              </CardContent></Card>
            )}
            {data.knownBusinesses.transport.length > 0 && (
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3"><Bus className="h-4 w-4 text-red-600" /><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Transport</p></div>
                <ul className="space-y-1.5">{data.knownBusinesses.transport.map((item, idx) => (
                  <li key={`transport-${idx}`} className="text-xs"><span className="font-medium">{item.name}</span>{item.type && <span className="text-muted-foreground"> — {item.type}</span>}</li>
                ))}</ul>
              </CardContent></Card>
            )}
            {data.knownBusinesses.landmarks.length > 0 && (
              <Card><CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-3"><Landmark className="h-4 w-4 text-red-600" /><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Landmarks</p></div>
                <ul className="space-y-1.5">{data.knownBusinesses.landmarks.map((item, idx) => (
                  <li key={`landmark-${idx}`} className="text-xs"><span className="font-medium">{item.name}</span>{item.type && <span className="text-muted-foreground"> — {item.type}</span>}</li>
                ))}</ul>
              </CardContent></Card>
            )}
          </div>
        </section>
      )}

      {/* Structured Data for SEO */}
      <DistrictPageJsonLd
        districtName={data.districtName.split(' / ')[1] || data.districtName}
        description={data.metaDescription || `Election data for ${data.districtName} district, Tamil Nadu.`}
        url={`https://indiastats.org/${stateSlug}/district/${data.districtSlug}`}
        assemblyCount={data.noOfAssemblies}
      />
    </div>
  )
}
