'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Map,
  MapPinned,
  BarChart3,
  Users,
  Vote,
  Download,
  ChevronRight,
} from 'lucide-react'
import { DistrictSearch, District } from '@/components/DistrictSearch'
import { AssemblySearch, Assembly } from '@/components/AssemblySearch'
import { trackViewed, trackClicked, getPageContext, PAGE_NAMES } from '@/analytics'
import type { BlocConfig } from '@/config/states/types'

interface AssemblyData {
  assemblyId: string
  assemblySlug: string
  districtId: string
  districtSlug: string
  districtName: string
  name: string
  voters?: { male?: number; female?: number; trans?: number; total?: number }
}

interface SnapshotResult {
  year: number
  results: { name: string; seats: number; color: string }[]
}

interface DashboardClientProps {
  assemblies: AssemblyData[]
  districts: District[]
  stateSlug: string
  blocs: BlocConfig[]
  partyColors: Record<string, string>
  snapshot: SnapshotResult | null
  lastElectionYear: number
}

const EXPLORE_CARDS = [
  {
    key: 'map',
    title: 'Assembly Map',
    description: 'Interactive colour-coded map of all constituencies',
    icon: <Map className="h-6 w-6 text-red-500" />,
    iconBg: 'bg-red-600/20 group-hover:bg-red-600/30',
    hoverBorder: 'hover:border-red-500/50',
    hoverText: 'group-hover:text-red-400',
    ctaColor: 'text-red-500',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/assembly-map`,
    cta: 'Explore',
  },
  {
    key: 'analysis',
    title: 'Election Analysis',
    description: 'Deep dive: vote shares, seat flips, closest races',
    icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
    iconBg: 'bg-purple-600/20 group-hover:bg-purple-600/30',
    hoverBorder: 'hover:border-purple-500/50',
    hoverText: 'group-hover:text-purple-400',
    ctaColor: 'text-purple-400',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/election-analysis/${lastYear}`,
    cta: 'Analyse',
  },
  {
    key: 'results',
    title: 'Election Results',
    description: 'Live and final results map by constituency',
    icon: <Vote className="h-6 w-6 text-yellow-400" />,
    iconBg: 'bg-yellow-500/20 group-hover:bg-yellow-500/30',
    hoverBorder: 'hover:border-yellow-500/50',
    hoverText: 'group-hover:text-yellow-400',
    ctaColor: 'text-yellow-400',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/election-results`,
    cta: 'View',
  },
  {
    key: 'caste',
    title: 'Caste Demographics',
    description: 'Population breakdown by constituency',
    icon: <Users className="h-6 w-6 text-blue-400" />,
    iconBg: 'bg-blue-600/20 group-hover:bg-blue-600/30',
    hoverBorder: 'hover:border-blue-500/50',
    hoverText: 'group-hover:text-blue-400',
    ctaColor: 'text-blue-400',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/caste-demographics`,
    cta: 'Explore',
  },
  {
    key: 'districts',
    title: 'District Explorer',
    description: 'Browse election data by district',
    icon: <MapPinned className="h-6 w-6 text-red-500" />,
    iconBg: 'bg-red-600/20 group-hover:bg-red-600/30',
    hoverBorder: 'hover:border-red-500/50',
    hoverText: 'group-hover:text-red-400',
    ctaColor: 'text-red-500',
    href: (stateSlug: string, lastYear: number) => `/${stateSlug}/dashboard`,
    cta: 'Browse',
  },
  {
    key: 'data',
    title: 'Election Data Table',
    description: 'Filter, sort & export all candidate data',
    icon: <Download className="h-6 w-6 text-green-400" />,
    iconBg: 'bg-green-600/20 group-hover:bg-green-600/30',
    hoverBorder: 'hover:border-green-500/50',
    hoverText: 'group-hover:text-green-400',
    ctaColor: 'text-green-400',
    href: (stateSlug: string, lastYear: number) => `/election-data`,
    cta: 'Download',
  },
]

export function DashboardClient({
  assemblies,
  districts,
  stateSlug,
  blocs,
  partyColors,
  snapshot,
  lastElectionYear,
}: DashboardClientProps) {
  React.useEffect(() => {
    trackViewed({
      name: 'dashboard_page',
      page_name: PAGE_NAMES.DASHBOARD,
      page_type: 'other',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

  const handleAssemblySearch = (district: District, assembly: Assembly) => {
    console.log('Assembly selected:', { district, assembly })
  }

  return (
    <>
      {/* Bloc Cards */}
      {blocs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Political Blocs</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {blocs.map((bloc) => (
              <div
                key={bloc.name}
                className="border border-border rounded-xl p-5 flex flex-col gap-3"
                style={{ borderLeftColor: bloc.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-3">
                  {bloc.leaderImage && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-border">
                      <Image
                        src={bloc.leaderImage}
                        alt={bloc.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm">{bloc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {bloc.parties.length} {bloc.parties.length === 1 ? 'party' : 'parties'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bloc.parties.map((party) => (
                    <span
                      key={party}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: partyColors[party] ?? '#666' }}
                    >
                      {party}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last Election Snapshot */}
      {snapshot && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            {snapshot.year} Election Results
          </h2>
          <div className="border border-border rounded-xl p-5">
            <div className="flex flex-wrap gap-3 mb-4">
              {snapshot.results.map((r) => (
                <div key={r.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span
                    className="text-lg font-black"
                    style={{ color: r.color }}
                  >
                    {r.seats}
                  </span>
                  <span className="text-xs text-muted-foreground">seats</span>
                </div>
              ))}
            </div>
            {/* Visual seat bar */}
            <div className="flex rounded-full overflow-hidden h-3">
              {snapshot.results.map((r) => {
                const total = snapshot.results.reduce((s, x) => s + x.seats, 0)
                return (
                  <div
                    key={r.name}
                    className="h-full transition-all"
                    style={{
                      width: `${(r.seats / total) * 100}%`,
                      backgroundColor: r.color,
                    }}
                    title={`${r.name}: ${r.seats} seats`}
                  />
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* What You Can Explore */}
      <section className="mb-8 bg-[#1a1a2e] rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">What You Can Explore</h2>
          <p className="text-white/50 text-sm">All the tools available for this state</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPLORE_CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.href(stateSlug, lastElectionYear)}
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Dashboard',
                  link_name: `dashboard_explore_${card.key}`,
                  link_location: 'what_you_can_explore',
                })
              }}
            >
              <div className={`h-full p-6 rounded-xl bg-white/5 border border-white/10 ${card.hoverBorder} transition-all duration-300`}>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 transition-colors`}>
                  {card.icon}
                </div>
                <h3 className={`text-base font-semibold text-white mb-2 ${card.hoverText} transition-colors`}>
                  {card.title}
                </h3>
                <p className="text-white/50 text-sm mb-4">{card.description}</p>
                <div className={`flex items-center ${card.ctaColor} text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                  {card.cta} <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* District Search */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">District Search</h2>
        <DistrictSearch districts={districts} />
      </section>

      {/* Assembly Search */}
      <section className="mb-8">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Assembly Search</h2>
        <AssemblySearch assemblies={assemblies} districts={districts} onSearch={handleAssemblySearch} />
      </section>
    </>
  )
}
