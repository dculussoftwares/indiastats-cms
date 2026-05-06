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

      {/* ⑦ Security Deposit Forfeitures */}
      {data.lostDeposits && data.lostDeposits.length > 0 && (
        <section>
          <h2 className="text-lg font-bold border-l-4 border-red-600 pl-3 mb-4">
            Security Deposit Forfeitures
          </h2>
          <LostDepositsCard data={data} stateSlug={stateSlug} />
        </section>
      )}

      {/* ⑧ Gender District Profile */}
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
