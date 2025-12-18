'use client'
import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PopulationChangeCard } from '@/components/PopulationChangeCard'
import { GenderChart } from '@/components/GenderChart'
import { MostWinningPartiesCard } from '@/components/MostWinningPartiesCard'
import { VotesSharesChart } from '@/components/VotesSharesChart'
import { PastWinningHistories } from '@/components/PastWinningHistories'
import { ViewOnMapCard } from '@/components/ViewOnMapCard'
import { ArrowLeft, User, UserCircle2, Users, UsersRound, Locate } from 'lucide-react'

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

      {/* BBC Style Hero Section */}
      <div className="mb-8">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
            {data.voters?.isReservedAc ? (
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 bg-red-600 text-white">
                Reserved
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                General
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{data.districtName}</p>
        </div>
      </div>

      {/* View on Map Card */}
      <div className="mb-8">
        <ViewOnMapCard assemblyId={data.assemblyId} assemblyName={data.name} />
      </div>

      {/* Assembly Overview */}
      {data.voters && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Assembly Overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Locate className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Booths
                    </p>
                    <p className="text-xl font-bold">{data.noOfBooths}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Male Voters
                    </p>
                    <p className="text-xl font-bold">{formatNumber(data.voters.male)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.male.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Female Voters
                    </p>
                    <p className="text-xl font-bold">{formatNumber(data.voters.female)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.female.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Transgender
                    </p>
                    <p className="text-xl font-bold">{data.voters.trans}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total Voters
                    </p>
                    <p className="text-xl font-bold">{formatNumber(data.voters.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.voters.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Most Winning Parties since ADMK formed */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Most Winning Parties since ADMK formed
          </h2>
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
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Winning Histories since ADMK formed
          </h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(showAllWinningHistories
              ? data.electionHistory
              : data.electionHistory.filter((e) => e.year >= 1977).slice(0, 3)
            ).map((election) => (
              <Card key={election.year}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col items-center space-y-2">
                    {/* Year */}
                    <span className="text-xs font-bold uppercase tracking-wide text-red-600">
                      {election.year}
                    </span>

                    {/* Party Logo */}
                    <Image
                      src={`/images/${election.winnerParty}.png`}
                      alt={`${election.winnerParty} logo`}
                      width={45}
                      height={35}
                      className="object-contain"
                    />

                    {/* Party Name */}
                    <span className="text-sm font-bold">{election.winnerParty}</span>

                    {/* Winner Name */}
                    <p className="text-xs text-center text-muted-foreground px-2 line-clamp-2">
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
                <Button
                  variant="outline"
                  onClick={() => setShowAllWinningHistories(true)}
                  className="text-sm font-medium"
                >
                  View all
                </Button>
              </div>
            )}
        </section>
      )}

      {/* Gender chart */}
      {data.voters && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Gender Distribution
          </h2>
          <GenderChart voters={data.voters} />
        </section>
      )}

      {/* Population Changes */}
      {data.voters && data.lastElectionVoters && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Population Changes since 2019
          </h2>
          <PopulationChangeCard voters={data.voters} lastElectionVoters={data.lastElectionVoters} />
        </section>
      )}

      {/* Votes shares */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Vote Shares by Party
          </h2>
          <VotesSharesChart electionHistory={data.electionHistory} />
        </section>
      )}

      {/* Past Winning histories */}
      {data.electionHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Past Winning Histories
          </h2>
          <PastWinningHistories electionHistory={data.electionHistory} />
        </section>
      )}
    </div>
  )
}
