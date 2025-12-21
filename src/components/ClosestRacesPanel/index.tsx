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

interface AllianceSeat {
  allianceName: string
  seats: number
  parties: string[]
  color?: string
}

interface ClosestRacesPanelProps {
  closestRaces: ClosestRace[]
  topTwoParties: string[]
  year: number
  isVisible: boolean
  partyToAlliance?: Record<string, string>
  allianceSeats?: AllianceSeat[]
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
  partyToAlliance = {},
  allianceSeats = [],
}: ClosestRacesPanelProps) {
  const [showAll, setShowAll] = React.useState(false)
  const [allianceFilter, setAllianceFilter] = React.useState<string>('All')
  const [winLossFilter, setWinLossFilter] = React.useState<'All' | 'Wins' | 'Losses'>('All')

  // Helper to get alliance for a party
  const getAlliance = React.useCallback(
    (party: string) => partyToAlliance[party] || 'Others',
    [partyToAlliance],
  )

  // Helper to get alliance color
  const getAllianceColor = React.useCallback(
    (allianceName: string) => {
      const alliance = allianceSeats.find((a) => a.allianceName === allianceName)
      return alliance?.color || '#6b7280'
    },
    [allianceSeats],
  )

  // Get unique alliances for filter buttons
  const alliances = React.useMemo(() => {
    const uniqueAlliances: AllianceSeat[] = []
    allianceSeats.forEach((a) => {
      if (!uniqueAlliances.find((u) => u.allianceName === a.allianceName)) {
        uniqueAlliances.push(a)
      }
    })
    return uniqueAlliances.slice(0, 4) // Top 4 alliances
  }, [allianceSeats])

  // Filter races based on alliance and win/loss filters
  const filteredRaces = React.useMemo(() => {
    if (!closestRaces) return []
    return closestRaces.filter((race) => {
      const winnerAlliance = getAlliance(race.winner.party)
      const runnerUpAlliance = getAlliance(race.runnerUp.party)

      // Alliance filter
      if (allianceFilter !== 'All') {
        const matchesAlliance =
          winnerAlliance === allianceFilter || runnerUpAlliance === allianceFilter
        if (!matchesAlliance) return false

        // Win/Loss filter (only applies when alliance is selected)
        if (winLossFilter === 'Wins') {
          return winnerAlliance === allianceFilter
        } else if (winLossFilter === 'Losses') {
          return runnerUpAlliance === allianceFilter
        }
      }

      return true
    })
  }, [closestRaces, allianceFilter, winLossFilter, getAlliance])

  // Early return AFTER all hooks
  if (!isVisible || !closestRaces || closestRaces.length === 0) return null

  const displayedRaces = showAll ? filteredRaces : filteredRaces.slice(0, 10)

  // Get short alliance name for display
  const getShortAllianceName = (name: string) => {
    const match = name.match(/\(([^)]+)\)/)
    return match ? match[1] : name.slice(0, 12)
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          Closest Races ({year})
          <span className="text-sm font-normal text-muted-foreground">
            Top 2: {topTwoParties.join(' vs ')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filter Controls */}
        {alliances.length > 0 && (
          <div className="space-y-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            {/* Alliance Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Alliance:</span>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => {
                    setAllianceFilter('All')
                    setWinLossFilter('All')
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    allianceFilter === 'All'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {alliances.map((alliance) => {
                  const isSelected = allianceFilter === alliance.allianceName
                  return (
                    <button
                      key={alliance.allianceName}
                      onClick={() => setAllianceFilter(alliance.allianceName)}
                      className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                        isSelected ? 'ring-2 ring-offset-1' : 'hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isSelected ? alliance.color : `${alliance.color}30`,
                        color: isSelected ? 'white' : alliance.color,
                      }}
                    >
                      {getShortAllianceName(alliance.allianceName)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Win/Loss Filter - only show when alliance is selected */}
            {allianceFilter !== 'All' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Show:</span>
                <div className="flex gap-1">
                  {(['All', 'Wins', 'Losses'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setWinLossFilter(type)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        winLossFilter === type
                          ? type === 'Wins'
                            ? 'bg-green-600 text-white'
                            : type === 'Losses'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type === 'Wins'
                        ? 'Closest Wins'
                        : type === 'Losses'
                          ? 'Closest Losses'
                          : 'All'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        {allianceFilter !== 'All' && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredRaces.length} races
            {winLossFilter !== 'All' &&
              ` (${winLossFilter === 'Wins' ? 'won' : 'lost'} by ${getShortAllianceName(allianceFilter)})`}
          </p>
        )}

        {/* Race List */}
        <div className={`${showAll ? 'max-h-[500px]' : 'max-h-64'} overflow-y-auto space-y-2`}>
          {displayedRaces.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No races match the selected filters
            </p>
          ) : (
            displayedRaces.map((race, index) => {
              const winnerColor = getPartyColor(race.winner.party)
              const runnerUpColor = getPartyColor(race.runnerUp.party)
              const winnerAlliance = getAlliance(race.winner.party)
              const runnerUpAlliance = getAlliance(race.runnerUp.party)
              const winnerAllianceColor = getAllianceColor(winnerAlliance)
              const runnerUpAllianceColor = getAllianceColor(runnerUpAlliance)

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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-yellow-500" />
                        {/* Alliance badge */}
                        {allianceSeats.length > 0 && (
                          <span
                            className="px-1 py-0.5 rounded text-white text-[9px] font-medium"
                            style={{ backgroundColor: winnerAllianceColor }}
                            title={winnerAlliance}
                          >
                            {getShortAllianceName(winnerAlliance)}
                          </span>
                        )}
                        <span
                          className="px-1 py-0.5 rounded text-white text-[10px]"
                          style={{ backgroundColor: winnerColor }}
                        >
                          {race.winner.party}
                        </span>
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span className="flex items-center gap-1">
                        <Medal className="h-3 w-3 text-gray-400" />
                        {/* Alliance badge */}
                        {allianceSeats.length > 0 && (
                          <span
                            className="px-1 py-0.5 rounded text-white text-[9px] font-medium"
                            style={{ backgroundColor: runnerUpAllianceColor }}
                            title={runnerUpAlliance}
                          >
                            {getShortAllianceName(runnerUpAlliance)}
                          </span>
                        )}
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
            })
          )}
        </div>

        {filteredRaces.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-primary hover:text-primary/80 font-medium text-center py-2 mt-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          >
            {showAll ? '← Show less' : `+${filteredRaces.length - 10} more races →`}
          </button>
        )}
      </CardContent>
    </Card>
  )
}

export default ClosestRacesPanel
