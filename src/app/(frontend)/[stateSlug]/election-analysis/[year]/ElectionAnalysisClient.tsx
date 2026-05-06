'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Target, TrendingUp, Award, Zap } from 'lucide-react'
import { getPartyColor } from '@/lib/partyColors'
import { MandateMeter } from '@/components/MandateMeter'
import { SeatFlipSankey } from '@/components/SeatFlipSankey'
import { MarginScatterPlot } from '@/components/MarginScatterPlot'
import { ConstituencyLeaderboard } from '@/components/ConstituencyLeaderboard'
import { WaveTimeline } from '@/components/WaveTimeline'
import { GenderDistrictChart } from '@/components/GenderDistrictChart'
import { HemicycleChart } from '@/components/HemicycleChart'
import { trackViewed, setPageContext } from '@/analytics'
import { PartyLogo } from '@/components/PartyLogo'
import type { ElectionAnalysisResponse } from '@/app/api/election-analysis/route'

interface ElectionAnalysisClientProps {
  data: ElectionAnalysisResponse
  stateSlug: string
  stateCode: string
  availableYears: number[]
}

function fmtM(v: number): string {
  if (v >= 1e7) return (v / 1e7).toFixed(2) + ' Cr'
  if (v >= 1e5) return (v / 1e5).toFixed(1) + 'L'
  return v.toLocaleString()
}

function PartyChip({ party }: { party: string }) {
  const color = getPartyColor(party)
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px] font-bold"
      style={{ backgroundColor: color }}
    >
      <PartyLogo party={party} size={14} />
      {party}
    </span>
  )
}

