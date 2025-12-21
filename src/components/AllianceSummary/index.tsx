'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface AllianceSeat {
  allianceName: string
  seats: number
  parties: string[]
  color?: string // Color from database
}

interface AllianceSummaryProps {
  allianceSeats: AllianceSeat[]
  year: number
  totalSeats: number
  isVisible: boolean
}

export function AllianceSummary({
  allianceSeats,
  year,
  totalSeats,
  isVisible,
}: AllianceSummaryProps) {
  if (!isVisible || !allianceSeats || allianceSeats.length === 0) return null

  // Get top 2 alliances for the main display
  const topTwo = allianceSeats.slice(0, 2)
  const rest = allianceSeats.slice(2)

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Alliance Summary ({year})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Top 2 Alliances - Big Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {topTwo.map((alliance, index) => {
            const color = alliance.color || '#6b7280'
            const percentage = Math.round((alliance.seats / totalSeats) * 100)

            return (
              <div
                key={alliance.allianceName}
                className="relative overflow-hidden rounded-lg p-4"
                style={{
                  backgroundColor: `${color}15`,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {index === 0 ? '🏆 Winner' : '🥈 Runner-up'}
                    </p>
                    <p className="font-bold text-sm leading-tight mt-1" style={{ color }}>
                      {alliance.allianceName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alliance.parties.slice(0, 3).join(', ')}
                      {alliance.parties.length > 3 && ` +${alliance.parties.length - 3}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold" style={{ color }}>
                      {alliance.seats}
                    </p>
                    <p className="text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Other alliances - Compact */}
        {rest.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rest.map((alliance) => {
              const color = alliance.color || '#6b7280'
              return (
                <div
                  key={alliance.allianceName}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-medium">{alliance.allianceName}</span>
                  <span className="text-muted-foreground">({alliance.seats})</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AllianceSummary
