'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PopulationChangeCard } from '@/components/PopulationChangeCard'
import { GenderChart } from '@/components/GenderChart'
import { MostWinningPartiesCard } from '@/components/MostWinningPartiesCard'
import { VotesSharesChart } from '@/components/VotesSharesChart'
import { ArrowLeft, User, UserCircle2, Users, UsersRound, Locate, Trophy } from 'lucide-react'

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

interface AssemblyData {
  assemblyId: string
  districtId: string
  name: string
  districtName: string
  noOfBooths: number
  voters: {
    male: number
    female: number
    trans: number
    total: number
    isReservedAc: boolean
  } | null
  lastElectionVoters: {
    male: number
    female: number
    trans: number
    total: number
  } | null
  electedMla: any
  electionHistory: ElectionYear[]
}

interface AssemblyPageClientProps {
  data: AssemblyData
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

export function AssemblyPageClient({ data }: AssemblyPageClientProps) {
  const [showAllWinningHistories, setShowAllWinningHistories] = React.useState(false)

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href={`/district/${data.districtId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {data.districtName}
          </Button>
        </Link>
      </div>

      {/* Assembly Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          {data.voters?.isReservedAc ? (
            <Badge variant="default" className="bg-green-600">
              Reserved
            </Badge>
          ) : (
            <Badge variant="secondary">General</Badge>
          )}
        </div>
        <p className="text-muted-foreground">{data.districtName}</p>
      </div>

      {/* Assembly Overview */}
      {data.voters && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Assembly Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booths</p>
                    <p className="text-2xl font-bold">{data.noOfBooths}</p>
                  </div>
                  <Locate className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Male Voters</p>
                    <p className="text-2xl font-bold">{formatNumber(data.voters.male)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.male.toLocaleString()}
                    </p>
                  </div>
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Female Voters</p>
                    <p className="text-2xl font-bold">{formatNumber(data.voters.female)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.female.toLocaleString()}
                    </p>
                  </div>
                  <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transgender</p>
                    <p className="text-2xl font-bold">{data.voters.trans}</p>
                  </div>
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Voters</p>
                    <p className="text-2xl font-bold">{formatNumber(data.voters.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.total.toLocaleString()}
                    </p>
                  </div>
                  <UsersRound className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Most Winning Parties since ADMK formed */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Most Winning Parties since ADMK formed</h2>
          <MostWinningPartiesCard
            historicData={data.electionHistory.map((e) => ({
              year: e.year,
              assemblyId: data.assemblyId,
              totalVoters: e.totalVoters,
              noOfVotesPolled: e.votesPolled,
              candidates: e.candidates.map((c, idx) => ({
                ...c,
                rank: idx + 1,
              })),
            }))}
          />
        </section>
      )}

      {/* Winning Histories since ADMK formed */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Winning Histories since ADMK formed</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(showAllWinningHistories
              ? data.electionHistory
              : data.electionHistory.filter((e) => e.year >= 1977).slice(0, 3)
            ).map((election) => (
              <Card key={election.year}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2">
                    {/* Year as header-like text */}
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {election.year}
                    </p>

                    {/* Party Logo */}
                    <Image
                      src={`/images/${election.winnerParty}.png`}
                      alt={`${election.winnerParty} logo`}
                      width={50}
                      height={38}
                      className="object-contain"
                    />

                    {/* Party Name Badge */}
                    <Badge variant="outline" className="text-xs">
                      {election.winnerParty}
                    </Badge>

                    {/* Winner Name */}
                    <p className="font-medium text-center text-xs text-muted-foreground px-2">
                      {election.winner}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* View all button */}
          {!showAllWinningHistories &&
            data.electionHistory.filter((e) => e.year >= 1977).length > 3 && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setShowAllWinningHistories(true)}>
                  View all
                </Button>
              </div>
            )}
        </section>
      )}

      {/* Gender chart */}
      {data.voters && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Gender chart</h2>
          <GenderChart voters={data.voters} />
        </section>
      )}

      {/* Population Changes */}
      {data.voters && data.lastElectionVoters && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Population Changes since 2019</h2>
          <PopulationChangeCard voters={data.voters} lastElectionVoters={data.lastElectionVoters} />
        </section>
      )}

      {/* Votes shares */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Votes shares</h2>
          <VotesSharesChart electionHistory={data.electionHistory} />
        </section>
      )}

      {/* Past Winning histories */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Past Winning histories</h2>
          <div className="space-y-6">
            {data.electionHistory.map((election) => (
              <Card key={election.year}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Year and Votes Polled */}
                    <div className="flex flex-col items-center space-y-2 md:border-r md:pr-6">
                      <p className="text-2xl font-bold">{election.year}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(election.votesPolled)}
                      </p>
                      <p className="text-xs text-muted-foreground italic">votes polled</p>
                    </div>

                    {/* Winner */}
                    <div className="flex flex-col items-center space-y-3 md:border-r md:pr-6">
                      <Badge className="bg-green-600">Winner</Badge>
                      <Image
                        src={`/images/${election.winnerParty}.png`}
                        alt={`${election.winnerParty} logo`}
                        width={50}
                        height={38}
                        className="object-contain"
                      />
                      <Badge variant="outline" className="text-xs">
                        {election.winnerParty}
                      </Badge>
                      <p className="font-medium text-center text-sm">{election.winner}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(election.winnerVotes)} votes
                      </p>
                      {election.totalVoters > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Total: {formatNumber(election.totalVoters)}
                        </Badge>
                      )}
                    </div>

                    {/* Runners (2nd & 3rd) */}
                    <div className="flex flex-col space-y-4">
                      {election.candidates.slice(1, 3).map((candidate, idx) => {
                        const voteDiff = election.winnerVotes - candidate.votes
                        const voteDiffPercent = (
                          (voteDiff / (election.winnerVotes + candidate.votes)) *
                          100
                        ).toFixed(2)

                        return (
                          <div key={idx} className="flex flex-col items-center space-y-2">
                            <Badge variant="secondary">{idx === 0 ? '2nd' : '3rd'}</Badge>
                            <Image
                              src={`/images/${candidate.party}.png`}
                              alt={`${candidate.party} logo`}
                              width={40}
                              height={30}
                              className="object-contain"
                            />
                            <Badge variant="outline" className="text-xs">
                              {candidate.party}
                            </Badge>
                            <p className="text-xs text-center text-muted-foreground">
                              {candidate.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(candidate.votes)} votes
                            </p>
                            <div className="flex gap-2">
                              <Badge variant="destructive" className="text-xs">
                                -{voteDiffPercent}%
                              </Badge>
                              <Badge variant="outline" className="text-xs text-red-600">
                                -{formatNumber(voteDiff)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
