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

// Color palette for parties
const PARTY_COLORS: Record<string, string> = {
  DMK: '#d32f2f',
  ADMK: '#1976d2',
  AIADMK: '#1976d2',
  INC: '#00bcd4',
  BJP: '#ff9800',
  PMK: '#fbc02d',
  DMDK: '#7b1fa2',
  VCK: '#c2185b',
  CPI: '#f44336',
  CPM: '#e91e63',
  CPIM: '#e91e63',
  NTK: '#4caf50',
  MNM: '#009688',
  IND: '#9e9e9e',
  OTH: '#607d8b',
}

// Generate color for unknown parties
const getPartyColor = (party: string, index: number): string => {
  if (PARTY_COLORS[party]) return PARTY_COLORS[party]
  const colors = [
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
  return colors[index % colors.length]
}

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
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-2">Year: {label}</p>
      <div className="space-y-1">
        {filteredPayload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="font-medium">{entry.name}:</span>
            <span>{formatNumber(entry.value)} votes</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VotesSharesChart({ electionHistory }: VotesSharesChartProps) {
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
      <CardContent className="pt-6">
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium">Votes by all parties for each year</p>
          <p className="text-xs text-muted-foreground italic">
            Highest at the bottom, lowest at the top
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {partyList.map((party, index) => (
              <Bar
                key={party}
                dataKey={party}
                stackId="a"
                fill={getPartyColor(party, index)}
                name={party}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default VotesSharesChart
