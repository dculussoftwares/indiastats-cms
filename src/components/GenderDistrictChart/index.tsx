'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPartyColor } from '@/lib/partyColors'
import { PartyLogo } from '@/components/PartyLogo'
import type { DistrictGenderProfile } from '@/app/api/election-analysis/route'
import { getEnglishName } from '@/utilities/bilingualName'
import { SectionAccent } from '@/components/ui/section-accent'

interface GenderDistrictChartProps {
  profiles: DistrictGenderProfile[]
}

export function GenderDistrictChart({ profiles }: GenderDistrictChartProps) {
  if (!profiles || profiles.length === 0) return null

  // Sort by female % desc (already sorted server-side, but defensive)
  const sorted = [...profiles].sort((a, b) => b.femalePct - a.femalePct)
  const maxTotal = Math.max(...sorted.map((p) => p.totalElectors))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <SectionAccent />
          Gender Electorate Profile by District
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Sorted by female voter %. Dominant winning party badge shown on right.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {sorted.map((p) => {
            const name = getEnglishName(p.districtName)
            const dominantColor = p.dominantParty ? getPartyColor(p.dominantParty) : '#6b7280'
            const barWidth = maxTotal > 0 ? (p.totalElectors / maxTotal) * 100 : 0

            return (
              <div key={p.districtName} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium w-28 truncate">{name}</span>
                  <div className="flex items-center gap-2">
                    {/* Female bar segment indicator */}
                    <span className="text-[10px] text-pink-500 font-bold w-[38px] text-right">
                      ♀ {p.femalePct}%
                    </span>
                    <span className="text-[10px] text-blue-500 font-bold w-[38px] text-right">
                      ♂ {p.malePct}%
                    </span>
                    {p.dominantParty && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[9px] font-bold"
                        style={{ backgroundColor: dominantColor }}
                      >
                        <PartyLogo party={p.dominantParty} size={12} />
                        {p.dominantParty}
                      </span>
                    )}
                  </div>
                </div>
                {/* Stacked gender bar */}
                <div
                  className="relative h-3 rounded overflow-hidden bg-gray-100 dark:bg-gray-800"
                  style={{ width: `${barWidth}%`, minWidth: '30%' }}
                >
                  {/* Female segment (left portion) */}
                  <div
                    className="absolute inset-y-0 left-0 bg-pink-400"
                    style={{ width: `${p.femalePct}%` }}
                  />
                  {/* Male segment */}
                  <div
                    className="absolute inset-y-0 bg-blue-400"
                    style={{ left: `${p.femalePct}%`, right: 0 }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-right">
                  {(p.totalElectors / 1e5).toFixed(1)}L electors
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded bg-pink-400" /> Female
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded bg-blue-400" /> Male
          </span>
          <span className="ml-auto">Bar width ∝ total electors</span>
        </div>
      </CardContent>
    </Card>
  )
}