// ── Verdict Hero ──────────────────────────────────────────────────────────────
function VerdictHero({ data }: { data: ElectionAnalysisResponse }) {
  const { summary } = data
  const winner = data.partyVoteShares[0]
  const winnerColor = winner ? getPartyColor(winner.party) : '#BB1919'
  const majoritySeats = summary.majorityMark
  const winnerSeats = winner?.seats ?? 0
  const aboveMajority = winnerSeats - majoritySeats

  // Progress toward majority for the biggest winner
  const pct = Math.min((winnerSeats / summary.totalSeats) * 100, 100)
  const majorityPct = (majoritySeats / summary.totalSeats) * 100

  return (
    <div className="mb-8 space-y-4">
      {/* Headline */}
      <div className="border-l-4 border-red-600 pl-4">
        <h1 className="text-3xl font-bold tracking-tight">{data.year} Election Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {summary.totalSeats} constituencies · {fmtM(summary.totalElectors)} electors ·{' '}
          {summary.turnoutPct}% turnout
          {summary.turnoutDelta != null && (
            <span
              className={`ml-2 font-bold ${summary.turnoutDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
            >
              ({summary.turnoutDelta >= 0 ? '+' : ''}
              {summary.turnoutDelta} pp vs {data.prevYear})
            </span>
          )}
        </p>
      </div>

      {/* Seat meter card */}
      {winner && (
        <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: winnerColor }}>
          <CardContent className="pt-4 pb-5">
            <div className="flex flex-wrap gap-6 items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
                  Largest party
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold" style={{ color: winnerColor }}>
                    {winnerSeats}
                  </span>
                  <div>
                    <PartyChip party={winner.party} />
                    {aboveMajority > 0 && (
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        +{aboveMajority} above majority
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Seat-count progress bar with majority line */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>0</span>
                  <span className="text-red-600 font-semibold">Majority: {majoritySeats}</span>
                  <span>{summary.totalSeats}</span>
                </div>
                <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  {/* Winner bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all duration-1000"
                    style={{ width: `${pct}%`, backgroundColor: winnerColor }}
                  />
                  {/* Majority tick */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                    style={{ left: `${majorityPct}%` }}
                  />
                </div>
                <div
                  className="text-[9px] text-red-600 font-bold mt-0.5"
                  style={{
                    marginLeft: `${majorityPct}%`,
                    transform: 'translateX(-50%)',
                    display: 'inline-block',
                  }}
                >
                  ▲ {majoritySeats}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.partyVoteShares
                    .filter((p) => p.seats > 0)
                    .slice(0, 6)
                    .map((p) => (
                      <span key={p.party} className="text-xs">
                        <PartyChip party={p.party} />
                        <span className="ml-1 font-semibold">{p.seats}</span>
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Turnout */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Turnout
              </p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{summary.turnoutPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fmtM(summary.votesPolled)} of {fmtM(summary.totalElectors)} voted
            </p>
            {summary.turnoutDelta != null && (
              <p
                className={`text-sm font-semibold mt-1 ${summary.turnoutDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {summary.turnoutDelta >= 0 ? '↑' : '↓'} {Math.abs(summary.turnoutDelta)} pp vs{' '}
                {data.prevYear}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Closest race */}
        <Card className="border-l-4 border-amber-400">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Nail-biter
              </p>
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold">
              {summary.closestMargin.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">votes</span>
            </p>
            <p className="text-xs font-medium truncate mt-0.5">
              {summary.closestConstituency.includes('/')
                ? summary.closestConstituency.split('/')[1].trim()
                : summary.closestConstituency}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <PartyChip party={summary.closestWinnerParty} />
              <span className="text-[10px] text-muted-foreground">beat</span>
              <PartyChip party={summary.closestRunnerParty} />
            </div>
          </CardContent>
        </Card>

        {/* Biggest mandate */}
        <Card className="border-l-4 border-emerald-500">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                Biggest Mandate
              </p>
              <Award className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold">
              {fmtM(summary.biggestMargin)}
              <span className="text-sm font-normal text-muted-foreground ml-1">margin</span>
            </p>
            <p className="text-xs font-medium truncate mt-0.5">
              {summary.biggestConstituency.includes('/')
                ? summary.biggestConstituency.split('/')[1].trim()
                : summary.biggestConstituency}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <PartyChip party={summary.biggestWinnerParty} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────
export function ElectionAnalysisClient({
  data,
  stateSlug,
  stateCode,
  availableYears,
}: ElectionAnalysisClientProps) {
  const router = useRouter()

  React.useEffect(() => {
    setPageContext({
      page_name: 'Election Analysis',
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
    trackViewed({
      name: 'election_analysis_page',
      page_name: 'Election Analysis',
      page_type: 'other',
    })
  }, [])

  const handleYearChange = (value: string) => {
    router.push(`/${stateSlug}/election-analysis/${value}`)
  }

  return (
    <div className="space-y-8 mt-4">
      {/* Year selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Election year:</span>
        <Select value={String(data.year)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears
              .slice()
              .reverse()
              .map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* ① The Verdict */}
      <VerdictHero data={data} />

      {/* ② Parliament Hemicycle */}
      <section>
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Seat Distribution</h2>
        <HemicycleChart
          partyVoteShares={data.partyVoteShares}
          totalSeats={data.summary.totalSeats}
          majorityMark={data.summary.majorityMark}
          year={data.year}
        />
      </section>

      {/* ③ Mandate Meter */}
      <section>
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Vote Share</h2>
        <MandateMeter
          partyVoteShares={data.partyVoteShares}
          year={data.year}
          prevYear={data.prevYear}
        />
      </section>

      {/* ③ Power Shift Sankey */}
      {data.seatFlips && data.seatFlips.length > 0 && data.prevYear && (
        <section>
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Seat Flips</h2>
          <SeatFlipSankey
            seatFlips={data.seatFlips}
            year={data.year}
            prevYear={data.prevYear}
            stateSlug={stateSlug}
          />
        </section>
      )}

      {/* ④ Wave Timeline */}
      {data.waveTimeline && data.waveTimeline.length >= 2 && (
        <section>
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Vote Share Wave</h2>
          <WaveTimeline waveTimeline={data.waveTimeline} />
        </section>
      )}

      {/* ⑤ Nail-biters vs Landslides scatter */}
      <section>
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Nail-biters vs Landslides
        </h2>
        <MarginScatterPlot
          constituencies={data.constituencies}
          year={data.year}
          stateSlug={stateSlug}
        />
      </section>

      {/* ⑥ Constituency Leaderboards */}
      <section>
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Constituency Leaderboards
        </h2>
        <ConstituencyLeaderboard constituencies={data.constituencies} stateSlug={stateSlug} />
      </section>

      {/* ⑦ Gender District Profile */}
      {data.districtGenderProfiles && data.districtGenderProfiles.length > 0 && (
        <section>
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Gender Electorate Profile
          </h2>
          <GenderDistrictChart profiles={data.districtGenderProfiles} />
        </section>
      )}

      {/* Footnotes */}
      <footer className="border-t border-border pt-4 mt-2">
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          <li>
            <span className="font-semibold text-foreground">pp (percentage points)</span> — the
            direct arithmetic difference between two vote-share percentages. E.g. a party rising
            from 32% → 35% gained <span className="font-semibold">+3 pp</span>, not a 3% increase.
            It measures absolute share change, not relative growth.
          </li>
          {data.prevYear && (
            <li>
              <span className="font-semibold text-foreground">Comparison year:</span> All ± figures
              compare {data.year} results against {data.prevYear} election data.
            </li>
          )}
          <li>
            <span className="font-semibold text-foreground">Vote share</span> = party&apos;s total
            votes ÷ total valid votes polled (not registered electors).
          </li>
        </ul>
      </footer>
    </div>
  )
}
