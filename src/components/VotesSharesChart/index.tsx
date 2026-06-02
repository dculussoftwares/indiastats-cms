'use client'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useStateConfig } from '@/components/providers/StateProvider'

interface Candidate {
  name: string
  party: string
  votes: number
}

interface ElectionYear {
  year: number
  candidates: Candidate[]
}

interface VotesSharesChartProps {
  electionHistory: ElectionYear[]
}

// Fallback colors for unknown parties (index-based)
const FALLBACK_COLORS = [
  '#1976d2',
  '#388e3c',
  '#fbc02d',
  '#d32f2f',
  '#7b1fa2',
  '#0288d1',
  '#c2185b',
  '#ffa000',
  '#455a64',
  '#8bc34a',
]

// Format number for display
const formatNumber = (value: number) => {
  if (value >= 100000) return (value / 100000).toFixed(1) + 'L'
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
  return value.toString()
}

// Custom tooltip that filters out parties with 0 votes
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null

  // Filter out entries with 0 votes
  const filteredPayload = payload.filter((entry: any) => {
    const value = entry.value
    return value != null && value > 0
  })

  if (filteredPayload.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="font-bold text-sm text-red-600 mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
        {label}
      </p>
      <div className="space-y-1.5">
        {filteredPayload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VotesSharesChart({ electionHistory }: VotesSharesChartProps) {
  const state = useStateConfig()

  // Generate color for a party using state config, falling back to index-based palette
  const getPartyColor = (party: string, index: number): string => {
    if (state.partyColors[party]) return state.partyColors[party]
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  }

  if (!electionHistory || electionHistory.length === 0) return null

  // Get all unique parties and their total votes
  const partyTotalVotes = new Map<string, number>()
  electionHistory.forEach((election) => {
    election.candidates.forEach((candidate) => {
      const current = partyTotalVotes.get(candidate.party) || 0
      partyTotalVotes.set(candidate.party, current + candidate.votes)
    })
  })

  // Filter out parties with 0 total votes
  const partyList = Array.from(partyTotalVotes.entries())
    .filter(([_, totalVotes]) => totalVotes > 0)
    .map(([party, _]) => party)

  // Prepare chart data
  const chartData = electionHistory
    .map((election) => {
      const dataPoint: Record<string, number | string> = { year: election.year.toString() }

      partyList.forEach((party) => {
        const candidate = election.candidates.find((c) => c.party === party)
        dataPoint[party] = candidate ? candidate.votes : 0
      })

      return dataPoint
    })
    .sort((a, b) => parseInt(a.year as string) - parseInt(b.year as string))

  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Stacked vote shares by party for each election year
          </p>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="0"
              vertical={false}
              stroke="#e5e7eb"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dy={8}
            />
            <YAxis
              tickFormatter={formatNumber}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">{value}</span>
              )}
            />
            {partyList.map((party, index) => (
              <Bar
                key={party}
                dataKey={party}
                stackId="a"
                fill={getPartyColor(party, index)}
                name={party}
                radius={index === partyList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default VotesSharesChart
