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
  Search,
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

      // Easing function for smooth animation
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
    return (num / 100000).toFixed(2) + ' L'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString('en-IN')
}

function AnimatedStat({
  value,
  label,
  icon,
}: {
  value: number
  label: string
  icon: React.ReactNode
}) {
  const animatedValue = useAnimatedCounter(value, 2500)

  return (
    <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 group">
      <div className="flex justify-center mb-3 text-white/80 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {formatNumber(animatedValue)}
      </div>
      <div className="text-sm text-white/70 uppercase tracking-wider">{label}</div>
    </div>
  )
}

const features = [
  {
    icon: <Map className="h-8 w-8" />,
    title: 'Interactive Assembly Map',
    description: 'Explore constituencies with color-coded election results and detailed popups',
    href: '/tamil-nadu/assembly-map',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <MapPinned className="h-8 w-8" />,
    title: 'District Explorer',
    description: 'Deep dive into district-level data, assemblies, and voting patterns',
    href: '/tamil-nadu/dashboard',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Election History',
    description: 'Track party performance and winning trends from 1967 to 2021',
    href: '/tamil-nadu/dashboard',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Caste Demographics',
    description: 'Constituency-wise caste population data and insights',
    href: '/tamil-nadu/caste-demographics',
    gradient: 'from-green-500 to-emerald-500',
  },
]

export function HomePageClient({ stats }: HomePageClientProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Saffron accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-green-600" />

        <div className="container relative py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/80">Tamil Nadu Election Data • Updated 2024</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              India's Most Comprehensive
              <span className="block mt-2 bg-gradient-to-r from-orange-400 via-white to-green-400 text-transparent bg-clip-text">
                Election Data Platform
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Explore detailed election history, constituency demographics, and voting patterns
              across Tamil Nadu's 234 assembly constituencies.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 px-8 py-6 text-lg"
              >
                <Link href="/tamil-nadu/dashboard">
                  <Search className="mr-2 h-5 w-5" />
                  Explore Tamil Nadu
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg bg-transparent"
              >
                <Link href="/tamil-nadu/assembly-map">
                  <Map className="mr-2 h-5 w-5" />
                  View Assembly Map
                </Link>
              </Button>
            </div>
          </div>

          {/* Animated Stats */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatedStat
                value={stats.totalDistricts}
                label="Districts"
                icon={<Map className="h-6 w-6" />}
              />
              <AnimatedStat
                value={stats.totalAssemblies}
                label="Assemblies"
                icon={<MapPinned className="h-6 w-6" />}
              />
              <AnimatedStat
                value={stats.totalBooths}
                label="Booths"
                icon={<Locate className="h-6 w-6" />}
              />
              <AnimatedStat
                value={stats.totalVoters}
                label="Voters"
                icon={<UsersRound className="h-6 w-6" />}
              />
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Election Data</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and visualizations to understand Tamil Nadu's electoral landscape
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-red-600/50">
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-red-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                    <div className="flex items-center text-sm font-medium text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Explore <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* State Spotlight Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-2">
              <div className="md:flex">
                {/* Content */}
                <div className="p-8 md:p-12 flex-1">
                  <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 rounded-full px-3 py-1 mb-4">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Now Available</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Tamil Nadu</h2>
                  <p className="text-muted-foreground mb-6">
                    Complete election data from 1967 to 2021 covering all 234 assembly
                    constituencies, 38 districts, and over 50,000 polling booths. Includes
                    candidate-wise results, party performance analysis, and demographic insights.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Vote className="h-4 w-4 text-green-600" />
                      <span>15+ Election Years (1967-2021)</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>Caste Demographics by Constituency</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span>Party & Alliance Performance Trends</span>
                    </li>
                  </ul>
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link href="/tamil-nadu/dashboard">
                      Explore Tamil Nadu Data
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>

                {/* Visual */}
                <div className="hidden md:flex items-center justify-center p-8 bg-gradient-to-br from-orange-500/10 via-white/5 to-green-500/10 min-w-[280px]">
                  <div className="text-center">
                    <div className="text-8xl font-bold text-red-600/20">TN</div>
                    <div className="text-sm text-muted-foreground mt-2">தமிழ்நாடு</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16">
        <div className="container">
          <div className="text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Coming Soon
            </p>
            <h2 className="text-2xl font-bold mb-8">More States on the Way</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'].map((state) => (
                <div
                  key={state}
                  className="px-6 py-3 rounded-full bg-muted text-muted-foreground border-2 border-dashed"
                >
                  {state}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
