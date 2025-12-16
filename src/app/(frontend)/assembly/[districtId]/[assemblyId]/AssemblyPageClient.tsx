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

      {/* Winning Histories since ADMK formed - Last 3 Winners */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Winning Histories since ADMK formed</h2>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.electionHistory.slice(0, 3).map((election) => (
              <Card key={election.year} className="overflow-hidden">
                <div className="bg-primary px-4 py-2">
                  <p className="text-primary-foreground font-semibold">{election.year}</p>
                </div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-3">
                    {/* Party Logo */}
                    <Image
                      src={`/images/${election.winnerParty}.png`}
                      alt={`${election.winnerParty} logo`}
                      width={60}
                      height={45}
                      className="object-contain"
                    />

                    {/* Party Name Badge */}
                    <Badge variant="outline" className="text-sm">
                      {election.winnerParty}
                    </Badge>

                    {/* Winner Name */}
                    <p className="font-semibold text-center text-sm text-muted-foreground">
                      {election.winner}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

      {/* Election History - Winning Histories section */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Election History</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.electionHistory.map((election) => (
              <Card key={election.year} className="overflow-hidden">
                <div className="bg-primary px-4 py-2">
                  <p className="text-primary-foreground font-semibold">{election.year}</p>
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3 mb-4">
                    <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-semibold">{election.winner}</p>
                      <Badge variant="outline">{election.winnerParty}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatNumber(election.winnerVotes)} votes
                      </p>
                    </div>
                  </div>

                  {election.totalVoters > 0 && (
                    <div className="text-sm text-muted-foreground border-t pt-3">
                      <p>Total Voters: {formatNumber(election.totalVoters)}</p>
                      {election.votesPolled > 0 && (
                        <p>
                          Votes Polled: {formatNumber(election.votesPolled)} (
                          {((election.votesPolled / election.totalVoters) * 100).toFixed(1)}%)
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
