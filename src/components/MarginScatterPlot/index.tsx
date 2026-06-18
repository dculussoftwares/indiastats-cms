'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getPartyColor } from '@/lib/partyColors'
import { PartyLogo } from '@/components/PartyLogo'
import type { ConstituencyResult } from '@/app/api/election-analysis/route'
import { getEnglishName } from '@/utilities/bilingualName'
import { SectionAccent } from '@/components/ui/section-accent'

interface MarginScatterPlotProps {
  constituencies: ConstituencyResult[]
  year: number
  stateSlug: string
}

interface TooltipPayloadEntry {
  payload: ConstituencyResult & { x: number; y: number; z: number }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  const color = getPartyColor(d.winner.party)
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-md p-3 text-xs max-w-[220px]">
      <p className="font-bold text-sm border-b pb-1 mb-1" style={{ color }}>
        {getEnglishName(d.assemblyName)}
      </p>
      <div className="space-y-0.5">
        <p>
          <span className="text-muted-foreground">Winner:</span>{' '}
          <span className="font-medium">{d.winner.name}</span>
          <span
            className="ml-1 px-1 rounded text-white text-[9px] font-bold"
            style={{ backgroundColor: color }}
          >
            {d.winner.party}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">Margin:</span>{' '}
          <span className="font-bold">{d.margin.toLocaleString()}</span> ({d.marginPct}%)
        </p>
        <p>
          <span className="text-muted-foreground">Turnout:</span>{' '}
          <span className="font-bold">{d.turnoutPct}%</span>
        </p>
        <p>
          <span className="text-muted-foreground">Electors:</span>{' '}
          {(d.totalElectors / 1e5).toFixed(1)}L
        </p>
      </div>
    </div>
  )
}

export function MarginScatterPlot({ constituencies, year, stateSlug }: MarginScatterPlotProps) {
  const [partyFilter, setPartyFilter] = React.useState<string>('All')

  // Derive top parties (by seat count) for filter buttons
  const partyCounts: Record<string, number> = {}
  for (const c of constituencies) {
    partyCounts[c.winner.party] = (partyCounts[c.winner.party] ?? 0) + 1
  }
  const topParties = Object.entries(partyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p]) => p)

  const filtered =
    partyFilter === 'All'
      ? constituencies
      : constituencies.filter((c) => c.winner.party === partyFilter)

  const plotData = filtered.map((c) => ({
    ...c,
    x: c.turnoutPct,
    y: c.marginPct,
    // Normalize dot size: small=50k electors, large=250k
    z: Math.max(4, Math.min(14, (c.totalElectors / 250000) * 14)),
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <SectionAccent />
          Nail-biters vs Landslides
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Each dot = one constituency. X = Turnout %, Y = Winner's margin %. Hover for details.
        </p>
      </CardHeader>
      <CardContent>
        {/* Party filter pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['All', ...topParties].map((p) => {
            const color = p === 'All' ? '#6b7280' : getPartyColor(p)
            const active = partyFilter === p
            return (
              <button
                key={p}
                onClick={() => setPartyFilter(p)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                  active ? 'text-white' : 'bg-transparent'
                }`}
                style={{
                  borderColor: color,
                  backgroundColor: active ? color : 'transparent',
                  color: active ? '#fff' : color,
                }}
              >
                {p !== 'All' && <PartyLogo party={p} size={16} />}
                {p}
              </button>
            )
          })}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[55, 100]}
              name="Turnout %"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10 }}
              label={{ value: 'Turnout %', position: 'insideBottom', offset: -10, fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 50]}
              name="Margin %"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10 }}
              label={{
                value: 'Margin %',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fontSize: 10,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={plotData} name="Constituencies">
              {plotData.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={getPartyColor(entry.winner.party)}
                  fillOpacity={0.7}
                  r={entry.z}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Bottom-left = tight race + low turnout · Top-right = landslide + high turnout
        </p>
      </CardContent>
    </Card>
  )
}
