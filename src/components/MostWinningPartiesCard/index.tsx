'use client'
import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

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

interface MostWinningPartiesCardProps {
  historicData: ElectionData[]
}

// Function to get leader image
const getLeaderImage = (partyName: string): string | null => {
  if (partyName === 'ADMK' || partyName === 'AIADMK') return '/images/EPS.jpg'
  if (partyName === 'DMK') return '/images/Stalin.png'
  if (partyName === 'INC' || partyName === 'CONG') return '/images/karkae.jpg'
  if (partyName === 'BJP') return '/images/modi.png'
  return null
}

export function MostWinningPartiesCard({ historicData }: MostWinningPartiesCardProps) {
  if (!historicData || historicData.length === 0) return null

  // Calculate most winning parties
  const calculateMostWinningParties = (): PartyWins[] => {
    const partyWins: Record<string, PartyWins> = {}

    historicData.forEach((data) => {
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
        partyWins[winner.party].years.push(data.year)
      }
    })

    return Object.values(partyWins)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 2)
  }

  const topParties = calculateMostWinningParties()

  if (topParties.length < 2) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Insufficient historical data</p>
        </CardContent>
      </Card>
    )
  }

  const leader1 = getLeaderImage(topParties[0].party)
  const leader2 = getLeaderImage(topParties[1].party)
  const winDifference = topParties[0].wins - topParties[1].wins

  return (
    <Card>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {/* Party 1 (Winner) */}
          <div className="flex-1 w-full md:w-auto">
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-5 text-center">
              {/* Leader photo */}
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
                {/* Trophy badge */}
                <div className="absolute -bottom-1 right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 bg-red-600 rounded-full p-1.5 border-2 border-white dark:border-gray-900">
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Party logo and name */}
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

              {/* Win count */}
              <p className="text-5xl md:text-6xl font-bold text-red-600 mb-1">
                {topParties[0].wins}
              </p>
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
              {/* Leader photo */}
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

              {/* Party logo and name */}
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

              {/* Win count */}
              <p className="text-5xl md:text-6xl font-bold text-gray-400 mb-1">
                {topParties[1].wins}
              </p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MostWinningPartiesCard
