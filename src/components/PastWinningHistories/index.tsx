'use client'
import * as React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Target, Flame, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utilities/ui'

interface Candidate {
  name: string
  party: string
  votes: number
}

interface ElectionYear {
  year: number
  winner: string
  winnerParty: string
  winnerVotes: number
  totalVoters: number
  votesPolled: number
  candidates: Candidate[]
}

interface PastWinningHistoriesProps {
  electionHistory: ElectionYear[]
}

// Party color mapping
const PARTY_COLORS: Record<string, string> = {
  DMK: '#d32f2f',
  ADMK: '#1976d2',
  AIADMK: '#1976d2',
  INC: '#00bcd4',
  BJP: '#ff9800',
  PMK: '#fbc02d',
  DMDK: '#7b1fa2',
  VCK: '#c2185b',
  CPI: '#f44336',
  CPM: '#e91e63',
  CPIM: '#e91e63',
  NTK: '#4caf50',
  MNM: '#009688',
  IND: '#9e9e9e',
}

const getPartyColor = (party: string): string => {
  return PARTY_COLORS[party] || '#607d8b'
}

function formatNumber(num: number): string {
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Calculate quick stats
function calculateStats(electionHistory: ElectionYear[]) {
  const sorted = [...electionHistory].sort((a, b) => a.year - b.year)

  // Find longest streak
  let maxStreak = { party: '', count: 0, startYear: 0, endYear: 0 }
  let currentStreak = { party: '', count: 0, startYear: 0 }

  sorted.forEach((election, idx) => {
    if (election.winnerParty === currentStreak.party) {
      currentStreak.count++
    } else {
      if (currentStreak.count > maxStreak.count) {
        maxStreak = { ...currentStreak, endYear: sorted[idx - 1]?.year || currentStreak.startYear }
      }
      currentStreak = { party: election.winnerParty, count: 1, startYear: election.year }
    }
  })
  if (currentStreak.count > maxStreak.count) {
    maxStreak = { ...currentStreak, endYear: sorted[sorted.length - 1].year }
  }

  // Find closest race
  let closestRace = { year: 0, margin: Infinity, winner: '', runnerUp: '' }
  sorted.forEach((election) => {
    if (election.candidates.length >= 2) {
      const margin = election.winnerVotes - election.candidates[1].votes
      if (margin < closestRace.margin && margin > 0) {
        closestRace = {
          year: election.year,
          margin,
          winner: election.winnerParty,
          runnerUp: election.candidates[1].party,
        }
      }
    }
  })

  // Find biggest landslide
  let landslide = { year: 0, margin: 0, party: '' }
  sorted.forEach((election) => {
    if (election.candidates.length >= 2) {
      const margin = election.winnerVotes - election.candidates[1].votes
      if (margin > landslide.margin) {
        landslide = { year: election.year, margin, party: election.winnerParty }
      }
    }
  })

  return { longestStreak: maxStreak, closestRace, landslide, totalElections: sorted.length }
}

export function PastWinningHistories({ electionHistory }: PastWinningHistoriesProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  if (!electionHistory || electionHistory.length === 0) return null

  const sortedHistory = [...electionHistory].sort((a, b) => b.year - a.year)
  const stats = calculateStats(electionHistory)

  const toggleExpanded = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year)
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Flame className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longest Streak</p>
                <p className="font-bold text-lg">{stats.longestStreak.party}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.longestStreak.count} wins ({stats.longestStreak.startYear}-
                  {stats.longestStreak.endYear})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Closest Race</p>
                <p className="font-bold text-lg">{stats.closestRace.year}</p>
                <p className="text-xs text-muted-foreground">
                  Margin: {formatNumber(stats.closestRace.margin)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Biggest Landslide</p>
                <p className="font-bold text-lg">{stats.landslide.party}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.landslide.year} (+{formatNumber(stats.landslide.margin)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Elections</p>
                <p className="font-bold text-lg">{stats.totalElections}</p>
                <p className="text-xs text-muted-foreground">
                  Since {sortedHistory[sortedHistory.length - 1]?.year}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Election Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Horizontal scrollable timeline */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-2 min-w-max">
              {sortedHistory.map((election) => {
                const partyColor = getPartyColor(election.winnerParty)
                const isExpanded = expandedYear === election.year
                const margin =
                  election.candidates.length >= 2
                    ? election.winnerVotes - election.candidates[1].votes
                    : 0
                // Fallback: calculate votesPolled from candidate votes if missing
                const calculatedVotesPolled = election.candidates.reduce(
                  (sum, c) => sum + c.votes,
                  0,
                )
                const effectiveVotesPolled =
                  election.votesPolled > 0 ? election.votesPolled : calculatedVotesPolled
                const marginPercent =
                  effectiveVotesPolled > 0
                    ? ((margin / effectiveVotesPolled) * 100).toFixed(1)
                    : '0'

                return (
                  <div
                    key={election.year}
                    className={cn(
                      'flex flex-col items-center cursor-pointer transition-all duration-200',
                      'hover:scale-105 group',
                      isExpanded && 'scale-105',
                    )}
                    onClick={() => toggleExpanded(election.year)}
                  >
                    {/* Year pill with party color */}
                    <div
                      className="px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg transition-all"
                      style={{ backgroundColor: partyColor }}
                    >
                      {election.year}
                    </div>

                    {/* Connecting line */}
                    <div
                      className="w-1 h-4 transition-all"
                      style={{ backgroundColor: partyColor }}
                    />

                    {/* Party logo */}
                    <div
                      className="w-12 h-12 rounded-lg bg-card border-2 shadow-md flex items-center justify-center overflow-hidden transition-all group-hover:shadow-lg"
                      style={{ borderColor: partyColor }}
                    >
                      <Image
                        src={`/images/${election.winnerParty}.png`}
                        alt={election.winnerParty}
                        width={36}
                        height={36}
                        className="object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = `<span class="font-bold text-sm">${election.winnerParty}</span>`
                        }}
                      />
                    </div>

                    {/* Margin indicator */}
                    <Badge
                      variant="secondary"
                      className="mt-2 text-xs"
                      style={{
                        backgroundColor: `${partyColor}20`,
                        color: partyColor,
                        borderColor: partyColor,
                      }}
                    >
                      +{marginPercent}%
                    </Badge>

                    {/* Expand indicator */}
                    <div className="mt-1 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Expanded Details */}
          {expandedYear && (
            <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-200">
              {sortedHistory
                .filter((e) => e.year === expandedYear)
                .map((election) => {
                  const partyColor = getPartyColor(election.winnerParty)

                  return (
                    <div key={election.year} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Year and Stats */}
                      <div className="flex flex-col items-center justify-center space-y-2 md:border-r">
                        <p className="text-4xl font-bold" style={{ color: partyColor }}>
                          {election.year}
                        </p>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(election.votesPolled)} votes polled
                          </p>
                          {election.totalVoters > 0 && (
                            <p className="text-xs text-muted-foreground">
                              of {formatNumber(election.totalVoters)} total voters
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Winner */}
                      <div className="flex flex-col items-center space-y-3 md:border-r">
                        <Badge className="bg-green-600">Winner</Badge>
                        <div
                          className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-lg"
                          style={{ borderColor: partyColor }}
                        >
                          <Image
                            src={`/images/${election.winnerParty}.png`}
                            alt={election.winnerParty}
                            width={64}
                            height={64}
                            className="object-contain w-full h-full p-2 bg-white"
                          />
                        </div>
                        <Badge variant="outline">{election.winnerParty}</Badge>
                        <p className="font-medium text-center text-sm">{election.winner}</p>
                        <p className="text-lg font-bold" style={{ color: partyColor }}>
                          {formatNumber(election.winnerVotes)} votes
                        </p>
                      </div>

                      {/* Runner-ups */}
                      <div className="space-y-4">
                        {election.candidates.slice(1, 3).map((candidate, idx) => {
                          const voteDiff = election.winnerVotes - candidate.votes
                          const runnerColor = getPartyColor(candidate.party)

                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                            >
                              <Badge variant="secondary">{idx === 0 ? '2nd' : '3rd'}</Badge>
                              <div
                                className="w-10 h-10 rounded-lg overflow-hidden border-2"
                                style={{ borderColor: runnerColor }}
                              >
                                <Image
                                  src={`/images/${candidate.party}.png`}
                                  alt={candidate.party}
                                  width={40}
                                  height={40}
                                  className="object-contain w-full h-full p-1 bg-white"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.party}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">
                                  {formatNumber(candidate.votes)}
                                </p>
                                <Badge variant="destructive" className="text-xs">
                                  -{formatNumber(voteDiff)}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PastWinningHistories
