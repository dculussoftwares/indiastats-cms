'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin, Users, User, UserCircle2, Shield, ShieldCheck } from 'lucide-react'

interface QuickStat {
  name: string
  assemblyId: string
  voters?: number
  ratio?: number
  booths?: number
}

interface MapStats {
  totalAssemblies: number
  totalDistricts: number
  reservedSeats: number
  generalSeats: number
  voters: {
    male: number
    female: number
    trans: number
    total: number
  }
  quickStats?: {
    largestConstituency: QuickStat
    smallestConstituency: QuickStat | null
    highestFemaleRatio: QuickStat
    mostBooths: QuickStat
  }
}

interface MapStatsDashboardProps {
  stats: MapStats | null
  isLoading?: boolean
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
  return num.toLocaleString()
}

export function MapStatsDashboard({ stats, isLoading }: MapStatsDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-4 pb-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      label: 'Assemblies',
      value: stats.totalAssemblies,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Districts',
      value: stats.totalDistricts,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      label: 'Reserved',
      value: stats.reservedSeats,
      icon: ShieldCheck,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: 'General',
      value: stats.generalSeats,
      icon: Shield,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
    },
    {
      label: 'Male Voters',
      value: formatNumber(stats.voters.male),
      rawValue: stats.voters.male,
      icon: User,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      label: 'Female Voters',
      value: formatNumber(stats.voters.female),
      rawValue: stats.voters.female,
      icon: UserCircle2,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    },
  ]

  return (
    <div className="mb-6">
      {/* BBC-style section header */}
      <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">State Overview</h2>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {statItems.map((item) => (
          <Card key={item.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-xl font-bold" title={item.rawValue?.toLocaleString()}>
                    {item.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total voters summary */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          <strong className="text-foreground">{formatNumber(stats.voters.total)}</strong> total
          registered voters
          {stats.voters.trans > 0 && (
            <span className="ml-1">
              (including {stats.voters.trans.toLocaleString()} transgender voters)
            </span>
          )}
        </span>
      </div>

      {/* Quick Stats - Interesting facts */}
      {stats.quickStats && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Facts
          </h3>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Largest Constituency */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Largest Constituency
                </p>
                <p
                  className="font-bold text-sm truncate"
                  title={stats.quickStats.largestConstituency.name}
                >
                  {stats.quickStats.largestConstituency.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.quickStats.largestConstituency.voters || 0)} voters
                </p>
              </CardContent>
            </Card>

            {/* Smallest Constituency */}
            {stats.quickStats.smallestConstituency && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    Smallest Constituency
                  </p>
                  <p
                    className="font-bold text-sm truncate"
                    title={stats.quickStats.smallestConstituency.name}
                  >
                    {stats.quickStats.smallestConstituency.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(stats.quickStats.smallestConstituency.voters || 0)} voters
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Highest Female Voter Ratio */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-800">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-pink-700 dark:text-pink-400 font-medium">
                  Highest Female Ratio
                </p>
                <p
                  className="font-bold text-sm truncate"
                  title={stats.quickStats.highestFemaleRatio.name}
                >
                  {stats.quickStats.highestFemaleRatio.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.quickStats.highestFemaleRatio.ratio}% female voters
                </p>
              </CardContent>
            </Card>

            {/* Most Booths */}
            <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
                  Most Polling Booths
                </p>
                <p className="font-bold text-sm truncate" title={stats.quickStats.mostBooths.name}>
                  {stats.quickStats.mostBooths.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.quickStats.mostBooths.booths} booths
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapStatsDashboard
