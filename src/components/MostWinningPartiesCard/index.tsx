'use client'
import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Users } from 'lucide-react'
import {
  getLeaderImage as getLeaderImageFromConfig,
  getPartyColor,
  getBlocs,
  getStateByCode,
} from '@/config/states'

interface Candidate {
  name: string
  party: string
  votes: number
  rank: number
}

interface ElectionData {
  year: number
  assemblyId: string
  totalVoters: number
  noOfVotesPolled: number
  candidates: Candidate[]
}

interface PartyWins {
  party: string
  wins: number
  years: number[]
}

interface AllianceWins {
  allianceName: string
  wins: number
  parties: { party: string; wins: number }[]
  color: string
}

interface AllianceData {
  allianceName: string
  parties: { partyName: string }[]
  color: string
}

interface MostWinningPartiesCardProps {
  historicData: ElectionData[]
  stateCode?: string // Optional, defaults to 'TN'
  allianceData?: Record<number, AllianceData[]> // Optional pre-fetched data for SSG
}

// Function to get leader image using state config
const getLeaderImage = (stateCode: string, name: string, isAlliance?: boolean): string | null => {
  const config = getStateByCode(stateCode)
  if (!config) return null

  if (isAlliance && config.blocs) {
    // Find matching bloc for alliance
    for (const bloc of config.blocs) {
      if (name === bloc.name || bloc.parties.some((p) => p === name.replace(' Bloc', ''))) {
        return bloc.leaderImage || null
      }
    }
    // Fallback: Check for specific alliance patterns
    if (name.includes('AIADMK') || name.includes('NDA')) {
      return config.leaderImages['AIADMK'] || config.leaderImages['ADMK'] || null
    }
    if (name.includes('DMK') || name.includes('SPA') || name.includes('DPA')) {
      return config.leaderImages['DMK'] || null
    }
    return null
  }
  // For individual parties, use config
  return getLeaderImageFromConfig(stateCode, name)
}

// Determine bloc type based on parties/alliance name
// Priority: 1) Direct party name match (DMK/AIADMK only), 2) Alliance mapping from database
// No hardcoded party lists - strictly use alliance data
const getBlocType = (
  party: string,
  partyToAlliance?: Record<string, string>,
): 'dmk' | 'aiadmk' | 'other' => {
  // FIRST: Direct party check - only DMK and AIADMK variants
  if (party === 'DMK') return 'dmk'
  if (party === 'AIADMK' || party === 'ADMK' || party === 'AIADMK(J)' || party === 'AIADMK(JA)') {
    return 'aiadmk'
  }

  // SECOND: Check alliance mapping from database for other parties
  if (partyToAlliance && partyToAlliance[party]) {
    const alliance = partyToAlliance[party]

    // Check if alliance is DMK-led
    if (
      (alliance.includes('DMK') && !alliance.includes('AIADMK') && !alliance.includes('NDA')) ||
      alliance.includes('Secular Progressive') ||
      alliance.includes('DPA') ||
      alliance.includes('Democratic Progressive') ||
      alliance.includes('National Front')
    ) {
      return 'dmk'
    }

    // Check if alliance is AIADMK-led
    if (
      alliance.includes('AIADMK') ||
      alliance.includes('NDA') ||
      alliance.includes('SDPA') ||
      alliance.includes('Secular Democratic Progressive')
    ) {
      return 'aiadmk'
    }
  }

  // No hardcoded fallbacks - if not in alliance data, classify as 'other'
  return 'other'
}

