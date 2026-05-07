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
import {
  Users,
  Target,
  TrendingUp,
  Award,
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { getPartyColor } from '@/lib/partyColors'
import { MandateMeter } from '@/components/MandateMeter'
import { SeatFlipSankey } from '@/components/SeatFlipSankey'
import { MarginScatterPlot } from '@/components/MarginScatterPlot'
import { ConstituencyLeaderboard } from '@/components/ConstituencyLeaderboard'
import { WaveTimeline } from '@/components/WaveTimeline'
import { GenderDistrictChart } from '@/components/GenderDistrictChart'
import { HemicycleChart } from '@/components/HemicycleChart'
import { trackViewed, setPageContext, PAGE_NAMES } from '@/analytics'
import { PartyLogo } from '@/components/PartyLogo'
import type { ElectionAnalysisResponse } from '@/app/api/election-analysis/route'
import type { ConstituencyResult } from '@/lib/electionAnalysis'

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

// ── Phase 5: Contest Intensity ────────────────────────────────────────────────
// How crowded were the races? numCandidates histogram + multi-cornered contest breakdown
function ContestIntensityCard({
  constituencies,
  sectionId,
}: {
  constituencies: ConstituencyResult[]
  sectionId?: string
}) {
  const [showInfo, setShowInfo] = React.useState(false)

  // Bucket by candidate count
  const buckets = [
    { label: '2–3', min: 2, max: 3, seats: [] as ConstituencyResult[] },
    { label: '4–6', min: 4, max: 6, seats: [] as ConstituencyResult[] },
    { label: '7–10', min: 7, max: 10, seats: [] as ConstituencyResult[] },
    { label: '11+', min: 11, max: 999, seats: [] as ConstituencyResult[] },
  ]
  for (const c of constituencies) {
    const n = c.numCandidates ?? 0
    const bucket = buckets.find((b) => n >= b.min && n <= b.max)
    if (bucket) bucket.seats.push(c)
  }

  const total = constituencies.length
  const maxBucket = Math.max(...buckets.map((b) => b.seats.length), 1)

  // Average margin per bucket — more candidates → tighter margin?
  const bucketStats = buckets.map((b) => {
    const avgMarginPct =
      b.seats.length > 0
        ? Math.round((b.seats.reduce((s, c) => s + c.marginPct, 0) / b.seats.length) * 10) / 10
        : 0
    const avgCandidates =
      b.seats.length > 0
        ? Math.round(
            (b.seats.reduce((s, c) => s + (c.numCandidates ?? 0), 0) / b.seats.length) * 10,
          ) / 10
        : 0
    return { ...b, avgMarginPct, avgCandidates }
  })

  // Overall stats
  const allCandidates = constituencies.map((c) => c.numCandidates ?? 0)
  const avgCandidatesOverall =
    allCandidates.length > 0
      ? Math.round((allCandidates.reduce((s, n) => s + n, 0) / allCandidates.length) * 10) / 10
      : 0
  const maxCandidates = Math.max(...allCandidates)
  const mostContested = constituencies
    .filter((c) => (c.numCandidates ?? 0) === maxCandidates)
    .map((c) =>
      c.assemblyName.includes('/') ? c.assemblyName.split('/')[1]!.trim() : c.assemblyName,
    )
    .join(', ')

  // Top 5 most contested (most candidates)
  const mostContestedList = [...constituencies]
    .sort((a, b) => (b.numCandidates ?? 0) - (a.numCandidates ?? 0))
    .slice(0, 5)

  return (
    <section id={sectionId}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3">Contest Intensity</h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
        >
          {showInfo ? 'hide info' : 'what is this?'}
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded text-xs space-y-1.5">
          <p className="font-bold text-sm">How crowded were the races?</p>
          <p>
            The number of candidates per constituency is a proxy for how{' '}
            <span className="font-semibold">contested</span> an election is. More candidates often
            mean more vote-splitting, smaller winning margins, and a higher chance of a plurality
            (not majority) winner.
          </p>
          <p>
            <span className="font-semibold">2–3 candidates</span>: head-to-head or near-direct
            contest — winner likely gets a clearer mandate.{' '}
            <span className="font-semibold">7+ candidates</span>: highly fragmented field — a winner
            can prevail with just 25–30% of the vote.
          </p>
          <p>
            The chart also shows average winning margin per bucket: does a more crowded field
            actually produce closer results?
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          {/* Header stats */}
          <div className="flex flex-wrap gap-4 mb-5">
            <div className="text-center px-3 py-2 rounded border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 flex-shrink-0">
              <p className="text-2xl font-bold text-indigo-600">{avgCandidatesOverall}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                avg candidates
              </p>
            </div>
            <div className="text-center px-3 py-2 rounded border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <p className="text-2xl font-bold">{maxCandidates}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                most in one seat
              </p>
              <p className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                {mostContested}
              </p>
            </div>
          </div>

          {/* Histogram + margin overlay */}
          <p className="text-xs font-semibold mb-3">Seats by candidate count</p>
          <div className="space-y-2.5 mb-4">
            {bucketStats.map((b) => {
              const pct = total > 0 ? Math.round((b.seats.length / total) * 10) / 10 : 0
              return (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="w-10 text-[11px] font-bold text-center flex-shrink-0">
                    {b.label}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden relative">
                    <div
                      className="h-full bg-indigo-400 dark:bg-indigo-600 rounded"
                      style={{ width: `${(b.seats.length / maxBucket) * 100}%` }}
                    />
                    {/* Inline label */}
                    {b.seats.length > 0 && (
                      <span className="absolute left-2 top-0 bottom-0 flex items-center text-[10px] font-bold text-white">
                        {b.seats.length} seats
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground w-10 text-right flex-shrink-0">
                    {pct}%
                  </span>
                  {/* Avg margin chip */}
                  {b.seats.length > 0 && (
                    <div className="text-right flex-shrink-0 w-24">
                      <span className="text-[11px] font-semibold tabular-nums">
                        {b.avgMarginPct}%
                      </span>
                      <span className="text-[9px] text-muted-foreground ml-0.5">avg margin</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Most contested top 5 */}
          <p className="text-xs font-semibold mb-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            Most contested constituencies
          </p>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {mostContestedList.map((c) => {
              const label = c.assemblyName.includes('/')
                ? c.assemblyName.split('/')[1]!.trim()
                : c.assemblyName
              const color = getPartyColor(c.winner.party)
              return (
                <div key={c.assemblyId} className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">
                      {c.districtName.includes('/')
                        ? c.districtName.split('/')[1]!.trim()
                        : c.districtName}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ backgroundColor: color + '22', color }}
                  >
                    {c.winner.party}
                  </span>
                  <div className="text-right flex-shrink-0 w-20">
                    <span className="text-sm font-bold text-indigo-600">
                      {c.numCandidates ?? 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-0.5">candidates</span>
                  </div>
                  <div className="text-right flex-shrink-0 w-16">
                    <span className="text-xs tabular-nums">{c.marginPct}%</span>
                    <span className="text-[9px] text-muted-foreground ml-0.5">margin</span>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            Candidate count per constituency from election records. Avg margin = average winning
            margin % within each bucket. More candidates → tends toward smaller margins.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ── Phase 4: Runner-Up Party Analysis ────────────────────────────────────────
// The "eternal bridesmaid" story — which parties keep finishing second?
function RunnerUpCard({
  constituencies,
  stateSlug,
  sectionId,
}: {
  constituencies: ConstituencyResult[]
  stateSlug: string
  sectionId?: string
}) {
  const [showInfo, setShowInfo] = React.useState(false)
  const [selectedParty, setSelectedParty] = React.useState<string | null>(null)
  const [showAll, setShowAll] = React.useState(false)

  function getEn(name: string) {
    return name.includes('/') ? name.split('/')[1]!.trim() : name
  }

  // Tally runner-up finishes + margins per party
  const runnerMap: Record<
    string,
    { count: number; margins: number[]; seats: ConstituencyResult[] }
  > = {}
  for (const c of constituencies) {
    if (!c.runnerUp.party) continue
    const p = c.runnerUp.party
    if (!runnerMap[p]) runnerMap[p] = { count: 0, margins: [], seats: [] }
    runnerMap[p].count++
    runnerMap[p].margins.push(c.margin)
    runnerMap[p].seats.push(c)
  }

  const rows = Object.entries(runnerMap)
    .map(([party, { count, margins, seats }]) => {
      const avgMargin = Math.round(margins.reduce((s, m) => s + m, 0) / margins.length)
      const minMargin = Math.min(...margins)
      // Near-misses: ALL, sorted smallest margin first
      const nearMisses = [...seats].sort((a, b) => a.margin - b.margin)
      return { party, count, avgMargin, minMargin, nearMisses }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  const selectedData = selectedParty ? rows.find((r) => r.party === selectedParty) : null
  const maxCount = Math.max(...rows.map((r) => r.count), 1)

  return (
    <section id={sectionId}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3">
          Runner-Up Party Analysis
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
        >
          {showInfo ? 'hide info' : 'what is this?'}
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded text-xs space-y-1.5">
          <p className="font-bold text-sm">The &ldquo;eternal bridesmaid&rdquo; story</p>
          <p>
            A party that consistently finishes second — rather than winning — tells a story of
            <span className="font-semibold"> structural opposition weakness</span>. Coming 2nd in 80
            seats with an average margin of 9,000 votes means that party was beaten across the
            board, but by a relatively consistent amount.
          </p>
          <p>
            <span className="font-semibold">Average losing margin</span> = how much the runner-up
            lost by on average. A low average margin despite many runner-up finishes means the party
            nearly won everywhere — a sign of vote fragmentation rather than genuine weakness.
          </p>
          <p>
            <span className="font-semibold">Minimum margin</span> = the closest they came to
            winning. Click a party row to see their narrowest near-miss constituencies.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="space-y-2.5">
            {rows.map((r) => {
              const color = getPartyColor(r.party)
              const isSelected = selectedParty === r.party
              return (
                <div key={r.party}>
                  <button
                    onClick={() => {
                      setSelectedParty(isSelected ? null : r.party)
                      setShowAll(false)
                    }}
                    className={`w-full flex items-center gap-3 rounded p-1.5 transition-colors text-left ${
                      isSelected
                        ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-300 dark:ring-gray-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <div className="w-16 flex items-center gap-1 flex-shrink-0">
                      <PartyLogo party={r.party} size={13} />
                      <span className="text-[11px] font-bold truncate">{r.party}</span>
                    </div>
                    {/* Bar */}
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${(r.count / maxCount) * 100}%`,
                          backgroundColor: color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    {/* Stats */}
                    <div className="flex gap-3 flex-shrink-0 text-right">
                      <div>
                        <p className="text-sm font-bold" style={{ color }}>
                          {r.count}
                        </p>
                        <p className="text-[9px] text-muted-foreground">runner-ups</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold tabular-nums">
                          {r.avgMargin.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-muted-foreground">avg margin</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-600 tabular-nums">
                          {r.minMargin.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-muted-foreground">closest loss</p>
                      </div>
                      {isSelected ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground self-center" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground self-center" />
                      )}
                    </div>
                  </button>

                  {/* Near-misses accordion — all rows, with show more/less */}
                  {isSelected && selectedData && (
                    <div className="mt-1 ml-2 border border-gray-100 dark:border-gray-800 rounded">
                      <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-t flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          Near Misses — {selectedData.nearMisses.length} constituencies
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          margin ↑ smallest first
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {(showAll
                          ? selectedData.nearMisses
                          : selectedData.nearMisses.slice(0, 12)
                        ).map((c) => {
                          const winColor = getPartyColor(c.winner.party)
                          const href = `/${stateSlug}/assembly/${c.districtSlug}/${c.assemblySlug}`
                          return (
                            <div key={c.assemblyId} className="flex items-center gap-2 px-3 py-1.5">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={href}
                                  className="text-xs font-semibold hover:underline inline-flex items-center gap-0.5"
                                >
                                  {getEn(c.assemblyName)}
                                  <ExternalLink className="h-2.5 w-2.5 opacity-40 ml-0.5" />
                                </Link>
                                <span className="text-[10px] text-muted-foreground ml-1.5">
                                  {getEn(c.districtName)}
                                </span>
                              </div>
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ backgroundColor: winColor + '22', color: winColor }}
                              >
                                {c.winner.party}
                              </span>
                              <div className="text-right flex-shrink-0 w-24">
                                <span className="text-xs font-bold text-amber-600 tabular-nums">
                                  {c.margin.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-muted-foreground ml-0.5">
                                  votes
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {selectedData.nearMisses.length > 12 && (
                        <button
                          onClick={() => setShowAll(!showAll)}
                          className="w-full py-2 text-[11px] text-primary hover:bg-gray-50 dark:hover:bg-gray-800/40 flex items-center justify-center gap-1 border-t border-gray-100 dark:border-gray-800"
                        >
                          {showAll ? (
                            <>
                              <ChevronDown className="h-3 w-3" /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronRight className="h-3 w-3" /> Show all{' '}
                              {selectedData.nearMisses.length}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            Runner-up = finished 2nd by vote count. Avg margin = average votes by which runner-up
            lost. Click a party to see their closest near-miss constituencies.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ── Phase 3: District Dominance Scorecard ────────────────────────────────────
// Each district rendered as a row of colored seat-dots — immediate geographic power picture
function DistrictDominanceCard({
  constituencies,
  stateSlug,
  sectionId,
}: {
  constituencies: ConstituencyResult[]
  stateSlug: string
  sectionId?: string
}) {
  const [showInfo, setShowInfo] = React.useState(false)

  function getEn(name: string) {
    return name.includes('/') ? name.split('/')[1]!.trim() : name
  }

  // Group by district
  const districtMap: Record<
    string,
    { slug: string; seats: ConstituencyResult[]; parties: Record<string, number> }
  > = {}
  for (const c of constituencies) {
    const key = c.districtName
    if (!districtMap[key]) {
      districtMap[key] = { slug: c.districtSlug, seats: [], parties: {} }
    }
    districtMap[key].seats.push(c)
    const p = c.winner.party
    districtMap[key].parties[p] = (districtMap[key].parties[p] ?? 0) + 1
  }

  // Sort districts: most swept (one party holds most seats) first → most contested last
  const districts = Object.entries(districtMap)
    .map(([name, { slug, seats, parties }]) => {
      const topPartyCount = Math.max(...Object.values(parties))
      const topParty = Object.entries(parties).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
      const dominancePct = seats.length > 0 ? topPartyCount / seats.length : 0
      // seats sorted by assembly name
      const sortedSeats = [...seats].sort((a, b) =>
        getEn(a.assemblyName).localeCompare(getEn(b.assemblyName)),
      )
      return { name, slug, seats: sortedSeats, parties, topParty, topPartyCount, dominancePct }
    })
    .sort((a, b) => b.dominancePct - a.dominancePct || b.seats.length - a.seats.length)

  return (
    <section id={sectionId}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3">
          District Dominance Scorecard
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
        >
          {showInfo ? 'hide info' : 'what is this?'}
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded text-xs space-y-1.5">
          <p className="font-bold text-sm">Geography of political power</p>
          <p>
            Each row is a district. Each dot is an assembly constituency within that district,
            coloured by the winning party. Hovering a dot shows the constituency name.
          </p>
          <p>
            Districts are sorted by <span className="font-semibold">dominance</span> — how
            completely one party swept the district. A fully monochrome row = total sweep; a
            multicoloured row = a contested district.
          </p>
          <p>
            This instantly reveals geographic strongholds: which districts are impenetrable for the
            opposition, and which are genuinely competitive swing districts.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="space-y-1.5">
            {districts.map(({ name, seats, parties, topParty, topPartyCount, dominancePct }) => {
              const topColor = getPartyColor(topParty)
              return (
                <div key={name} className="flex items-start gap-2 py-1">
                  {/* District name + dominant party */}
                  <div className="w-28 flex-shrink-0 pt-0.5">
                    <p className="text-[11px] font-semibold truncate leading-tight">
                      {getEn(name)}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {topPartyCount}/{seats.length}
                      <span className="ml-1 font-bold" style={{ color: topColor }}>
                        {topParty}
                      </span>
                    </p>
                  </div>

                  {/* Dominance bar */}
                  <div className="w-16 flex-shrink-0 pt-1.5">
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${dominancePct * 100}%`, backgroundColor: topColor }}
                      />
                    </div>
                  </div>

                  {/* Seat dots */}
                  <div className="flex flex-wrap gap-1 flex-1">
                    {seats.map((c) => {
                      const color = getPartyColor(c.winner.party)
                      const href = `/${stateSlug}/assembly/${c.districtSlug}/${c.assemblySlug}`
                      return (
                        <Link
                          key={c.assemblyId}
                          href={href}
                          title={`${getEn(c.assemblyName)} — ${c.winner.party} (${c.marginPct}% margin)`}
                          className="w-4 h-4 rounded-full transition-transform hover:scale-125 flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                      )
                    })}
                  </div>

                  {/* Seat count */}
                  <div className="w-6 flex-shrink-0 text-right text-[10px] text-muted-foreground pt-0.5">
                    {seats.length}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Party dot legend */}
          {(() => {
            const allParties = Array.from(new Set(constituencies.map((c) => c.winner.party))).slice(
              0,
              10,
            )
            return (
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                {allParties.map((p) => (
                  <span key={p} className="flex items-center gap-1 text-[10px]">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getPartyColor(p) }}
                    />
                    {p}
                  </span>
                ))}
              </div>
            )
          })()}

          <p className="text-[10px] text-muted-foreground mt-3">
            Each dot = one assembly constituency. Hover for name + margin. Districts sorted by
            dominance (top party's seat share). Bar shows dominance %, dots show actual seats.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ── Phase 2: Plurality Winners ────────────────────────────────────────────────
// Seats won with < 50% of the valid votes — the "vote-split" phenomenon
function PluralityWinnersCard({
  constituencies,
  stateSlug,
  sectionId,
}: {
  constituencies: ConstituencyResult[]
  stateSlug: string
  sectionId?: string
}) {
  const [showInfo, setShowInfo] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)

  function getEn(name: string) {
    return name.includes('/') ? name.split('/')[1]!.trim() : name
  }

  // A plurality win = winner got < 50% of valid votes polled
  const pluralitySeats = constituencies.filter(
    (c) => c.votesPolled > 0 && c.winner.votes / c.votesPolled < 0.5,
  )
  const majoritySeats = constituencies.filter(
    (c) => c.votesPolled > 0 && c.winner.votes / c.votesPolled >= 0.5,
  )
  const total = constituencies.length
  const pluralityCount = pluralitySeats.length
  const pluralityPct = total > 0 ? Math.round((pluralityCount / total) * 10) / 10 : 0

  // Per-party breakdown
  const partyBreakdown: Record<string, { plurality: number; majority: number }> = {}
  for (const c of constituencies) {
    const p = c.winner.party
    if (!partyBreakdown[p]) partyBreakdown[p] = { plurality: 0, majority: 0 }
    if (c.votesPolled > 0 && c.winner.votes / c.votesPolled < 0.5) {
      partyBreakdown[p].plurality++
    } else {
      partyBreakdown[p].majority++
    }
  }
  const partyRows = Object.entries(partyBreakdown)
    .map(([party, { plurality, majority }]) => ({
      party,
      plurality,
      majority,
      total: plurality + majority,
      pluralityPct: Math.round((plurality / (plurality + majority)) * 1000) / 10,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  // Most extreme plurality wins (winner had lowest vote share)
  const extremePlurality = [...pluralitySeats]
    .sort((a, b) => a.winner.votes / a.votesPolled - b.winner.votes / b.votesPolled)
    .slice(0, 10)
    .map((c) => ({
      ...c,
      winnerVotePct: Math.round((c.winner.votes / c.votesPolled) * 1000) / 10,
    }))

  return (
    <section id={sectionId}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3">
          Plurality Winners (Vote-Split Seats)
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
        >
          {showInfo ? 'hide info' : 'what is this?'}
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-xs space-y-1.5">
          <p className="font-bold text-sm">The spoiler effect in action</p>
          <p>
            A <span className="font-semibold">plurality winner</span> is a candidate who won their
            seat while receiving{' '}
            <span className="font-semibold">less than 50% of valid votes cast</span> in that
            constituency. Under FPTP, a fragmented opposition can hand seats to a minority party.
          </p>
          <p>
            Classic example: three candidates split 34% / 33% / 33% — the winner has only one-third
            of voter support yet takes the seat outright. This is the{' '}
            <span className="font-semibold">&ldquo;spoiler effect&rdquo;</span>: a third candidate
            absorbs votes that would otherwise have defeated the plurality winner.
          </p>
          <p>
            High plurality seat counts signal a fragmented opposition and explain how a party can
            build a large majority on a minority mandate.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          {/* Hero stat */}
          <div className="flex flex-wrap gap-4 items-center mb-5">
            <div className="text-center px-3 py-2 rounded border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 flex-shrink-0">
              <p className="text-3xl font-bold text-orange-600">{pluralityCount}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                plurality seats
              </p>
              <p className="text-[10px] text-orange-600 font-semibold">{pluralityPct}% of total</p>
            </div>
            <div className="text-center px-3 py-2 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 flex-shrink-0">
              <p className="text-3xl font-bold text-emerald-600">{majoritySeats.length}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                majority seats
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold">
                {total > 0 ? Math.round((majoritySeats.length / total) * 10) / 10 : 0}% of total
              </p>
            </div>
            <p className="text-xs text-muted-foreground flex-1 min-w-[140px]">
              {pluralityCount} of {total} seats were won by candidates who received less than half
              of the valid votes polled.
            </p>
          </div>

          {/* Stacked bar: majority vs plurality per party */}
          <p className="text-xs font-semibold mb-2">By party — majority vs plurality wins</p>
          <div className="space-y-2 mb-5">
            {partyRows.map((r) => {
              const color = getPartyColor(r.party)
              const maxTotal = Math.max(...partyRows.map((x) => x.total), 1)
              return (
                <div key={r.party} className="flex items-center gap-2">
                  <div className="w-16 flex items-center gap-1 flex-shrink-0">
                    <PartyLogo party={r.party} size={13} />
                    <span className="text-[11px] font-bold truncate">{r.party}</span>
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex">
                    {/* majority segment */}
                    <div
                      className="h-full"
                      style={{
                        width: `${(r.majority / maxTotal) * 100}%`,
                        backgroundColor: color,
                        opacity: 0.9,
                      }}
                      title={`${r.majority} majority wins`}
                    />
                    {/* plurality segment — hatched look via lower opacity */}
                    <div
                      className="h-full"
                      style={{
                        width: `${(r.plurality / maxTotal) * 100}%`,
                        backgroundColor: color,
                        opacity: 0.35,
                      }}
                      title={`${r.plurality} plurality wins`}
                    />
                  </div>
                  <div className="text-right w-32 flex-shrink-0 text-[10px]">
                    <span className="font-semibold" style={{ color }}>
                      {r.majority}
                    </span>
                    <span className="text-muted-foreground"> maj + </span>
                    <span className="font-semibold text-orange-500">{r.plurality}</span>
                    <span className="text-muted-foreground"> plur</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground mb-5">
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-2 rounded-sm bg-gray-400"
                style={{ opacity: 0.9 }}
              />
              Majority win (≥50% votes)
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-2 rounded-sm bg-gray-400"
                style={{ opacity: 0.35 }}
              />
              Plurality win (&lt;50% votes)
            </span>
          </div>

          {/* Most extreme list */}
          {extremePlurality.length > 0 && (
            <>
              <p className="text-xs font-semibold mb-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                Most extreme plurality wins — lowest winner vote share
              </p>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {(expanded ? extremePlurality : extremePlurality.slice(0, 5)).map((c) => {
                  const href = `/${stateSlug}/assembly/${c.districtSlug}/${c.assemblySlug}`
                  const color = getPartyColor(c.winner.party)
                  return (
                    <div key={c.assemblyId} className="flex items-center gap-3 py-1.5">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={href}
                          className="text-xs font-semibold hover:underline inline-flex items-center gap-0.5"
                        >
                          {getEn(c.assemblyName)}
                          <ExternalLink className="h-2.5 w-2.5 opacity-40 ml-0.5" />
                        </Link>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {getEn(c.districtName)}
                        </span>
                      </div>
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: color + '22', color }}
                      >
                        {c.winner.party}
                      </span>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-orange-600">
                          {c.winnerVotePct}%
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">of votes</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {extremePlurality.length > 5 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-[11px] text-primary hover:underline flex items-center gap-0.5"
                >
                  {expanded ? (
                    <>
                      <ChevronDown className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3" /> Show all {extremePlurality.length}
                    </>
                  )}
                </button>
              )}
            </>
          )}

          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            Plurality win = winner received &lt; 50% of valid votes polled. Majority win = ≥ 50%.
            Vote share = candidate votes ÷ total valid votes polled in that constituency.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ── Phase 1: Vote-to-Seat Disproportionality ──────────────────────────────────
// FPTP's "manufactured majority": a party can win 38% of votes but 60% of seats.
// The bonus/penalty (seatPct − votePct) measures democratic distortion.
function VoteToSeatChart({
  data,
  sectionId,
}: {
  data: ElectionAnalysisResponse
  sectionId?: string
}) {
  const { partyVoteShares, summary } = data
  const totalSeats = summary.totalSeats

  // Only parties with votes or seats; cap at top 8
  const rows = partyVoteShares
    .filter((p) => p.votes > 0 || p.seats > 0)
    .slice(0, 8)
    .map((p) => {
      const seatPct = totalSeats > 0 ? Math.round((p.seats / totalSeats) * 1000) / 10 : 0
      const bonus = Math.round((seatPct - p.votePct) * 10) / 10
      return { ...p, seatPct, bonus }
    })
    .sort((a, b) => b.seatPct - a.seatPct)

  // Gallagher Index (Least Squares Index) — standard measure of disproportionality
  // LSq = sqrt( 0.5 * Σ(seatPct − votePct)² )
  const lsq =
    Math.round(
      Math.sqrt(0.5 * rows.reduce((s, r) => s + Math.pow(r.seatPct - r.votePct, 2), 0)) * 10,
    ) / 10

  const [showInfo, setShowInfo] = React.useState(false)

  return (
    <section id={sectionId}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3">
          Vote-to-Seat Disproportionality
        </h2>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
        >
          {showInfo ? 'hide info' : 'what is this?'}
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs space-y-1.5 text-foreground">
          <p className="font-bold text-sm">How FPTP manufactures majorities</p>
          <p>
            Under First-Past-The-Post, a party winning a plurality in many constituencies can
            convert a <span className="font-semibold">minority of votes</span> into a{' '}
            <span className="font-semibold">majority of seats</span>. This &ldquo;seat bonus&rdquo;
            amplifies the winner and punishes parties whose votes are spread thin.
          </p>
          <p>
            <span className="font-semibold">Seat bonus (green)</span> = party got more seats than
            its vote share deserved. <span className="font-semibold">Seat penalty (red)</span> =
            party got fewer seats than its vote share deserved.
          </p>
          <p>
            The <span className="font-semibold">Gallagher Index (LSq)</span> measures overall
            disproportionality: 0 = perfectly proportional; above 10 = highly disproportional. Most
            FPTP systems score 8–20. Proportional systems score 1–3.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-4 pb-4">
          {/* Gallagher LSq badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-center px-3 py-2 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 flex-shrink-0">
              <p className="text-2xl font-bold text-red-600">{lsq}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
                Gallagher Index
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {lsq < 5
                ? 'Relatively proportional outcome for a FPTP system.'
                : lsq < 10
                  ? 'Moderate disproportionality — typical of FPTP.'
                  : lsq < 15
                    ? 'High disproportionality — votes poorly reflected in seats.'
                    : 'Very high disproportionality — severe manufactured majority.'}
            </p>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-gray-300 dark:bg-gray-600" />
              Vote share
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm bg-current opacity-70" />
              Seat share (party colour)
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> seat bonus
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> seat penalty
            </span>
          </div>

          {/* Rows */}
          <div className="space-y-3">
            {rows.map((p) => {
              const color = getPartyColor(p.party)
              const maxPct = Math.max(...rows.map((r) => Math.max(r.votePct, r.seatPct)), 1)
              return (
                <div key={p.party}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-20 flex items-center gap-1 flex-shrink-0">
                      <PartyLogo party={p.party} size={14} />
                      <span className="text-[11px] font-bold truncate">{p.party}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      {/* Vote bar */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] w-8 text-right text-muted-foreground tabular-nums">
                          {p.votePct}%
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400 dark:bg-gray-500 rounded-full"
                            style={{ width: `${(p.votePct / maxPct) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] w-16 text-muted-foreground">votes</span>
                      </div>
                      {/* Seat bar */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[9px] w-8 text-right font-semibold tabular-nums"
                          style={{ color }}
                        >
                          {p.seatPct}%
                        </span>
                        <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(p.seatPct / maxPct) * 100}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-[9px] w-16 font-semibold" style={{ color }}>
                          {p.seats} seats
                        </span>
                      </div>
                    </div>
                    {/* Bonus/penalty chip */}
                    <div
                      className={`flex-shrink-0 w-16 text-right text-[11px] font-bold tabular-nums ${
                        p.bonus > 0
                          ? 'text-emerald-600'
                          : p.bonus < 0
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {p.bonus > 0 ? '+' : ''}
                      {p.bonus} pp
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            Seat share = seats won ÷ total seats × 100. Bonus = seat% − vote%. Gallagher Index (LSq)
            = √(½ × Σ(seat% − vote%)²). Higher = more disproportional.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

// ── Third Place Card ──────────────────────────────────────────────────────────
function ThirdPlaceGauge({
  d,
  seats,
  selected,
  onClick,
}: {
  d: { party: string; count: number; total: number; thirdPct: number }
  seats: number
  selected: boolean
  onClick: () => void
}) {
  const cx = 60
  const cy = 56
  const r = 40
  const sw = 9
  const pct = Math.min(Math.max(d.thirdPct, 0), 100)
  const angle = Math.PI * (1 - pct / 100)
  const ex = cx + r * Math.cos(angle)
  const ey = cy - r * Math.sin(angle)
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const fillPath =
    pct > 0 ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}` : null

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors w-full ${
        selected
          ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-300 dark:ring-gray-600'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className="h-7 w-7 flex items-center justify-center mb-0.5">
        <img
          src={`/images/${d.party}.png`}
          alt={d.party}
          className="max-w-[26px] max-h-[26px] object-contain"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
      <svg viewBox="0 0 120 90" className="w-full max-w-[140px]">
        <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth={sw} strokeLinecap="round" />
        {fillPath && (
          <path d={fillPath} fill="none" stroke="#3b82f6" strokeWidth={sw} strokeLinecap="round" />
        )}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fontWeight="800" fill="#3b82f6">
          {pct}%
        </text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="8" fontWeight="700" fill="#374151">
          {d.party}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="7" fill="#6b7280">
          {seats} seat{seats !== 1 ? 's' : ''} won
        </text>
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="6.5" fill="#9ca3af">
          {d.count}/{d.total} placed 3rd
        </text>
      </svg>
      {selected ? (
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  )
}

function ThirdPlaceCard({
  data,
  stateSlug,
}: {
  data: ElectionAnalysisResponse
  stateSlug: string
}) {
  const { thirdPlaces, partyVoteShares } = data
  if (!thirdPlaces || thirdPlaces.length === 0) return null

  const [selected, setSelected] = React.useState<string | null>(null)

  // Top 6 parties by vote share with 3rd place data attached
  const top6 = partyVoteShares
    .slice(0, 6)
    .map((pvs) => {
      const tp = thirdPlaces.find((d) => d.party === pvs.party)
      return tp ? { ...tp, seats: pvs.seats } : null
    })
    .filter(Boolean)
    .sort((a, b) => b!.count - a!.count) as ((typeof thirdPlaces)[0] & { seats: number })[]

  const totalThird = thirdPlaces.reduce((s, d) => s + d.count, 0)
  const selectedData = selected ? top6.find((d) => d.party === selected) : null

  function getEn(name: string) {
    return name.includes('/') ? name.split('/')[1]!.trim() : name
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalThird}</span> third-place finishes
            recorded across all constituencies
          </p>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {top6.map((d) => (
            <ThirdPlaceGauge
              key={d.party}
              d={d}
              seats={d.seats}
              selected={selected === d.party}
              onClick={() => setSelected(selected === d.party ? null : d.party)}
            />
          ))}
        </div>

        {/* Accordion: assembly list for selected party */}
        {selectedData && selectedData.assemblies.length > 0 && (
          <div className="mt-4 border border-gray-100 dark:border-gray-800 rounded">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-t">
              <PartyLogo party={selectedData.party} size={16} />
              <span className="text-xs font-bold">{selectedData.party}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedData.assemblies.length} constituencies where candidate placed 3rd
              </span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {selectedData.assemblies.map((a) => {
                const href = `/${stateSlug}/assembly/${a.districtSlug}/${a.assemblySlug}`
                return (
                  <div key={a.assemblyId} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={href}
                        className="text-xs font-semibold hover:text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        {getEn(a.assemblyName)}
                        <ExternalLink className="h-2.5 w-2.5 opacity-40 ml-0.5 flex-shrink-0" />
                      </Link>
                      <span className="text-[10px] text-muted-foreground ml-1.5">
                        {getEn(a.districtName)}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-semibold tabular-nums">
                        {a.votes.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">votes</span>
                      <span className="text-[10px] text-blue-500 font-semibold ml-1.5 tabular-nums">
                        {a.votePct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          Gauge shows % of a party&apos;s candidates who finished 3rd in their constituency. Click a
          gauge to see individual constituencies.
        </p>
      </CardContent>
    </Card>
  )
}

// ── Lost Deposits Card ────────────────────────────────────────────────────────
// Gauge colour: green → yellow → orange → red based on % who lost deposit
function gaugeColor(pct: number): string {
  if (pct >= 80) return '#dc2626'
  if (pct >= 55) return '#f97316'
  if (pct >= 30) return '#eab308'
  return '#22c55e'
}

function DepositGauge({
  d,
  seats,
  selected,
  onClick,
}: {
  d: { party: string; lost: number; total: number; lostPct: number }
  seats: number
  selected: boolean
  onClick: () => void
}) {
  const cx = 60
  const cy = 56
  const r = 40
  const sw = 9
  const pct = Math.min(Math.max(d.lostPct, 0), 100)
  const angle = Math.PI * (1 - pct / 100)
  const ex = cx + r * Math.cos(angle)
  const ey = cy - r * Math.sin(angle)
  const bgPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const fillPath =
    pct > 0 ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}` : null
  const color = gaugeColor(pct)

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors w-full ${
        selected
          ? 'bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-300 dark:ring-gray-600'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      {/* Logo above the SVG arc, as HTML so it doesn't interfere with arc geometry */}
      <div className="h-7 w-7 flex items-center justify-center mb-0.5">
        <img
          src={`/images/${d.party}.png`}
          alt={d.party}
          className="max-w-[26px] max-h-[26px] object-contain"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
      {/* Arc + text — viewBox tall enough for all text below baseline */}
      <svg viewBox="0 0 120 90" className="w-full max-w-[140px]">
        {/* Track arc */}
        <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth={sw} strokeLinecap="round" />
        {/* Filled arc */}
        {fillPath && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        )}
        {/* Percentage */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>
          {pct}%
        </text>
        {/* Party name */}
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="8" fontWeight="700" fill="#374151">
          {d.party}
        </text>
        {/* Seats won */}
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="7" fill="#6b7280">
          {seats} seat{seats !== 1 ? 's' : ''} won
        </text>
        {/* lost/total */}
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="6.5" fill="#9ca3af">
          {d.lost}/{d.total} lost deposit
        </text>
      </svg>
      {selected ? (
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  )
}

function LostDepositsCard({
  data,
  stateSlug,
}: {
  data: ElectionAnalysisResponse
  stateSlug: string
}) {
  const { lostDeposits, partyVoteShares } = data
  if (!lostDeposits || lostDeposits.length === 0) return null

  const [selected, setSelected] = React.useState<string | null>(null)

  // Top 6 parties by vote share, sorted by lostPct descending, with seats attached
  const top6 = partyVoteShares
    .slice(0, 6)
    .map((pvs) => {
      const dep = lostDeposits.find((d) => d.party === pvs.party)
      return dep ? { ...dep, seats: pvs.seats } : null
    })
    .filter(Boolean)
    .sort((a, b) => b!.lostPct - a!.lostPct) as ((typeof lostDeposits)[0] & { seats: number })[]

  const totalLost = lostDeposits.reduce((s, d) => s + d.lost, 0)
  const totalCandidates = lostDeposits.reduce((s, d) => s + d.total, 0)
  const selectedData = selected ? top6.find((d) => d.party === selected) : null

  function getEn(name: string) {
    return name.includes('/') ? name.split('/')[1]!.trim() : name
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalLost}</span> of {totalCandidates}{' '}
            candidates across all parties forfeited their deposit
          </p>
          <span className="text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono flex-shrink-0 ml-2">
            threshold: 1/6 votes
          </span>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {top6.map((d) => (
            <DepositGauge
              key={d.party}
              d={d}
              seats={d.seats}
              selected={selected === d.party}
              onClick={() => setSelected(selected === d.party ? null : d.party)}
            />
          ))}
        </div>

        {/* Accordion: assembly list for selected party */}
        {selectedData && selectedData.assemblies.length > 0 && (
          <div className="mt-4 border border-gray-100 dark:border-gray-800 rounded">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-t">
              <PartyLogo party={selectedData.party} size={16} />
              <span className="text-xs font-bold">{selectedData.party}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedData.assemblies.length} constituencies where deposit was forfeited
              </span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {selectedData.assemblies.map((a) => {
                const href = `/${stateSlug}/assembly/${a.districtSlug}/${a.assemblySlug}`
                return (
                  <div key={a.assemblyId} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={href}
                        className="text-xs font-semibold hover:text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        {getEn(a.assemblyName)}
                        <ExternalLink className="h-2.5 w-2.5 opacity-40 ml-0.5 flex-shrink-0" />
                      </Link>
                      <span className="text-[10px] text-muted-foreground ml-1.5">
                        {getEn(a.districtName)}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-semibold tabular-nums">
                        {a.votes.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-1">votes</span>
                      <span className="text-[10px] text-red-500 font-semibold ml-1.5 tabular-nums">
                        {a.votePct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          Gauge shows % of a party&apos;s candidates who lost their security deposit. A candidate
          forfeits if votes received &le; 1/6 (16.67%) of total valid votes polled in that
          constituency. Click a gauge to see individual constituencies.
        </p>
      </CardContent>
    </Card>
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
      page_name: PAGE_NAMES.ELECTION_ANALYSIS,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
    trackViewed({
      name: 'election_analysis_page',
      page_name: PAGE_NAMES.ELECTION_ANALYSIS,
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
      <section id="seat-distribution">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Seat Distribution</h2>
        <HemicycleChart
          partyVoteShares={data.partyVoteShares}
          totalSeats={data.summary.totalSeats}
          majorityMark={data.summary.majorityMark}
          year={data.year}
        />
      </section>

      {/* ③ Vote-to-Seat Disproportionality */}
      <VoteToSeatChart data={data} sectionId="vote-to-seat" />

      {/* ④ Mandate Meter */}
      <section id="vote-share">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Vote Share</h2>
        <MandateMeter
          partyVoteShares={data.partyVoteShares}
          year={data.year}
          prevYear={data.prevYear}
        />
      </section>

      {/* ③ Power Shift Sankey */}
      {data.seatFlips && data.seatFlips.length > 0 && data.prevYear && (
        <section id="seat-flips">
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
        <section id="vote-wave">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">Vote Share Wave</h2>
          <WaveTimeline waveTimeline={data.waveTimeline} />
        </section>
      )}

      {/* ④b Contest Intensity */}
      <ContestIntensityCard constituencies={data.constituencies} sectionId="contest-intensity" />

      {/* ⑤ Nail-biters vs Landslides scatter */}
      <section id="nail-biters">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
          Nail-biters vs Landslides
        </h2>
        <MarginScatterPlot
          constituencies={data.constituencies}
          year={data.year}
          stateSlug={stateSlug}
        />
      </section>

      {/* ⑥ Plurality Winners */}
      <PluralityWinnersCard
        constituencies={data.constituencies}
        stateSlug={stateSlug}
        sectionId="plurality-winners"
      />

      {/* ⑦ Constituency Leaderboards */}
      <section id="leaderboards">
        <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4"></h2>
        <ConstituencyLeaderboard constituencies={data.constituencies} stateSlug={stateSlug} />
      </section>

      {/* ⑦b Runner-Up Party Analysis */}
      <RunnerUpCard
        constituencies={data.constituencies}
        stateSlug={stateSlug}
        sectionId="runner-up"
      />

      {/* ⑦c Security Deposit Forfeitures */}
      {data.lostDeposits && data.lostDeposits.length > 0 && (
        <section id="deposits">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Security Deposit Forfeitures
          </h2>
          <LostDepositsCard data={data} stateSlug={stateSlug} />
        </section>
      )}

      {/* ⑦d Third Place Finishes */}
      {data.thirdPlaces && data.thirdPlaces.length > 0 && (
        <section id="third-place">
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            3rd Place Finishes
          </h2>
          <ThirdPlaceCard data={data} stateSlug={stateSlug} />
        </section>
      )}

      {/* ⑨ District Dominance Scorecard */}
      <DistrictDominanceCard
        constituencies={data.constituencies}
        stateSlug={stateSlug}
        sectionId="district-dominance"
      />

      {/* ⑩ Gender Electorate Profile (bottom) */}
      {data.districtGenderProfiles && data.districtGenderProfiles.length > 0 && (
        <section id="gender-profile">
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
