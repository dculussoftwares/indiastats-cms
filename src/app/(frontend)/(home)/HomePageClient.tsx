'use client'
import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Map,
  MapPinned,
  ChevronRight,
  BarChart3,
  Users,
  TrendingUp,
  Github,
  Star,
  Search,
  Download,
  Activity,
  FlaskConical,
  Zap,
  Scale,
  GitMerge,
  Building2,
  PieChart,
  Target,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackViewed, trackClicked, getPageContext, setPageContext, PAGE_NAMES } from '@/analytics'
import { getCurrentUTM } from '@/utilities/utm'
import type { StateConfig } from '@/config/states/types'

interface HomePageClientProps {
  stats: {
    totalDistricts: number
    totalAssemblies: number
    totalBooths: number
    totalVoters: number
  }
  states: StateConfig[]
}

// Animated counter hook
function useAnimatedCounter(endValue: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(easeOutQuart * endValue)

      if (currentValue !== countRef.current) {
        countRef.current = currentValue
        setCount(currentValue)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }

    requestAnimationFrame(animate)

    return () => {
      startTimeRef.current = null
    }
  }, [endValue, duration])

  return count
}

function formatNumber(num: number): string {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(2) + ' Cr'
  }
  if (num >= 100000) {
    return (num / 100000).toFixed(1) + ' L'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString('en-IN')
}

function StatCounter({ value, label }: { value: number; label: string }) {
  const animatedValue = useAnimatedCounter(value, 2000)
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">{formatNumber(animatedValue)}</div>
      <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{label}</div>
    </div>
  )
}