export function MostWinningPartiesCard({
  historicData,
  stateCode = 'TN',
  allianceData: prefetchedAllianceData,
}: MostWinningPartiesCardProps) {
  const [viewMode, setViewMode] = React.useState<'party' | 'alliance'>('party')
  const [allianceData, setAllianceData] = React.useState<Record<number, AllianceData[]>>(
    prefetchedAllianceData || {},
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // Fetch all alliance data in a single call (grouped by year)
  React.useEffect(() => {
    if (viewMode !== 'alliance') return

    // Skip fetch if we have pre-fetched data
    if (prefetchedAllianceData && Object.keys(prefetchedAllianceData).length > 0) {
      setAllianceData(prefetchedAllianceData)
      return
    }

    const fetchAllianceData = async () => {
      setIsLoading(true)
      try {
        // Single API call to fetch ALL alliances
        const response = await fetch('/api/alliances')
        if (response.ok) {
          const data = await response.json()
          // Group alliances by year
          const groupedByYear: Record<number, AllianceData[]> = {}
          data.alliances?.forEach((alliance: AllianceData & { electionYear: number }) => {
            const year = alliance.electionYear
            if (!groupedByYear[year]) {
              groupedByYear[year] = []
            }
            groupedByYear[year].push({
              allianceName: alliance.allianceName,
              parties: alliance.parties,
              color: alliance.color,
            })
          })
          setAllianceData(groupedByYear)
        }
      } catch (error) {
        console.error('Failed to fetch alliances:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllianceData()
  }, [viewMode, prefetchedAllianceData])

  if (!historicData || historicData.length === 0) return null

  // Calculate most winning parties (individual)
  const calculateMostWinningParties = (): PartyWins[] => {
    const partyWins: Record<string, PartyWins> = {}

    // Only consider years >= 1977 (since ADMK formed)
    historicData
      .filter((d) => d.year >= 1977)
      .forEach((data) => {
        const winner = data.candidates.find((candidate) => candidate.rank === 1)
        if (winner) {
          if (!partyWins[winner.party]) {
            partyWins[winner.party] = {
              party: winner.party,
              wins: 0,
              years: [],
            }
          }
          partyWins[winner.party].wins++
          if (!partyWins[winner.party].years.includes(data.year)) {
            partyWins[winner.party].years.push(data.year)
          }
        }
      })

    return Object.values(partyWins)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 2)
  }

  // Calculate alliance bloc wins
  const calculateAllianceWins = (): AllianceWins[] => {
    // Define the two main blocs
    const dmkBloc: AllianceWins = {
      allianceName: 'DMK Bloc',
      wins: 0,
      parties: [],
      color: '#dc2626', // Red
    }

    const aiadmkBloc: AllianceWins = {
      allianceName: 'AIADMK Bloc',
      wins: 0,
      parties: [],
      color: '#059669', // Green
    }

    const partyWinsMap: Record<string, Record<string, number>> = {
      dmk: {},
      aiadmk: {},
    }

    // Only consider years >= 1977
    historicData
      .filter((d) => d.year >= 1977)
      .forEach((data) => {
        const winner = data.candidates.find((candidate) => candidate.rank === 1)
        if (!winner) return

        const party = winner.party
        const year = data.year

        // Get alliance mapping for this year
        const yearAlliances = allianceData[year] || []

        // Find which alliance this party belongs to
        const partyToAlliance: Record<string, string> = {}
        yearAlliances.forEach((alliance) => {
          alliance.parties?.forEach((p) => {
            partyToAlliance[p.partyName] = alliance.allianceName
          })
        })

        const blocType = getBlocType(party, partyToAlliance)

        if (blocType === 'dmk') {
          dmkBloc.wins++
          partyWinsMap.dmk[party] = (partyWinsMap.dmk[party] || 0) + 1
        } else if (blocType === 'aiadmk') {
          aiadmkBloc.wins++
          partyWinsMap.aiadmk[party] = (partyWinsMap.aiadmk[party] || 0) + 1
        }
      })

    // Convert party wins to array
    dmkBloc.parties = Object.entries(partyWinsMap.dmk)
      .map(([party, wins]) => ({ party, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5)

    aiadmkBloc.parties = Object.entries(partyWinsMap.aiadmk)
      .map(([party, wins]) => ({ party, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5)

    // Return in order of wins
    return [dmkBloc, aiadmkBloc].sort((a, b) => b.wins - a.wins)
  }

  const topParties = calculateMostWinningParties()
  const allianceBlocs = viewMode === 'alliance' ? calculateAllianceWins() : []

  if (topParties.length < 2 && viewMode === 'party') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Insufficient historical data</p>
        </CardContent>
      </Card>
    )
  }

  // Party View
  const renderPartyView = () => {
    const leader1 = getLeaderImage(stateCode, topParties[0].party)
    const leader2 = getLeaderImage(stateCode, topParties[1].party)
    const winDifference = topParties[0].wins - topParties[1].wins

    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        {/* Party 1 (Winner) */}
        <div className="flex-1 w-full md:w-auto">
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-5 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-red-600 mx-auto">
                {leader1 ? (
                  <Image
                    src={leader1}
                    alt={`${topParties[0].party} leader`}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <span className="text-4xl font-bold text-red-600">
                      {topParties[0].party.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 bg-red-600 rounded-full p-1.5 border-2 border-white dark:border-gray-900">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Image
                src={`/images/${topParties[0].party}.png`}
                alt={`${topParties[0].party} logo`}
                width={28}
                height={22}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-xl font-bold">{topParties[0].party}</span>
            </div>

            <p className="text-5xl md:text-6xl font-bold text-red-600 mb-1">{topParties[0].wins}</p>
            <p className="text-sm text-muted-foreground">Wins</p>
          </div>
        </div>

        {/* VS Badge */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
              <span className="text-xl font-black text-white tracking-wide">VS</span>
            </div>
            {winDifference > 0 && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                +{winDifference}
              </div>
            )}
          </div>
        </div>

        {/* Party 2 (Runner-up) */}
        <div className="flex-1 w-full md:w-auto">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600 mx-auto">
                {leader2 ? (
                  <Image
                    src={leader2}
                    alt={`${topParties[1].party} leader`}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-400">
                      {topParties[1].party.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Image
                src={`/images/${topParties[1].party}.png`}
                alt={`${topParties[1].party} logo`}
                width={28}
                height={22}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {topParties[1].party}
              </span>
            </div>

            <p className="text-5xl md:text-6xl font-bold text-gray-400 mb-1">
              {topParties[1].wins}
            </p>
            <p className="text-sm text-muted-foreground">Wins</p>
          </div>
        </div>
      </div>
    )
  }

  // Alliance Bloc View
  const renderAllianceView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )
    }

    if (allianceBlocs.length < 2) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">Loading alliance data...</p>
      )
    }

    const leader1 = getLeaderImage(stateCode, allianceBlocs[0].allianceName, true)
    const leader2 = getLeaderImage(stateCode, allianceBlocs[1].allianceName, true)
    const winDifference = allianceBlocs[0].wins - allianceBlocs[1].wins

    const winnerColor = allianceBlocs[0].color
    const loserColor = allianceBlocs[1].color

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {/* Alliance 1 (Winner) */}
          <div className="flex-1 w-full md:w-auto">
            <div
              className="rounded-lg p-5 text-center"
              style={{ backgroundColor: `${winnerColor}10` }}
            >
              <div className="relative inline-block mb-3">
                <div
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 mx-auto"
                  style={{ borderColor: winnerColor }}
                >
                  {leader1 ? (
                    <Image
                      src={leader1}
                      alt={`${allianceBlocs[0].allianceName} leader`}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${winnerColor}20` }}
                    >
                      <Users className="h-12 w-12" style={{ color: winnerColor }} />
                    </div>
                  )}
                </div>
                <div
                  className="absolute -bottom-1 right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 rounded-full p-1.5 border-2 border-white dark:border-gray-900"
                  style={{ backgroundColor: winnerColor }}
                >
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              </div>

              <p className="text-lg font-bold mb-1">{allianceBlocs[0].allianceName}</p>
              <p className="text-5xl md:text-6xl font-bold mb-1" style={{ color: winnerColor }}>
                {allianceBlocs[0].wins}
              </p>
              <p className="text-sm text-muted-foreground mb-3">Total Wins</p>

              {/* Party breakdown */}
              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-muted-foreground mb-2">Top contributing parties:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {allianceBlocs[0].parties.slice(0, 3).map((p) => (
                    <span
                      key={p.party}
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: winnerColor }}
                    >
                      {p.party}: {p.wins}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-white tracking-wide">VS</span>
              </div>
              {winDifference > 0 && (
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow"
                  style={{ backgroundColor: winnerColor }}
                >
                  +{winDifference}
                </div>
              )}
            </div>
          </div>

          {/* Alliance 2 (Runner-up) */}
          <div className="flex-1 w-full md:w-auto">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 text-center">
              <div className="relative inline-block mb-3">
                <div
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 mx-auto"
                  style={{ borderColor: loserColor }}
                >
                  {leader2 ? (
                    <Image
                      src={leader2}
                      alt={`${allianceBlocs[1].allianceName} leader`}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <p className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-1">
                {allianceBlocs[1].allianceName}
              </p>
              <p className="text-5xl md:text-6xl font-bold text-gray-400 mb-1">
                {allianceBlocs[1].wins}
              </p>
              <p className="text-sm text-muted-foreground mb-3">Total Wins</p>

              {/* Party breakdown */}
              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-muted-foreground mb-2">Top contributing parties:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {allianceBlocs[1].parties.slice(0, 3).map((p) => (
                    <span
                      key={p.party}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700"
                    >
                      {p.party}: {p.wins}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        {/* Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode('party')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'party'
                  ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By Party
            </button>
            <button
              onClick={() => setViewMode('alliance')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'alliance'
                  ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By Alliance Bloc
            </button>
          </div>
        </div>

        {viewMode === 'party' ? renderPartyView() : renderAllianceView()}
      </CardContent>
    </Card>
  )
}

export default MostWinningPartiesCard
