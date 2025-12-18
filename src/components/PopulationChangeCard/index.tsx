'use client'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, UserCircle2, Users, UsersRound } from 'lucide-react'

interface PopulationChangeItemProps {
  title: string
  currentCount: number
  previousCount: number
  icon: React.ReactNode
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

const PopulationChangeItem: React.FC<PopulationChangeItemProps> = ({
  title,
  currentCount,
  previousCount,
  icon,
}) => {
  const difference = currentCount - previousCount
  const percentChange =
    previousCount !== 0 ? ((difference / Math.abs(previousCount)) * 100).toFixed(2) : '0.00'
  const isPositive = difference >= 0

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-5 w-5 text-gray-500">{icon}</div>
          <h3 className="text-xs font-bold uppercase tracking-wide">{title}</h3>
        </div>

        {/* Difference Display */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold">
            {isPositive ? '+' : ''}
            {formatNumber(difference)}
          </span>
          <Badge
            variant={isPositive ? 'default' : 'destructive'}
            className={`${isPositive ? 'bg-red-600 border-0' : ''} px-2 py-0.5 text-xs`}
          >
            {isPositive ? '+' : ''}
            {percentChange}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {difference.toLocaleString()} {title.toLowerCase()} voters
        </p>

        {/* 2025 vs 2019 comparison */}
        <div className="flex items-stretch gap-4 pt-3 border-t">
          {/* 2025 */}
          <div className="flex-1">
            <p className="text-xs font-bold text-red-600 mb-1">2025</p>
            <p className="text-lg font-bold">{formatNumber(currentCount)}</p>
            <p className="text-xs text-muted-foreground">{currentCount.toLocaleString()}</p>
          </div>

          {/* Divider */}
          <div className="w-px bg-border" />

          {/* 2019 */}
          <div className="flex-1">
            <p className="text-xs font-bold text-muted-foreground mb-1">2019</p>
            <p className="text-lg font-bold text-muted-foreground">{formatNumber(previousCount)}</p>
            <p className="text-xs text-muted-foreground">{previousCount.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PopulationChangeCardProps {
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
}

export const PopulationChangeCard: React.FC<PopulationChangeCardProps> = ({
  voters,
  lastElectionVoters,
}) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PopulationChangeItem
        title="Male"
        currentCount={voters.male}
        previousCount={lastElectionVoters.male}
        icon={<User className="h-5 w-5" />}
      />
      <PopulationChangeItem
        title="Female"
        currentCount={voters.female}
        previousCount={lastElectionVoters.female}
        icon={<UserCircle2 className="h-5 w-5" />}
      />
      <PopulationChangeItem
        title="Transgender"
        currentCount={voters.trans}
        previousCount={lastElectionVoters.trans}
        icon={<Users className="h-5 w-5" />}
      />
      <PopulationChangeItem
        title="Total"
        currentCount={voters.total}
        previousCount={lastElectionVoters.total}
        icon={<UsersRound className="h-5 w-5" />}
      />
    </div>
  )
}

export default PopulationChangeCard
