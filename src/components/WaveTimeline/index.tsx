'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getPartyColor } from '@/lib/partyColors'
import { useStateConfig } from '@/components/providers/StateProvider'
import type { WaveDataPoint } from '@/app/api/election-analysis/route'

interface WaveTimelineProps {
  waveTimeline: WaveDataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const nonZero = payload.filter((p: any) => (p.value ?? 0) > 0.5)
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-md p-3 text-xs min-w-[160px]">
      <p className="font-bold text-sm border-b pb-1 mb-1 text-red-600">{label}</p>
      {nonZero.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.dataKey}</span>
          </div>
          <span className="font-bold">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export function WaveTimeline({ waveTimeline }: WaveTimelineProps) {
  const state = useStateConfig()
  const MAJOR_PARTIES = state.majorParties

  if (!waveTimeline || waveTimeline.length < 2) return null

  // Determine which parties to show (present across any year with ≥1%)
  const presentParties = new Set<string>()
  for (const point of waveTimeline) {
    for (const [key, val] of Object.entries(point)) {
      if (key !== 'year' && typeof val === 'number' && val >= 1) {
        presentParties.add(key)
      }
    }
  }
  // Order: major parties first, then rest
  const orderedParties = [
    ...MAJOR_PARTIES.filter((p) => presentParties.has(p)),
    ...[...presentParties].filter((p) => !MAJOR_PARTIES.includes(p)).sort(),
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="inline-block w-1 h-5 bg-red-600 rounded-sm" />
          Vote Share Wave — 2011 to {waveTimeline[waveTimeline.length - 1]?.year}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Stacked area = 100% of votes cast per election. Watch how parties rose and fell.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={waveTimeline}
            stackOffset="expand"
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} iconType="circle" iconSize={8} />
            {orderedParties.map((party) => (
              <Area
                key={party}
                type="monotone"
                dataKey={party}
                stackId="1"
                stroke={getPartyColor(party)}
                fill={getPartyColor(party)}
                fillOpacity={0.8}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
