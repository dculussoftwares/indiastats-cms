'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, MapPin, Users, User, UserCircle2, Shield, ShieldCheck } from 'lucide-react'

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
    </div>
  )
}

export default MapStatsDashboard
