'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPartyColor } from '@/lib/partyColors'
import { PartyLogo } from '@/components/PartyLogo'
import type { PartyVoteShare } from '@/app/api/election-analysis/route'
import { formatNumber } from '@/utilities/formatNumber'

interface MandateMeterProps {
  partyVoteShares: PartyVoteShare[]
  year: number
  prevYear: number | null
}

export function MandateMeter({ partyVoteShares, year, prevYear }: MandateMeterProps) {
  const [showAll, setShowAll] = React.useState(false)
  // Only parties with ≥1 % vote share in current year
  const meaningful = partyVoteShares.filter((p) => p.votePct >= 1)
  const displayed = showAll ? meaningful : meaningful.slice(0, 8)
  const maxPct = Math.max(...meaningful.map((p) => Math.max(p.votePct, p.prevVotePct)), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="inline-block w-1 h-5 bg-red-600 rounded-sm" />
          Mandate Meter — Vote Share
        </CardTitle>
        {prevYear && (
          <p className="text-xs text-muted-foreground mt-1">
            Solid = {year} · Ghost = {prevYear}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayed.map((p) => {
            const color = getPartyColor(p.party)
            const widthCurr = maxPct > 0 ? (p.votePct / maxPct) * 100 : 0
            const widthPrev = maxPct > 0 ? (p.prevVotePct / maxPct) * 100 : 0
            const delta = p.votePct - p.prevVotePct
            const deltaLabel =
              prevYear && p.prevVotePct > 0
                ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pp`
                : null

            return (
              <div key={p.party} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-[72px]">
                    <PartyLogo party={p.party} size={18} />
                    <span
                      className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-semibold">{p.party}</span>
                    {p.seats > 0 && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-medium">
                        {p.seats} seats
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deltaLabel && (
                      <span
                        className={`text-[10px] font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                        title={`${deltaLabel} = vote share changed by ${Math.abs(delta).toFixed(1)} percentage points vs ${prevYear}. "pp" means percentage points — the direct difference between two percentages.`}
                      >
                        {deltaLabel}
                      </span>
                    )}
                    <span className="font-bold w-[44px] text-right">{p.votePct}%</span>
                    <span className="text-muted-foreground w-[40px] text-right">
                      {formatNumber(p.votes)}
                    </span>
                  </div>
                </div>
                {/* Current year bar */}
                <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                  {/* Ghost bar (prev year) */}
                  {prevYear && p.prevVotePct > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 opacity-20 rounded"
                      style={{ width: `${widthPrev}%`, backgroundColor: color }}
                    />
                  )}
                  {/* Current bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all duration-700"
                    style={{ width: `${widthCurr}%`, backgroundColor: color }}
                  />
                </div>
                {/* Prev pct label under ghost */}
                {prevYear && p.prevVotePct > 0 && (
                  <div className="text-[10px] text-muted-foreground text-right">
                    {prevYear}: {p.prevVotePct}% · {formatNumber(p.prevVotes)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {meaningful.length > 8 && (
          <button
            className="mt-3 text-xs text-primary hover:underline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Show less' : `Show all ${meaningful.length} parties`}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
