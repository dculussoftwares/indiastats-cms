'use client'
import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPartyColor } from '@/lib/partyColors'
import { PartyLogo } from '@/components/PartyLogo'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import type { SeatFlip } from '@/app/api/election-analysis/route'
import { getEnglishName } from '@/utilities/bilingualName'
import { SectionAccent } from '@/components/ui/section-accent'

interface SeatFlipSankeyProps {
  seatFlips: SeatFlip[]
  year: number
  prevYear: number
  stateSlug: string
}

// Layout constants
const SVG_W = 600
const SVG_H = 320
const COL_W = 110
const L_X = 20
const R_X = SVG_W - COL_W - 20
const BAR_W = 110
const BAR_GAP = 6
const LABEL_FONT = 11

interface Block {
  party: string
  seats: number
  y: number
  h: number
  color: string
}

function buildBlocks(parties: string[], seatMap: Record<string, number>): Block[] {
  // total height available for bars
  const totalSeats = parties.reduce((s, p) => s + (seatMap[p] ?? 0), 0)
  const usableH = SVG_H - 2 * LABEL_FONT
  const scale = totalSeats > 0 ? usableH / totalSeats : 1
  let y = LABEL_FONT
  return parties.map((party) => {
    const seats = seatMap[party] ?? 0
    const h = Math.max(seats * scale - BAR_GAP, 2)
    const block: Block = { party, seats, y, h, color: getPartyColor(party) }
    y += h + BAR_GAP
    return block
  })
}

