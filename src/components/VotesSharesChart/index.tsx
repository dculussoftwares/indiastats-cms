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

export function VotesSharesChart({ electionHistory }: VotesSharesChartProps) {
  if (!electionHistory || electionHistory.length === 0) return null

  // Get all unique parties
  const allParties = new Set<string>()
  electionHistory.forEach((election) => {
    election.candidates.forEach((candidate) => {
      allParties.add(candidate.party)
    })
  })
  const partyList = Array.from(allParties)

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

  // Format number for tooltip
  const formatNumber = (value: number) => {
    if (value >= 100000) return (value / 100000).toFixed(1) + 'L'
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
    return value.toString()
  }

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
            <Tooltip
              formatter={(value: number, name: string) => [formatNumber(value) + ' votes', name]}
              labelFormatter={(label) => `Year: ${label}`}
            />
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
