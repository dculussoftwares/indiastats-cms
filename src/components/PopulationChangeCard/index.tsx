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
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="h-5 w-5 text-muted-foreground">{icon}</div>
        </div>

        {/* Difference */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold">
            {isPositive ? '+' : ''}
            {formatNumber(difference)}
          </span>
          <Badge
            variant={isPositive ? 'default' : 'destructive'}
            className={isPositive ? 'bg-green-600' : ''}
          >
            {isPositive ? '+' : ''}
            {percentChange}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {difference.toLocaleString()} {title.toLowerCase()}
        </p>

        {/* 2025 vs 2019 comparison */}
        <div className="flex items-stretch gap-4">
          {/* 2025 */}
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">2025</p>
            <p className="text-xl font-bold">{formatNumber(currentCount)}</p>
            <p className="text-xs text-muted-foreground">{currentCount.toLocaleString()}</p>
          </div>

          {/* Divider */}
          <div className="w-px bg-border" />

          {/* 2019 */}
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">2019</p>
            <p className="text-xl font-bold">{formatNumber(previousCount)}</p>
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
