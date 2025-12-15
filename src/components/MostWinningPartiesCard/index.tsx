'use client'
import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 py-4">
          {/* Party 1 (Winner) */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary shadow-lg overflow-hidden">
              {leader1 ? (
                <Image
                  src={leader1}
                  alt={`${topParties[0].party} leader`}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    {topParties[0].party.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <Image
              src={`/images/${topParties[0].party}.png`}
              alt={`${topParties[0].party} logo`}
              width={40}
              height={30}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <Badge variant="default" className="text-sm">
              {topParties[0].party}
            </Badge>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">{topParties[0].wins}</p>
              <p className="text-sm text-muted-foreground">Assembly Seats</p>
            </div>
          </div>

          {/* VS Badge */}
          <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-900 dark:bg-gray-800 shadow-lg flex-shrink-0">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-wider">VS</span>
          </div>

          {/* Party 2 (Runner-up) */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-secondary shadow-lg overflow-hidden">
              {leader2 ? (
                <Image
                  src={leader2}
                  alt={`${topParties[1].party} leader`}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-secondary">
                    {topParties[1].party.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <Image
              src={`/images/${topParties[1].party}.png`}
              alt={`${topParties[1].party} logo`}
              width={40}
              height={30}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <Badge variant="secondary" className="text-sm">
              {topParties[1].party}
            </Badge>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-red-600">{topParties[1].wins}</p>
              <p className="text-sm text-muted-foreground">Assembly Seats</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MostWinningPartiesCard
