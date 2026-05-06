'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PopulationChangeCard } from '@/components/PopulationChangeCard'
import { GenderChart } from '@/components/GenderChart'
import { MostWinningPartiesCard } from '@/components/MostWinningPartiesCard'
import { VotesSharesChart } from '@/components/VotesSharesChart'
import { getPartyColor } from '@/lib/partyColors'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { VoteTransferChart } from '@/components/VoteTransferChart'
import { PastWinningHistories } from '@/components/PastWinningHistories'
import { ViewOnMapCard } from '@/components/ViewOnMapCard'
import { CasteDemographicsCard } from '@/components/CasteDemographicsCard'
import {
  ArrowLeft,
  User,
  UserCircle2,
  Users,
  UsersRound,
  Locate,
  BookOpen,
  Factory,
  Building2,
  GraduationCap,
  HeartPulse,
  Bus,
  Landmark,
  Briefcase,
  Store,
} from 'lucide-react'
import { TwitterCardModal } from '@/components/TwitterCardModal'
import { trackViewed, trackClicked, getPageContext, setPageContext, PAGE_NAMES } from '@/analytics'
import { getCurrentUTM } from '@/utilities/utm'
import { AssemblyPageJsonLd } from '@/components/seo/JsonLd'

interface Candidate {
  name: string
  party: string
  votes: number
}

