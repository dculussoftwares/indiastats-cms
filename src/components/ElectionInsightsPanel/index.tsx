'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, TrendingUp, TrendingDown, Minus, RefreshCcw } from 'lucide-react'
import { getPartyColor } from '@/lib/partyColors'

interface PartyChange {
  party: string
  year1Seats: number
  year2Seats: number
  change: number
}

interface FlippedSeat {
  assemblyId: string
  assemblyName: string
  fromParty: string
  toParty: string
  fromCandidate: string
  toCandidate: string
}

interface ElectionInsights {
  year1: number
  year2: number
  totalAssemblies1: number
  totalAssemblies2: number
  partyChanges: PartyChange[]
  flippedSeats: FlippedSeat[]
  totalFlipped: number
}

interface ElectionInsightsPanelProps {
  year1: number
  year2: number
  isVisible: boolean
}

export function ElectionInsightsPanel({ year1, year2, isVisible }: ElectionInsightsPanelProps) {
  const [insights, setInsights] = React.useState<ElectionInsights | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showAllFlipped, setShowAllFlipped] = React.useState(false)

  React.useEffect(() => {
    if (!isVisible || !year1 || !year2) {
      setInsights(null)
      return
    }

    const fetchInsights = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/election-insights?year1=${year1}&year2=${year2}`)
        if (response.ok) {
          const data = await response.json()
          setInsights(data)
        }
      } catch (error) {
        console.error('Failed to fetch election insights:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [year1, year2, isVisible])

  if (!isVisible || !year1 || !year2) return null

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  // Get top gainers and losers (top 5 each)
  const gainers = insights.partyChanges.filter((p) => p.change > 0).slice(0, 5)
  const losers = insights.partyChanges.filter((p) => p.change < 0).slice(0, 5)

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-primary" />
          Comparison: {year1} vs {year2}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seat Changes Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gainers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              Seats Gained
            </h4>
            {gainers.length > 0 ? (
              <div className="space-y-1">
                {gainers.map((p) => {
                  const color = getPartyColor(p.party)
                  return (
                    <div
                      key={p.party}
                      className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-950/30 p-2 rounded"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {p.party}
                      </span>
                      <span className="font-bold text-green-600">
                        +{p.change} ({p.year1Seats} → {p.year2Seats})
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No parties gained seats</p>
            )}
          </div>

          {/* Losers */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1 text-red-600">
              <TrendingDown className="h-4 w-4" />
              Seats Lost
            </h4>
            {losers.length > 0 ? (
              <div className="space-y-1">
                {losers.map((p) => {
                  const color = getPartyColor(p.party)
                  return (
                    <div
                      key={p.party}
                      className="flex items-center justify-between text-sm bg-red-50 dark:bg-red-950/30 p-2 rounded"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {p.party}
                      </span>
                      <span className="font-bold text-red-600">
                        {p.change} ({p.year1Seats} → {p.year2Seats})
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No parties lost seats</p>
            )}
          </div>
        </div>

        {/* Flipped Seats */}
        {insights.flippedSeats.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Minus className="h-4 w-4 rotate-90" />
              Constituencies Changed Hands ({insights.totalFlipped})
            </h4>
            <div
              className={`${showAllFlipped ? 'max-h-[400px]' : 'max-h-48'} overflow-y-auto space-y-1`}
            >
              {(showAllFlipped ? insights.flippedSeats : insights.flippedSeats.slice(0, 10)).map(
                (seat) => {
                  const fromColor = getPartyColor(seat.fromParty)
                  const toColor = getPartyColor(seat.toParty)
                  return (
                    <div
                      key={seat.assemblyId}
                      className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800/50 p-2 rounded"
                    >
                      <span className="font-medium truncate flex-1" title={seat.assemblyName}>
                        {seat.assemblyName}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span
                          className="px-1.5 py-0.5 rounded text-white text-[10px]"
                          style={{ backgroundColor: fromColor }}
                        >
                          {seat.fromParty}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span
                          className="px-1.5 py-0.5 rounded text-white text-[10px]"
                          style={{ backgroundColor: toColor }}
                        >
                          {seat.toParty}
                        </span>
                      </span>
                    </div>
                  )
                },
              )}
              {insights.flippedSeats.length > 10 && (
                <button
                  onClick={() => setShowAllFlipped(!showAllFlipped)}
                  className="w-full text-xs text-primary hover:text-primary/80 font-medium text-center py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
                >
                  {showAllFlipped
                    ? '← Show less'
                    : `+${insights.flippedSeats.length - 10} more constituencies →`}
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ElectionInsightsPanel
