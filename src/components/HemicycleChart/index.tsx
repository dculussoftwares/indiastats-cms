'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPartyColor } from '@/lib/partyColors'
import { PartyLogo } from '@/components/PartyLogo'
import type { PartyVoteShare } from '@/lib/electionAnalysis'

interface HemicycleChartProps {
  partyVoteShares: PartyVoteShare[]
  totalSeats: number
  majorityMark: number
  year: number
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const CX = 220 // SVG center x
const CY = 210 // SVG center y (bottom of arc)
const INNER_R = 55 // innermost row radius
const ROW_GAP = 22 // gap between rows
const NUM_ROWS = 7 // number of concentric rows
const SEAT_R = 5 // radius of each seat circle

// ─── Build row seat counts proportional to arc length ────────────────────────
function buildRowCounts(totalSeats: number): number[] {
  const radii = Array.from({ length: NUM_ROWS }, (_, i) => INNER_R + i * ROW_GAP)
  const totalR = radii.reduce((s, r) => s + r, 0)
  const counts = radii.map((r) => Math.max(1, Math.round((r / totalR) * totalSeats)))
  // Fix rounding error on the middle row
  const diff = totalSeats - counts.reduce((s, c) => s + c, 0)
  counts[Math.floor(NUM_ROWS / 2)] += diff
  return counts
}

// ─── Position of a seat ───────────────────────────────────────────────────────
function seatPos(row: number, idx: number, total: number) {
  const r = INNER_R + row * ROW_GAP
  const angle = Math.PI * (1 - (idx + 0.5) / total)
  return {
    x: +(CX + r * Math.cos(angle)).toFixed(2),
    y: +(CY - r * Math.sin(angle)).toFixed(2),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function HemicycleChart({
  partyVoteShares,
  totalSeats,
  majorityMark,
  year,
}: HemicycleChartProps) {
  const [hoveredParty, setHoveredParty] = React.useState<string | null>(null)

  const parties = partyVoteShares.filter((p) => p.seats > 0).sort((a, b) => b.seats - a.seats)

  const rowCounts = buildRowCounts(totalSeats)

  // Build flat seat list: p.seats dots per party, in party order.
  // Then fill rows sequentially — this guarantees every real seat gets a dot.
  const flatSeats: { party: string; color: string }[] = []
  for (const p of parties) {
    for (let k = 0; k < p.seats; k++) {
      flatSeats.push({ party: p.party, color: getPartyColor(p.party) })
    }
  }

  const seats: { row: number; idx: number; party: string; color: string }[] = []
  let si = 0
  for (let row = 0; row < NUM_ROWS; row++) {
    const n = rowCounts[row]!
    for (let idx = 0; idx < n && si < flatSeats.length; idx++) {
      const s = flatSeats[si++]!
      seats.push({ row, idx, party: s.party, color: s.color })
    }
  }

  // Majority line angle: at the fraction majorityMark/totalSeats of the arc
  const majorityFrac = majorityMark / totalSeats
  const majorityAngle = Math.PI * (1 - majorityFrac)
  const outerR = INNER_R + (NUM_ROWS - 1) * ROW_GAP + SEAT_R + 6
  const mjX = +(CX + outerR * Math.cos(majorityAngle)).toFixed(2)
  const mjY = +(CY - outerR * Math.sin(majorityAngle)).toFixed(2)
  // Label a bit further out
  const lblR = outerR + 14
  const lblX = +(CX + lblR * Math.cos(majorityAngle)).toFixed(2)
  const lblY = +(CY - lblR * Math.sin(majorityAngle)).toFixed(2)

  const hovered = hoveredParty ? parties.find((p) => p.party === hoveredParty) : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="inline-block w-1 h-5 bg-red-600 rounded-sm" />
          Assembly Composition — {year}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {totalSeats} seats · majority at {majorityMark} · hover a party to highlight
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 440 225"
            className="w-full max-w-2xl mx-auto block"
            style={{ minWidth: 300 }}
            aria-label={`Assembly hemicycle for ${year}`}
          >
            {/* Baseline */}
            <line
              x1={CX - outerR}
              y1={CY}
              x2={CX + outerR}
              y2={CY}
              stroke="#d1d5db"
              strokeWidth={1}
            />

            {/* Majority line (dashed) */}
            <line
              x1={CX}
              y1={CY}
              x2={mjX}
              y2={mjY}
              stroke="#BB1919"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={lblX}
              y={lblY}
              fontSize={9}
              fill="#BB1919"
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="700"
            >
              {majorityMark}
            </text>

            {/* Seats */}
            {seats.map((s, i) => {
              const { x, y } = seatPos(s.row, s.idx, rowCounts[s.row]!)
              const isHovered = hoveredParty === s.party
              const isDimmed = hoveredParty !== null && !isHovered
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={SEAT_R}
                  fill={s.color}
                  fillOpacity={isDimmed ? 0.12 : isHovered ? 1 : 0.82}
                  stroke={isHovered ? '#fff' : s.color}
                  strokeWidth={isHovered ? 1 : 0.3}
                  strokeOpacity={0.4}
                  style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
                />
              )
            })}

            {/* Center label: winning party seat count */}
            {parties[0] && (
              <>
                <text
                  x={CX}
                  y={CY - 8}
                  textAnchor="middle"
                  fontSize={22}
                  fontWeight="800"
                  fill={getPartyColor(parties[0].party)}
                >
                  {parties[0].seats}
                </text>
                <text
                  x={CX}
                  y={CY + 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9ca3af"
                  fontWeight="600"
                >
                  {parties[0].party}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Hover info strip — always rendered at fixed height to prevent layout shift */}
        <div
          className="flex items-center gap-3 mx-auto max-w-2xl px-3 rounded text-sm h-10 mb-2 transition-colors duration-150"
          style={{
            backgroundColor: hovered ? getPartyColor(hovered.party) + '18' : 'transparent',
            borderLeft: hovered
              ? `3px solid ${getPartyColor(hovered.party)}`
              : '3px solid transparent',
          }}
        >
          {hovered ? (
            <>
              <PartyLogo party={hovered.party} size={22} />
              <span className="font-bold" style={{ color: getPartyColor(hovered.party) }}>
                {hovered.party}
              </span>
              <span className="font-semibold">{hovered.seats} seats</span>
              <span className="text-muted-foreground text-xs">({hovered.votePct}% votes)</span>
              {hovered.prevVotePct > 0 && (
                <span
                  className={`text-xs font-bold ml-auto ${
                    hovered.votePct - hovered.prevVotePct >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {hovered.votePct - hovered.prevVotePct >= 0 ? '+' : ''}
                  {(hovered.votePct - hovered.prevVotePct).toFixed(1)} pp
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Hover a party to see details</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {parties.map((p) => {
            const color = getPartyColor(p.party)
            const isActive = hoveredParty === p.party
            return (
              <button
                key={p.party}
                className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium transition-all"
                style={{
                  borderColor: color,
                  backgroundColor: isActive ? color + '22' : 'transparent',
                  color: isActive ? color : undefined,
                }}
                onMouseEnter={() => setHoveredParty(p.party)}
                onMouseLeave={() => setHoveredParty(null)}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <PartyLogo party={p.party} size={14} />
                <span style={{ color }}>{p.party}</span>
                <span className="font-bold text-foreground">{p.seats}</span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