interface ElectionYear {
  year: number
  winner: string
  winnerParty: string
  winnerVotes: number
  totalVoters: number
  votesPolled: number
  candidates: Candidate[]
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

interface AllianceData {
  allianceName: string
  parties: { partyName: string }[]
  color: string
}

interface AssemblyData {
  assemblyId: string
  assemblySlug: string
  districtSlug: string
  districtId: string
  name: string
  districtName: string
  noOfBooths: number
  voters: {
    male: number
    female: number
    trans: number
    total: number
    isReservedAc: boolean
  } | null
  lastElectionVoters: {
    male: number
    female: number
    trans: number
    total: number
  } | null
  electedMla: any
  electionHistory: ElectionYear[]
  casteData: CasteData | null
  allianceData: Record<number, AllianceData[]>
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

interface AssemblyPageClientProps {
  data: AssemblyData
  stateSlug: string
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function AssemblyPageClient({ data, stateSlug }: AssemblyPageClientProps) {
  const [showAllWinningHistories, setShowAllWinningHistories] = React.useState(false)

  // Latest election vote-share pie
  const voteSharePie = React.useMemo((): {
    slices: { name: string; value: number; pct: number; color: string }[]
    year: number
  } | null => {
    if (!data.electionHistory.length) return null
    const latest = [...data.electionHistory].sort((a, b) => b.year - a.year)[0]!
    const total = latest.candidates.reduce((s, c) => s + c.votes, 0)
    if (!total) return null
    const sorted = [...latest.candidates].sort((a, b) => b.votes - a.votes)
    const TOP_N = 6
    const top = sorted.slice(0, TOP_N)
    const othersVotes = sorted.slice(TOP_N).reduce((s, c) => s + c.votes, 0)
    const slices = top.map((c) => ({
      name: c.party,
      value: c.votes,
      pct: +((c.votes / total) * 100).toFixed(1),
      color: getPartyColor(c.party),
    }))
    if (othersVotes > 0) {
      slices.push({
        name: 'Others',
        value: othersVotes,
        pct: +((othersVotes / total) * 100).toFixed(1),
        color: '#9ca3af',
      })
    }
    return { slices, year: latest.year }
  }, [data.electionHistory])

  React.useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
      page_url: window.location.href,
      page_path: window.location.pathname,
      ...getCurrentUTM(window.location.search),
    })
    trackViewed({
      name: 'assembly_page',
      page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
      page_url: window.location.href,
      page_path: window.location.pathname,
      assembly_id: data.assemblyId,
      assembly_name: data.name,
      district_id: data.districtId,
      district_name: data.districtName,
    })
  }, [])

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href={`/${stateSlug}/district/${data.districtSlug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {data.districtName}
          </Button>
        </Link>
      </div>

      {/* BBC Style Hero Section */}
      <div className="mb-8">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          {/* Title and Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {data.name}
            </h1>
            {data.voters?.isReservedAc ? (
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 text-white rounded">
                Reserved
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded">
                General
              </span>
            )}
          </div>
          {/* District name and Quick View */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">{data.districtName}</p>
            <TwitterCardModal assemblyId={data.assemblyId} assemblyName={data.name} data={data} />
          </div>
        </div>
      </div>

      {/* View on Map Card */}
      <div className="mb-8">
        <ViewOnMapCard assemblyId={data.assemblyId} assemblyName={data.name} />
      </div>

      {/* Assembly Overview */}
      {data.voters && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Assembly Overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              href={`/${stateSlug}/assembly/${data.districtSlug}/${data.assemblySlug}/booths`}
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Assembly Detail',
                  link_name: 'view_booths',
                  link_location: 'assembly_overview',
                })
              }}
            >
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <Locate className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Booths
                      </p>
                      <p className="text-xl font-bold">{data.noOfBooths}</p>
                      <p className="text-xs text-red-600 font-medium">View all →</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Male Voters
                    </p>
                    <p className="text-xl font-bold">{formatNumber(data.voters.male)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.male.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Female Voters
                    </p>
                    <p className="text-xl font-bold">{formatNumber(data.voters.female)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.female.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Transgender
                    </p>
                    <p className="text-xl font-bold">{data.voters.trans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total Voters
                    </p>
                    <p className="text-xl font-bold">{formatNumber(data.voters.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Vote Transfer: Last 2 Elections */}
      {data.electionHistory.length >= 2 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Vote Transfer: Last 2 Elections
          </h2>
          <VoteTransferChart electionHistory={data.electionHistory} />
        </section>
      )}

      {/* Past Winning histories */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Past Winning Histories
          </h2>
          <PastWinningHistories electionHistory={data.electionHistory} />
        </section>
      )}

      {/* Winning Histories since ADMK formed */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Winning Histories since ADMK formed
          </h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(showAllWinningHistories
              ? data.electionHistory
              : data.electionHistory.filter((e) => e.year >= 1977).slice(0, 3)
            ).map((election) => (
              <Card key={election.year}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col items-center space-y-2">
                    {/* Year */}
                    <span className="text-xs font-bold uppercase tracking-wide text-red-600">
                      {election.year}
                    </span>

                    {/* Party Logo */}
                    <Image
                      src={`/images/${election.winnerParty}.png`}
                      alt={`${election.winnerParty} logo`}
                      width={45}
                      height={35}
                      className="object-contain"
                    />

                    {/* Party Name */}
                    <span className="text-sm font-bold">{election.winnerParty}</span>

                    {/* Winner Name */}
                    <p className="text-xs text-center text-muted-foreground px-2 line-clamp-2">
                      {election.winner}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View all button */}
          {!showAllWinningHistories &&
            data.electionHistory.filter((e) => e.year >= 1977).length > 3 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const pageContext = getPageContext()
                    trackClicked({
                      name: 'button',
                      page_name: pageContext.page_name || 'Assembly Detail',
                      button_name: 'view_all_history',
                      button_label: 'View all',
                    })
                    setShowAllWinningHistories(true)
                  }}
                  className="text-sm font-medium"
                >
                  View all
                </Button>
              </div>
            )}
        </section>
      )}

      {/* Vote Shares — pie (latest) + historical bar chart side-by-side */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Vote Shares by Party
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pie: latest election */}
            {voteSharePie && voteSharePie.slices.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                    {voteSharePie.year} Vote Share
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={voteSharePie.slices}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={82}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {voteSharePie.slices.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(
                          value: number | string | undefined,
                          name: string | undefined,
                        ) => {
                          const entry = voteSharePie.slices.find(
                            (e: { name: string }) => e.name === name,
                          )
                          return [
                            `${Number(value ?? 0).toLocaleString()} votes (${entry?.pct ?? 0}%)`,
                            name ?? '',
                          ] as [string, string]
                        }}
                        contentStyle={{
                          fontSize: 11,
                          border: '1px solid #e5e7eb',
                          borderRadius: 4,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2">
                    {voteSharePie.slices.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1">
                        <div
                          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-[10px]">{entry.name}</span>
                        <span className="text-[10px] font-bold">{entry.pct}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bar: historical vote share across years */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                  Historical Vote Share
                </p>
                <VotesSharesChart electionHistory={data.electionHistory} />
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Gender chart */}
      {data.voters && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Gender Distribution
          </h2>
          <GenderChart voters={data.voters} />
        </section>
      )}

      {/* Caste Demographics */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Caste Demographics
        </h2>
        <CasteDemographicsCard casteData={data.casteData} />
      </section>

      {/* Population Changes */}
      {data.voters && data.lastElectionVoters && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Population Changes since 2019
          </h2>
          <PopulationChangeCard voters={data.voters} lastElectionVoters={data.lastElectionVoters} />
        </section>
      )}

      {/* Most Winning Parties since ADMK formed */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Most Winning Parties since ADMK formed
          </h2>
          <MostWinningPartiesCard
            historicData={data.electionHistory.map((e) => ({
              year: e.year,
              assemblyId: data.assemblyId,
              totalVoters: e.totalVoters,
              noOfVotesPolled: e.votesPolled,
              candidates: e.candidates.map((c, idx) => ({
                ...c,
                rank: idx + 1,
              })),
            }))}
            allianceData={data.allianceData}
          />
        </section>
      )}

      {/* Constituency Description */}
      {data.description && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            About this Constituency
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

      {/* Known Businesses & Local Info */}
      {data.knownBusinesses && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Economy & Local Information
          </h2>

          {/* Business Summary */}
          {data.knownBusinesses.businessSummary && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {data.knownBusinesses.businessSummary}
            </p>
          )}

          {/* Economic Mix - Horizontal Bar */}
          {data.knownBusinesses.economicMix.length > 0 && (
            <Card className="mb-4">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                  Economic Composition
                </p>
                <div className="flex w-full h-6 rounded overflow-hidden mb-2">
                  {data.knownBusinesses.economicMix.map((item, i) => {
                    const colors = [
                      'bg-red-600',
                      'bg-blue-600',
                      'bg-amber-500',
                      'bg-emerald-600',
                      'bg-gray-400',
                    ]
                    return (
                      <div
                        key={item.category}
                        className={`${colors[i % colors.length]} flex items-center justify-center`}
                        style={{ width: `${item.percentage}%` }}
                        title={`${item.category}: ${item.percentage}%`}
                      >
                        {item.percentage >= 12 && (
                          <span className="text-[10px] font-bold text-white truncate px-1">
                            {item.percentage}%
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {data.knownBusinesses.economicMix.map((item, i) => {
                    const dots = [
                      'bg-red-600',
                      'bg-blue-600',
                      'bg-amber-500',
                      'bg-emerald-600',
                      'bg-gray-400',
                    ]
                    return (
                      <div key={item.category} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${dots[i % dots.length]}`} />
                        <span className="text-xs text-muted-foreground">
                          {item.category} {item.percentage}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Industries + Employers Grid */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {/* Major Industries */}
            {data.knownBusinesses.majorIndustries.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Factory className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Major Industries
                    </p>
                  </div>
                  <div className="space-y-2">
                    {data.knownBusinesses.majorIndustries.map((item, idx) => (
                      <div key={`ind-${idx}`} className="flex items-center justify-between">
                        <span className="text-sm">{item.name}</span>
                        {item.percentage && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                            {item.percentage}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Employers */}
            {data.knownBusinesses.topEmployers.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Top Employers
                    </p>
                  </div>
                  <div className="space-y-2">
                    {data.knownBusinesses.topEmployers.map((item, idx) => (
                      <div key={`emp-${idx}`} className="flex items-center justify-between">
                        <span className="text-sm">{item.name}</span>
                        {item.workers && (
                          <span className="text-xs text-muted-foreground">
                            ~{item.workers.toLocaleString()} workers
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Local Business + Commercial Landmarks Grid */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            {/* Local Business Types */}
            {data.knownBusinesses.localBusinessTypes.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Local Business Types
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.knownBusinesses.localBusinessTypes.map((item, idx) => (
                      <span
                        key={`local-${idx}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded text-xs"
                      >
                        {item.name}
                        {item.percentage && (
                          <span className="text-muted-foreground">({item.percentage}%)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commercial Landmarks */}
            {data.knownBusinesses.commercialLandmarks.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Commercial Landmarks
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.knownBusinesses.commercialLandmarks.map((name, idx) => (
                      <span key={`cl-${idx}`} className="px-2.5 py-1 bg-muted rounded text-xs">
                        {name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Education, Healthcare, Transport, Landmarks - 4-column grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Education */}
            {data.knownBusinesses.education.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Education
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {data.knownBusinesses.education.map((item, idx) => (
                      <li key={`edu-${idx}`} className="text-xs">
                        <span className="font-medium">{item.name}</span>
                        {item.type && <span className="text-muted-foreground"> — {item.type}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Healthcare */}
            {data.knownBusinesses.healthcare.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HeartPulse className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Healthcare
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {data.knownBusinesses.healthcare.map((item, idx) => (
                      <li key={`health-${idx}`} className="text-xs">
                        <span className="font-medium">{item.name}</span>
                        {item.type && <span className="text-muted-foreground"> — {item.type}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Transport */}
            {data.knownBusinesses.transport.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bus className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Transport
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {data.knownBusinesses.transport.map((item, idx) => (
                      <li key={`transport-${idx}`} className="text-xs">
                        <span className="font-medium">{item.name}</span>
                        {item.type && <span className="text-muted-foreground"> — {item.type}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Landmarks */}
            {data.knownBusinesses.landmarks.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Landmarks
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {data.knownBusinesses.landmarks.map((item, idx) => (
                      <li key={`landmark-${idx}`} className="text-xs">
                        <span className="font-medium">{item.name}</span>
                        {item.type && <span className="text-muted-foreground"> — {item.type}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Structured Data for SEO */}
      <AssemblyPageJsonLd
        assemblyName={data.name.split(' / ')[1] || data.name}
        districtName={data.districtName.split(' / ')[1] || data.districtName}
        description={
          data.metaDescription ||
          `Election data for ${data.name} assembly constituency, Tamil Nadu.`
        }
        url={`https://indiastats.org/${stateSlug}/assembly/${data.districtSlug}/${data.assemblySlug}`}
      />
    </div>
  )
}
