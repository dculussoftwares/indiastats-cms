'use client'
import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <Card className="overflow-hidden">
      <CardContent className="pt-6 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-4">
          {/* Party 1 (Winner) - Enhanced with golden styling */}
          <div className="flex flex-col items-center space-y-3 flex-1 relative">
            {/* Winner photo with golden gradient ring */}
            <div className="relative">
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 shadow-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, #ffd700 0%, #ffb300 25%, #ffd700 50%, #ffb300 75%, #ffd700 100%)',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-background">
                  {leader1 ? (
                    <Image
                      src={leader1}
                      alt={`${topParties[0].party} leader`}
                      width={144}
                      height={144}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center">
                      <span className="text-5xl md:text-6xl font-bold text-yellow-600">
                        {topParties[0].party.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Trophy badge */}
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5 shadow-lg border-2 border-background">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Party logo */}
            <Image
              src={`/images/${topParties[0].party}.png`}
              alt={`${topParties[0].party} logo`}
              width={45}
              height={35}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />

            {/* Party name badge with champion styling */}
            <div className="flex flex-col items-center gap-1">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-sm px-3 py-1 shadow">
                {topParties[0].party}
              </Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">
                Champion
              </span>
            </div>

            {/* Win count with prominent styling */}
            <div className="text-center bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 px-6 py-3 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <p className="text-5xl md:text-6xl font-extrabold bg-gradient-to-br from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                {topParties[0].wins}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Assembly Seats</p>
            </div>
          </div>

          {/* VS Badge */}
          <div className="relative flex-shrink-0 px-4">
            <span className="text-3xl md:text-4xl font-black text-gray-400 dark:text-gray-500 tracking-widest">
              VS
            </span>
            {winDifference > 0 && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-semibold text-muted-foreground">
                  +{winDifference} lead
                </span>
              </div>
            )}
          </div>

          {/* Party 2 (Runner-up) - Silver styling */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            {/* Runner-up photo with silver ring */}
            <div className="relative">
              <div
                className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 25%, #c0c0c0 50%, #a8a8a8 75%, #c0c0c0 100%)',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-background">
                  {leader2 ? (
                    <Image
                      src={leader2}
                      alt={`${topParties[1].party} leader`}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300/20 to-gray-400/20 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-bold text-gray-500">
                        {topParties[1].party.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Party logo */}
            <Image
              src={`/images/${topParties[1].party}.png`}
              alt={`${topParties[1].party} logo`}
              width={40}
              height={30}
              className="object-contain opacity-80"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />

            {/* Party name badge - muted styling */}
            <Badge variant="secondary" className="text-sm">
              {topParties[1].party}
            </Badge>

            {/* Win count - Runner-up styling */}
            <div className="text-center px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-4xl md:text-5xl font-bold text-gray-500">{topParties[1].wins}</p>
              <p className="text-sm text-muted-foreground">Assembly Seats</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MostWinningPartiesCard