export function HomePageClient({ stats, states }: HomePageClientProps) {
  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.HOMEPAGE,
      page_url: window.location.href,
      page_path: window.location.pathname,
      ...getCurrentUTM(window.location.search),
    })
    trackViewed({
      name: 'home_page',
      page_name: PAGE_NAMES.HOMEPAGE,
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Dark Hero with Tricolor Accent */}
      <section className="relative bg-[#1a1a2e] overflow-hidden">
        {/* Indian tricolor accent at top */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="container relative py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              {/* GitHub Badge */}
              <a
                href="https://github.com/dculussoftwares/indiastats-cms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>Open Source Project</span>
                <Star className="h-4 w-4 text-yellow-400 ml-1" />
              </a>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                <span className="text-[#FF9933]">India</span>Stats
              </h1>

              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                The most comprehensive election data platform for India. Explore detailed election
                history, constituency demographics, and voting patterns.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                  <Link
                    href="/tamil-nadu/dashboard"
                    onClick={() => {
                      const pageContext = getPageContext()
                      trackClicked({
                        name: 'button',
                        page_name: pageContext.page_name || 'Homepage',
                        button_name: 'explore_data',
                        button_label: 'Explore Data',
                      })
                    }}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Explore Data
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Link
                    href="/tamil-nadu/assembly-map"
                    onClick={() => {
                      const pageContext = getPageContext()
                      trackClicked({
                        name: 'button',
                        page_name: pageContext.page_name || 'Homepage',
                        button_name: 'interactive_map',
                        button_label: 'Interactive Map',
                      })
                    }}
                  >
                    <Map className="mr-2 h-5 w-5" />
                    Interactive Map
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h3 className="text-white/50 text-sm uppercase tracking-wider mb-6 text-center">
                India at a Glance
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <StatCounter value={stats.totalDistricts} label="Districts" />
                <StatCounter value={stats.totalAssemblies} label="Assemblies" />
                <StatCounter value={stats.totalBooths} label="Booths" />
                <StatCounter value={stats.totalVoters} label="Voters" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by State */}
      <section className="bg-[#0f0f1a] py-14 border-b border-white/5">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Browse by State</h2>
            <p className="text-white/50 text-sm">Choose a state to explore its election data</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {states.map((state) => {
              const now = new Date().getFullYear()
              const nextYear = state.electionYears.find((y) => y > now)
              const topParties = state.majorParties.slice(0, 4)
              return (
                <Link
                  key={state.code}
                  href={`/${state.slug}/dashboard`}
                  className="group"
                  onClick={() => {
                    const pageContext = getPageContext()
                    trackClicked({
                      name: 'link',
                      page_name: pageContext.page_name || 'Homepage',
                      link_name: `state_card_${state.code.toLowerCase()}`,
                      link_location: 'browse_by_state',
                    })
                  }}
                >
                  <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                          {state.name}
                        </h3>
                        <p className="text-white/40 text-xs mt-1">Data from {state.historyStartYear}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-red-400 transition-colors mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{state.assemblyCount}</div>
                        <div className="text-white/40 text-xs uppercase tracking-wide mt-1">Seats</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{state.districtCount}</div>
                        <div className="text-white/40 text-xs uppercase tracking-wide mt-1">Districts</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {topParties.map((party) => (
                          <div
                            key={party}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ backgroundColor: state.partyColors[party] ?? '#666' }}
                            title={party}
                          >
                            {party.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      {nextYear && (
                        <span className="text-xs text-yellow-400/80 font-medium">Next: {nextYear}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Election Analysis Feature — most important section */}
      <section className="bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] py-16 border-y border-white/5">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-600/15 border border-red-600/30 rounded-full px-3 py-1 mb-3">
                <Zap className="h-3.5 w-3.5 text-red-500" />
                <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                  Deep Analytics
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                Election Analysis
                <span className="block text-red-500 text-xl md:text-2xl font-normal mt-1">
                  The most comprehensive psephology dashboard in India
                </span>
              </h2>
              <p className="text-white/50 mt-3 max-w-xl text-sm leading-relaxed">
                Go beyond raw results. Every election year dissected through{' '}
                <span className="text-white/80 font-semibold">10+ analytical lenses</span> — from
                FPTP distortion and vote-split math to district dominance maps and security deposit
                forfeitures.
              </p>
            </div>
            <Link href="/tamil-nadu/election-analysis/2026">
              <div
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-colors text-white font-semibold px-5 py-3 rounded-lg text-sm whitespace-nowrap"
                onClick={() => {
                  const pageContext = getPageContext()
                  trackClicked({
                    name: 'election_analysis_cta',
                    page_name: pageContext.page_name || 'Homepage',
                    cta_label: 'Explore 2026 Analysis',
                    cta_location: 'election_analysis_feature_header',
                  })
                }}
              >
                Explore 2026 Analysis
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Analysis modules grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {[
              {
                icon: <Scale className="h-5 w-5" />,
                title: 'Vote-to-Seat Disproportionality',
                desc: 'Gallagher Index — how FPTP manufactures majorities',
                color: 'red',
                hash: 'vote-to-seat',
              },
              {
                icon: <PieChart className="h-5 w-5" />,
                title: 'Plurality Winners',
                desc: 'Seats won with <50% of votes — the spoiler effect',
                color: 'orange',
                hash: 'plurality-winners',
              },
              {
                icon: <GitMerge className="h-5 w-5" />,
                title: 'Seat Flip Sankey',
                desc: 'How seats changed hands between parties',
                color: 'violet',
                hash: 'seat-flips',
              },
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: 'Vote Share Wave',
                desc: 'Party trajectories across election cycles',
                color: 'blue',
                hash: 'vote-wave',
              },
              {
                icon: <Target className="h-5 w-5" />,
                title: 'Contest Intensity',
                desc: 'Candidate density vs winning margins',
                color: 'indigo',
                hash: 'contest-intensity',
              },
              {
                icon: <Building2 className="h-5 w-5" />,
                title: 'District Dominance',
                desc: 'Geographic strongholds — seat-dot scorecards',
                color: 'teal',
                hash: 'district-dominance',
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                title: 'Runner-Up Analysis',
                desc: 'The eternal bridesmaid — near-miss constituencies',
                color: 'amber',
                hash: 'runner-up',
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: 'Mandate Meter',
                desc: 'Vote share vs previous election, party by party',
                color: 'emerald',
                hash: 'vote-share',
              },
              {
                icon: <Activity className="h-5 w-5" />,
                title: 'Nail-biters & Landslides',
                desc: `Margin scatter across all ${stats.totalAssemblies} constituencies`,
                color: 'rose',
                hash: 'nail-biters',
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: 'Security Deposits',
                desc: 'Parties whose candidates forfeited deposits',
                color: 'red',
                hash: 'deposits',
              },
            ].map((m) => {
              const colorMap: Record<string, string> = {
                red: 'bg-red-600/15 border-red-600/20 group-hover:border-red-500/50',
                orange: 'bg-orange-600/15 border-orange-600/20 group-hover:border-orange-500/50',
                violet: 'bg-violet-600/15 border-violet-600/20 group-hover:border-violet-500/50',
                blue: 'bg-blue-600/15 border-blue-600/20 group-hover:border-blue-500/50',
                indigo: 'bg-indigo-600/15 border-indigo-600/20 group-hover:border-indigo-500/50',
                teal: 'bg-teal-600/15 border-teal-600/20 group-hover:border-teal-500/50',
                amber: 'bg-amber-600/15 border-amber-600/20 group-hover:border-amber-500/50',
                emerald:
                  'bg-emerald-600/15 border-emerald-600/20 group-hover:border-emerald-500/50',
                rose: 'bg-rose-600/15 border-rose-600/20 group-hover:border-rose-500/50',
              }
              const iconColorMap: Record<string, string> = {
                red: 'text-red-400',
                orange: 'text-orange-400',
                violet: 'text-violet-400',
                blue: 'text-blue-400',
                indigo: 'text-indigo-400',
                teal: 'text-teal-400',
                amber: 'text-amber-400',
                emerald: 'text-emerald-400',
                rose: 'text-rose-400',
              }
              return (
                <Link
                  key={m.title}
                  href={`/tamil-nadu/election-analysis/2026#${m.hash}`}
                  className={`group p-4 rounded-xl border bg-white/[0.03] ${colorMap[m.color] ?? colorMap.red} hover:bg-white/[0.07] transition-all duration-200`}
                  onClick={() => {
                    const pageContext = getPageContext()
                    trackClicked({
                      name: 'analysis_module',
                      page_name: pageContext.page_name || 'Homepage',
                      module_name: m.title,
                      module_hash: m.hash,
                      module_color: m.color,
                    })
                  }}
                >
                  <div className={`mb-2 ${iconColorMap[m.color] ?? iconColorMap.red}`}>
                    {m.icon}
                  </div>
                  <p className="text-white text-[12px] font-semibold leading-snug mb-1">
                    {m.title}
                  </p>
                  <p className="text-white/40 text-[10px] leading-relaxed">{m.desc}</p>
                </Link>
              )
            })}
          </div>

          {/* Bottom strip: year switcher teaser */}
          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/5">
            <span className="text-white/30 text-xs uppercase tracking-wider">Available for</span>
            {[2026, 2021, 2016, 2011, 2006].map((y) => (
              <Link
                key={y}
                href={`/tamil-nadu/election-analysis/${y}`}
                className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${
                  y === 2026
                    ? 'border-red-500/60 text-red-400 bg-red-600/10 hover:bg-red-600/20'
                    : 'border-white/10 text-white/50 hover:border-red-500/50 hover:text-red-400'
                }`}
                onClick={() => {
                  const pageContext = getPageContext()
                  trackClicked({
                    name: 'election_analysis_year',
                    page_name: pageContext.page_name || 'Homepage',
                    year: y,
                    year_location: 'election_analysis_year_strip',
                  })
                }}
              >
                {y === 2026 ? '2026 ✦' : y}
              </Link>
            ))}
            <span className="text-white/20 text-xs">+ all Tamil Nadu elections</span>
          </div>
        </div>
      </section>

      {/* Features Section - Dark theme matching hero */}
      <section className="bg-[#1a1a2e] py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">What You Can Explore</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Powerful tools to analyze election data across Tamil Nadu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {/* Interactive Map */}
            <Link
              href="/tamil-nadu/assembly-map"
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'interactive_map_card',
                  link_location: 'features_section',
                })
              }}
            >
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mb-4 group-hover:bg-red-600/30 transition-colors">
                  <Map className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  Interactive Map
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  Color-coded election results by constituency
                </p>
                <div className="flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* District Explorer */}
            <Link href="/tamil-nadu/dashboard" className="group">
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mb-4 group-hover:bg-red-600/30 transition-colors">
                  <MapPinned className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  District Explorer
                </h3>
                <p className="text-white/50 text-sm mb-4">Deep dive into {stats.totalDistricts} districts data</p>
                <div className="flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Election History */}
            <Link href="/tamil-nadu/dashboard" className="group">
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mb-4 group-hover:bg-red-600/30 transition-colors">
                  <BarChart3 className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  Election History
                </h3>
                <p className="text-white/50 text-sm mb-4">15+ years of party performance</p>
                <div className="flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Caste Demographics */}
            <Link href="/tamil-nadu/caste-demographics" className="group">
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mb-4 group-hover:bg-red-600/30 transition-colors">
                  <Users className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  Caste Demographics
                </h3>
                <p className="text-white/50 text-sm mb-4">Population data by constituency</p>
                <div className="flex items-center text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Election Data Table */}
            <Link
              href="/election-data"
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'election_data_table_card',
                  link_location: 'features_section',
                })
              }}
            >
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center mb-4 group-hover:bg-green-600/30 transition-colors">
                  <Download className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                  Election Data Table
                </h3>
                <p className="text-white/50 text-sm mb-4">Filter, sort & export to Excel</p>
                <div className="flex items-center text-green-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Vote Transfer Chart */}
            <Link
              href="/tamil-nadu/assembly/chennai-north/villivakkam"
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'vote_transfer_chart_card',
                  link_location: 'features_section',
                })
              }}
            >
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-yellow-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4 group-hover:bg-yellow-500/30 transition-colors">
                  <TrendingUp className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                  Vote Transfer Chart
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  See how votes shifted between 2021 & 2026 in every seat
                </p>
                <div className="flex items-center text-yellow-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Election Results */}
            <Link
              href="/tamil-nadu/election-results"
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'election_results_card',
                  link_location: 'features_section',
                })
              }}
            >
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center mb-4 group-hover:bg-red-600/30 transition-colors relative">
                  <Activity className="h-6 w-6 text-red-400" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  Live Election Results
                </h3>
                <p className="text-white/50 text-sm mb-4">TV-mode live count map for 2026</p>
                <div className="flex items-center text-red-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Watch Live <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>

            {/* Election Analysis */}
            <Link
              href="/tamil-nadu/election-analysis/2026"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'election_analysis_hero_cta',
                  link_location: 'election_analysis_feature',
                })
              }}
              className="group"
            >
              <div className="h-full p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors">
                  <FlaskConical className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  Election Analysis
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  Deep dive: vote shares, seat flips, closest races & trends
                </p>
                <div className="flex items-center text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Analyse <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* About IndiaStats — editorial section for SEO / AdSense content value */}
      <section className="bg-white dark:bg-background py-16 border-t border-border">
        <div className="container max-w-4xl">
          <div className="border-l-4 border-red-600 pl-3 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">What is IndiaStats.org?</h2>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <p>
              IndiaStats.org is a free, open-source election data platform that brings together
              constituency-level electoral records from across India's state assembly elections. Our
              mission is to make political data transparent, searchable, and accessible to every
              citizen — journalists, researchers, students, and curious voters alike.
            </p>

            <p>
              The platform currently covers{' '}
              <strong className="text-foreground">{stats.totalAssemblies} assembly constituencies across Tamil Nadu and Uttar Pradesh</strong>
              , with detailed records spanning decades of election history. Each constituency page
              shows vote counts, winning margins, candidate lists, voter turnout, and demographic
              breakdowns — all sourced from official Election Commission of India data.
            </p>

            <div className="grid md:grid-cols-3 gap-6 not-prose my-8">
              <div className="border border-border rounded p-5">
                <div className="text-2xl font-bold text-red-600 mb-1">15+ Elections</div>
                <p className="text-sm text-muted-foreground">
                  Historical data across {stats.totalAssemblies} constituencies in Tamil Nadu and Uttar Pradesh
                </p>
              </div>
              <div className="border border-border rounded p-5">
                <div className="text-2xl font-bold text-red-600 mb-1">{stats.totalBooths.toLocaleString('en-IN')}+ Booths</div>
                <p className="text-sm text-muted-foreground">
                  Polling booth-level voter data including male, female, and third-gender counts
                </p>
              </div>
              <div className="border border-border rounded p-5">
                <div className="text-2xl font-bold text-red-600 mb-1">Free & Open</div>
                <p className="text-sm text-muted-foreground">
                  All data is publicly accessible via our REST API and web interface at no cost
                </p>
              </div>
            </div>

            <p>
              India's state assembly elections tell the story of its democracy — caste arithmetic,
              alliance shifts, anti-incumbency waves, and emergence of new political forces.
              IndiaStats.org lets you trace these stories ward by ward, district by district,
              election by election — across Tamil Nadu's Dravidian politics and Uttar Pradesh's
              BJP-SP-BSP triangle, with more states coming soon.
            </p>

            <p>
              Beyond vote counts, the platform provides caste-demographic overlays, SC/ST reserved
              constituency flags, alliance breakdowns by electoral zone, and 2026 assembly election
              predictions from independent analysts. Whether you're verifying a statistic for an
              article, building a research model, or simply trying to understand why a particular
              constituency swings the way it does — IndiaStats.org has the data you need.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
