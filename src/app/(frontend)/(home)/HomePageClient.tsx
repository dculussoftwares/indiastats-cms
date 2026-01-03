'use client'
import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
                  <Link href="/tamil-nadu/dashboard">
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
                  <Link href="/tamil-nadu/assembly-map">
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

      {/* Features Section - Dark theme matching hero */}
      <section className="bg-[#1a1a2e] py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">What You Can Explore</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Powerful tools to analyze election data across Tamil Nadu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
            {/* Interactive Map */}
            <Link href="/tamil-nadu/assembly-map" className="group">
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

            {/* Election Data Table - NEW */}
            <Link href="/election-data" className="group">
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
                    <Link href="/tamil-nadu/dashboard">
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