// ─── Accordion flip table ────────────────────────────────────────────────────
function FlipTable({
  seatFlips,
  hovered,
  setHovered,
  stateSlug,
}: {
  seatFlips: SeatFlip[]
  hovered: string | null
  setHovered: (k: string | null) => void
  stateSlug: string
}) {
  const [showAll, setShowAll] = React.useState(false)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const displayed = showAll ? seatFlips : seatFlips.slice(0, 8)
  const total = seatFlips.reduce((s, f) => s + f.count, 0)

  return (
    <div className="mt-4 space-y-1">
      {displayed.map((f) => {
        const key = `${f.from}→${f.to}`
        const fromColor = getPartyColor(f.from)
        const toColor = getPartyColor(f.to)
        const isExpanded = expanded === key
        return (
          <div
            key={key}
            className={`rounded border transition-colors ${
              hovered === key
                ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60'
                : 'border-gray-100 dark:border-gray-800'
            }`}
            onMouseEnter={() => setHovered(key)}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              className="w-full flex items-center gap-2 text-xs p-2 text-left"
              onClick={() => setExpanded(isExpanded ? null : key)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px] font-bold"
                style={{ backgroundColor: fromColor }}
              >
                <PartyLogo party={f.from} size={14} />
                {f.from}
              </span>
              <span className="text-muted-foreground">→</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-[10px] font-bold"
                style={{ backgroundColor: toColor }}
              >
                <PartyLogo party={f.to} size={14} />
                {f.to}
              </span>
              <span className="ml-auto font-semibold">{f.count} seats</span>
              <span className="text-muted-foreground text-[10px] w-[32px] text-right">
                {total > 0 ? ((f.count / total) * 100).toFixed(0) : 0}%
              </span>
            </button>
            {isExpanded && f.assemblies && f.assemblies.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
                  {f.assemblies.length} constituencies · sorted by closest margin first
                </p>
                {f.assemblies
                  .slice()
                  .sort((a, b) => a.margin - b.margin)
                  .map((a) => {
                    const href = `/${stateSlug}/assembly/${a.districtSlug}/${a.assemblySlug}`
                    return (
                      <div
                        key={a.assemblyId}
                        className="flex items-center gap-2 py-1.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <Link
                            href={href}
                            className="text-xs font-semibold hover:text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            {getEnglishName(a.assemblyName)}
                            <ExternalLink className="h-2.5 w-2.5 opacity-40 flex-shrink-0 ml-0.5" />
                          </Link>
                          <span className="text-[10px] text-muted-foreground ml-1.5">
                            {getEnglishName(a.districtName)}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 text-xs">
                          <span className="font-semibold">{a.margin.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-0.5">votes</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({a.marginPct}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )
      })}
      {seatFlips.length > 8 && (
        <button
          className="mt-1 text-xs text-primary hover:underline"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Show less' : `Show all ${seatFlips.length} flip types (${total} seats total)`}
        </button>
      )}
    </div>
  )
}

export function SeatFlipSankey({ seatFlips, year, prevYear, stateSlug }: SeatFlipSankeyProps) {
  const [hovered, setHovered] = React.useState<string | null>(null)

  if (!seatFlips || seatFlips.length === 0) return null

  // Aggregate from/to seat counts for sizing the blocks
  const fromSeats: Record<string, number> = {}
  const toSeats: Record<string, number> = {}
  for (const f of seatFlips) {
    fromSeats[f.from] = (fromSeats[f.from] ?? 0) + f.count
    toSeats[f.to] = (toSeats[f.to] ?? 0) + f.count
  }

  const fromParties = Object.keys(fromSeats).sort(
    (a, b) => (fromSeats[b] ?? 0) - (fromSeats[a] ?? 0),
  )
  const toParties = Object.keys(toSeats).sort((a, b) => (toSeats[b] ?? 0) - (toSeats[a] ?? 0))

  const leftBlocks = buildBlocks(fromParties, fromSeats)
  const rightBlocks = buildBlocks(toParties, toSeats)

  const leftMap = Object.fromEntries(leftBlocks.map((b) => [b.party, b]))
  const rightMap = Object.fromEntries(rightBlocks.map((b) => [b.party, b]))

  // Track current drawing offset within each block (from top)
  const leftOffset: Record<string, number> = {}
  const rightOffset: Record<string, number> = {}

  // Draw ribbons for each flip
  const ribbons = seatFlips
    .sort((a, b) => b.count - a.count)
    .map((flip) => {
      const lb = leftMap[flip.from]
      const rb = rightMap[flip.to]
      if (!lb || !rb) return null

      const lOff = leftOffset[flip.from] ?? 0
      const rOff = rightOffset[flip.to] ?? 0
      const totalSeatsFrom = fromSeats[flip.from] ?? 1
      const totalSeatsTo = toSeats[flip.to] ?? 1
      const lh = (flip.count / totalSeatsFrom) * lb.h
      const rh = (flip.count / totalSeatsTo) * rb.h

      leftOffset[flip.from] = lOff + lh
      rightOffset[flip.to] = rOff + rh

      const ly1 = lb.y + lOff
      const ly2 = ly1 + lh
      const ry1 = rb.y + rOff
      const ry2 = ry1 + rh

      const lRight = L_X + BAR_W
      const rLeft = R_X
      const midX = (lRight + rLeft) / 2
      const path = [
        `M ${lRight} ${ly1}`,
        `C ${midX} ${ly1} ${midX} ${ry1} ${rLeft} ${ry1}`,
        `L ${rLeft} ${ry2}`,
        `C ${midX} ${ry2} ${midX} ${ly2} ${lRight} ${ly2}`,
        `Z`,
      ].join(' ')

      const key = `${flip.from}→${flip.to}`
      const color = getPartyColor(flip.to)
      const isHovered = hovered === key

      return (
        <path
          key={key}
          d={path}
          fill={color}
          fillOpacity={isHovered ? 0.75 : 0.35}
          stroke={color}
          strokeWidth={isHovered ? 1.5 : 0.5}
          strokeOpacity={isHovered ? 0.9 : 0.4}
          className="cursor-pointer transition-all duration-150"
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered(null)}
        >
          <title>
            {flip.from} → {flip.to}: {flip.count} seats
          </title>
        </path>
      )
    })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <SectionAccent />
          Power Shift — {prevYear} → {year} Seat Flips
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {seatFlips.reduce((s, f) => s + f.count, 0)} seats changed hands. Hover a ribbon for
          details.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full max-w-2xl mx-auto"
            style={{ minWidth: 340 }}
          >
            {/* Ribbons (draw behind bars) */}
            <g>{ribbons}</g>

            {/* Left bars (lost seats) */}
            {leftBlocks.map((b) => (
              <g key={`l-${b.party}`}>
                <rect
                  x={L_X}
                  y={b.y}
                  width={BAR_W}
                  height={b.h}
                  fill={b.color}
                  rx={3}
                  fillOpacity={0.85}
                />
                {b.h > 16 && (
                  <text
                    x={L_X + BAR_W / 2}
                    y={b.y + b.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={LABEL_FONT}
                    fill="#fff"
                    fontWeight="600"
                  >
                    {b.party} ({b.seats})
                  </text>
                )}
              </g>
            ))}

            {/* Right bars (gained seats) */}
            {rightBlocks.map((b) => (
              <g key={`r-${b.party}`}>
                <rect
                  x={R_X}
                  y={b.y}
                  width={BAR_W}
                  height={b.h}
                  fill={b.color}
                  rx={3}
                  fillOpacity={0.85}
                />
                {b.h > 16 && (
                  <text
                    x={R_X + BAR_W / 2}
                    y={b.y + b.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={LABEL_FONT}
                    fill="#fff"
                    fontWeight="600"
                  >
                    {b.party} ({b.seats})
                  </text>
                )}
              </g>
            ))}

            {/* Column labels */}
            <text
              x={L_X + BAR_W / 2}
              y={10}
              textAnchor="middle"
              fontSize={10}
              fill="#666"
              fontWeight="600"
            >
              LOST BY ({prevYear})
            </text>
            <text
              x={R_X + BAR_W / 2}
              y={10}
              textAnchor="middle"
              fontSize={10}
              fill="#666"
              fontWeight="600"
            >
              GAINED BY ({year})
            </text>
          </svg>
        </div>

        {/* Flip table */}
        <FlipTable
          seatFlips={seatFlips}
          hovered={hovered}
          setHovered={setHovered}
          stateSlug={stateSlug}
        />
      </CardContent>
    </Card>
  )
}
