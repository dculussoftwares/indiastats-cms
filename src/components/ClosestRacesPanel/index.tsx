'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Trophy, Medal } from 'lucide-react'
import { getPartyColor } from '@/lib/partyColors'

interface ClosestRace {
  assemblyId: string
  assemblyName: string
  winner: { name: string; party: string; votes: number }
  runnerUp: { name: string; party: string; votes: number }
  margin: number
}

interface ClosestRacesPanelProps {
  closestRaces: ClosestRace[]
  topTwoParties: string[]
  year: number
  isVisible: boolean
}

function formatVotes(num: number): string {
  if (num >= 100000) {
    return (num / 100000).toFixed(2) + 'L'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function ClosestRacesPanel({
  closestRaces,
  topTwoParties,
  year,
  isVisible,
}: ClosestRacesPanelProps) {
  const [showAll, setShowAll] = React.useState(false)

  if (!isVisible || !closestRaces || closestRaces.length === 0) return null

  const displayedRaces = showAll ? closestRaces : closestRaces.slice(0, 10)

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          Closest Races ({year})
          <span className="text-sm font-normal text-muted-foreground">
            Top 2 parties: {topTwoParties.join(' vs ')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${showAll ? 'max-h-[500px]' : 'max-h-64'} overflow-y-auto space-y-2`}>
          {displayedRaces.map((race, index) => {
            const winnerColor = getPartyColor(race.winner.party)
            const runnerUpColor = getPartyColor(race.runnerUp.party)

            return (
              <div
                key={race.assemblyId}
                className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Rank */}
                <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">
                  #{index + 1}
                </span>

                {/* Assembly Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" title={race.assemblyName}>
                    {race.assemblyName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      <span
                        className="px-1 py-0.5 rounded text-white text-[10px]"
                        style={{ backgroundColor: winnerColor }}
                      >
                        {race.winner.party}
                      </span>
                      <span className="truncate max-w-[80px]" title={race.winner.name}>
                        {race.winner.name}
                      </span>
                    </span>
                    <span className="text-gray-400">vs</span>
                    <span className="flex items-center gap-1">
                      <Medal className="h-3 w-3 text-gray-400" />
                      <span
                        className="px-1 py-0.5 rounded text-white text-[10px]"
                        style={{ backgroundColor: runnerUpColor }}
                      >
                        {race.runnerUp.party}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Margin */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {formatVotes(race.margin)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">margin</p>
                </div>
              </div>
            )
          })}
        </div>

        {closestRaces.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-primary hover:text-primary/80 font-medium text-center py-2 mt-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          >
            {showAll ? '← Show less' : `+${closestRaces.length - 10} more races →`}
          </button>
        )}
      </CardContent>
    </Card>
  )
}

export default ClosestRacesPanel
