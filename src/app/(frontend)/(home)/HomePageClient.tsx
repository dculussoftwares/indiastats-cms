'use client'
import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Map,
  MapPinned,
  UsersRound,
  Locate,
  ChevronRight,
  BarChart3,
  Users,
  Vote,
  TrendingUp,
  Github,
  Star,
  Search,
  ExternalLink,
  Download,
  User,
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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trackViewed, trackClicked, getPageContext, setPageContext, PAGE_NAMES } from '@/analytics'
import { getCurrentUTM } from '@/utilities/utm'
interface HomePageClientProps {
  stats: {
    totalDistricts: number
    totalAssemblies: number
    totalBooths: number
    totalVoters: number
  }
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

export function HomePageClient({ stats }: HomePageClientProps) {
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
                Tamil Nadu at a Glance
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
            <Link
              href="/tamil-nadu/election-analysis/2021"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'election_analysis_hero_cta',
                  link_location: 'election_analysis_feature',
                })
              }}
            >
              <div className="flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-colors text-white font-semibold px-5 py-3 rounded-lg text-sm whitespace-nowrap">
                Explore 2021 Analysis
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
              },
              {
                icon: <PieChart className="h-5 w-5" />,
                title: 'Plurality Winners',
                desc: 'Seats won with <50% of votes — the spoiler effect',
                color: 'orange',
              },
              {
                icon: <GitMerge className="h-5 w-5" />,
                title: 'Seat Flip Sankey',
                desc: 'How seats changed hands between parties',
                color: 'violet',
              },
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: 'Vote Share Wave',
                desc: 'Party trajectories across election cycles',
                color: 'blue',
              },
              {
                icon: <Target className="h-5 w-5" />,
                title: 'Contest Intensity',
                desc: 'Candidate density vs winning margins',
                color: 'indigo',
              },
              {
                icon: <Building2 className="h-5 w-5" />,
                title: 'District Dominance',
                desc: 'Geographic strongholds — seat-dot scorecards',
                color: 'teal',
              },
              {
                icon: <Trophy className="h-5 w-5" />,
                title: 'Runner-Up Analysis',
                desc: 'The eternal bridesmaid — near-miss constituencies',
                color: 'amber',
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: 'Mandate Meter',
                desc: 'Vote share vs previous election, party by party',
                color: 'emerald',
              },
              {
                icon: <Activity className="h-5 w-5" />,
                title: 'Nail-biters & Landslides',
                desc: 'Margin scatter across all 234 constituencies',
                color: 'rose',
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: 'Security Deposits',
                desc: 'Parties whose candidates forfeited deposits',
                color: 'red',
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
                  href="/tamil-nadu/election-analysis/2021"
                  className={`group p-4 rounded-xl border bg-white/[0.03] ${colorMap[m.color] ?? colorMap.red} hover:bg-white/[0.07] transition-all duration-200`}
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
            {[2021, 2016, 2011, 2006].map((y) => (
              <Link
                key={y}
                href={`/tamil-nadu/election-analysis/${y}`}
                className="px-3 py-1 rounded-full border border-white/10 text-white/50 hover:border-red-500/50 hover:text-red-400 text-xs font-semibold transition-colors"
              >
                {y}
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
                <p className="text-white/50 text-sm mb-4">Deep dive into 38 districts data</p>
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
              className="group"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'election_analysis_card',
                  link_location: 'features_section',
                })
              }}
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
              The platform currently covers all{' '}
              <strong className="text-foreground">234 assembly constituencies in Tamil Nadu</strong>
              , with detailed records spanning elections from 1967 to 2021. Each constituency page
              shows vote counts, winning margins, candidate lists, voter turnout, and demographic
              breakdowns — all sourced from official Election Commission of India data.
            </p>

            <div className="grid md:grid-cols-3 gap-6 not-prose my-8">
              <div className="border border-border rounded p-5">
                <div className="text-2xl font-bold text-red-600 mb-1">15+ Elections</div>
                <p className="text-sm text-muted-foreground">
                  Historical data from 1967 to 2021 across all 234 Tamil Nadu constituencies
                </p>
              </div>
              <div className="border border-border rounded p-5">
                <div className="text-2xl font-bold text-red-600 mb-1">50,000+ Booths</div>
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
              Tamil Nadu's political landscape is one of the most studied in India. Since 1967, the
              state has been governed exclusively by Dravidian parties — first the DMK under M.
              Karunanidhi, then the AIADMK under M. G. Ramachandran and J. Jayalalithaa, and back to
              the DMK under M. K. Stalin in 2021. IndiaStats.org lets you trace this 50-year story
              ward by ward, district by district, election by election.
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

      {/* Tamil Nadu Highlight */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="md:flex">
                {/* Left - Content */}
                <CardContent className="p-8 flex-1">
                  <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 rounded-full px-3 py-1 mb-4">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Now Available</span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Tamil Nadu Election Data</h2>

                  <p className="text-muted-foreground mb-6">
                    Complete election data covering 15+ election years, from 1967 to 2021.
                  </p>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-sm">
                      <Vote className="h-4 w-4 text-red-600" />
                      <span>234 Assembly Constituencies</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <MapPinned className="h-4 w-4 text-blue-600" />
                      <span>38 Districts Covered</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Locate className="h-4 w-4 text-green-600" />
                      <span>50,000+ Polling Booths</span>
                    </li>
                  </ul>

                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link
                      href="/tamil-nadu/dashboard"
                      onClick={() => {
                        const pageContext = getPageContext()
                        trackClicked({
                          name: 'button',
                          page_name: pageContext.page_name || 'Homepage',
                          button_name: 'start_exploring',
                          button_label: 'Start Exploring',
                        })
                      }}
                    >
                      Start Exploring
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>

                {/* Right - Visual */}
                <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-12 min-w-[280px]">
                  <div className="text-center">
                    <div className="text-7xl font-black">
                      <span className="text-[#FF9933]">T</span>
                      <span className="text-white">N</span>
                    </div>
                    <div className="text-white/50 text-sm mt-2">தமிழ்நாடு</div>
                    <div className="mt-4 text-white/30 text-xs">Since 1967</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* TVK 2026 Results Highlight Section */}
      <section className="bg-[#1a1a2e] py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 rounded-full px-3 py-1 mb-3">
                <Activity className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">2026 Results</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Tamil Nadu Has a New Chapter
              </h2>
              <p className="text-white/50 mt-1 text-sm">
                How the vote shifted — explore it constituency by constituency
              </p>
            </div>
            <Link
              href="/tamil-nadu/election-results"
              className="hidden md:flex items-center gap-1 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
              onClick={() => {
                const pageContext = getPageContext()
                trackClicked({
                  name: 'link',
                  page_name: pageContext.page_name || 'Homepage',
                  link_name: 'view_all_results',
                  link_location: 'tvk_section',
                })
              }}
            >
              Full results <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Seat shift cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { party: 'TVK', seats: 108, prev: 0, color: '#F5C518', note: 'Debut election' },
              { party: 'DMK', seats: 59, prev: 133, color: '#E7191E', note: 'Outgoing govt' },
              { party: 'AIADMK', seats: 47, prev: 68, color: '#10663D', note: '' },
              { party: 'INC', seats: 5, prev: 18, color: '#00bcd4', note: '' },
            ].map((p) => (
              <div
                key={p.party}
                className="rounded-xl bg-white/5 border border-white/10 p-5 text-center"
              >
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: p.color }}
                >
                  {p.party}
                </div>
                <div className="text-4xl font-black text-white mb-1">{p.seats}</div>
                <div className="text-xs text-white/40">
                  {p.prev === 0 ? (
                    <span className="text-yellow-400 font-semibold">New entrant</span>
                  ) : (
                    <span
                      className={
                        p.seats > p.prev
                          ? 'text-green-400 font-semibold'
                          : 'text-red-400 font-semibold'
                      }
                    >
                      {p.seats > p.prev ? '▲' : '▼'} {Math.abs(p.seats - p.prev)} from 2021
                    </span>
                  )}
                </div>
                {p.note && <div className="text-[10px] text-white/30 mt-1">{p.note}</div>}
              </div>
            ))}
          </div>

          {/* Vote Transfer CTA */}
          <div className="rounded-xl bg-white/5 border border-yellow-500/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                See how votes flowed in your constituency
              </h3>
              <p className="text-white/50 text-sm">
                Every assembly page now has an alluvial flow chart comparing 2021 &amp; 2026 —
                ribbons show which parties held on, and where the new surge came from.
              </p>
            </div>
            <Button
              asChild
              className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
            >
              <Link
                href="/tamil-nadu/dashboard"
                onClick={() => {
                  const pageContext = getPageContext()
                  trackClicked({
                    name: 'button',
                    page_name: pageContext.page_name || 'Homepage',
                    button_name: 'explore_vote_transfer',
                    button_label: 'Explore Vote Transfer',
                  })
                }}
              >
                Pick a constituency <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-3">Coming Soon</h2>
          <p className="text-muted-foreground mb-8">More states in development</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Kerala', flag: '🌴' },
              { name: 'Karnataka', flag: '🏛️' },
              { name: 'Andhra Pradesh', flag: '🌾' },
              { name: 'Telangana', flag: '🏛️' },
            ].map((state) => (
              <div
                key={state.name}
                className="px-6 py-3 rounded-xl bg-muted text-muted-foreground font-medium border-2 border-dashed flex items-center gap-2"
              >
                <span>{state.flag}</span>
                <span>{state.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
