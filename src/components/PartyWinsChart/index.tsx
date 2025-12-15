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

interface ElectionData {
  year: number
  assemblyId: string
  totalVoters: number
  noOfVotesPolled: number
  candidates: {
    name: string
    party: string
    votes: number
    rank: number
  }[]
}

interface PartyWinsChartProps {
  historicData: ElectionData[]
}

export function PartyWinsChart({ historicData }: PartyWinsChartProps) {
  if (!historicData || historicData.length === 0) return null

  // Find the top 2 parties across all years
  const partyWins: Record<string, number> = {}
  historicData.forEach((data) => {
    const winner = data.candidates.find((candidate) => candidate.rank === 1)
    if (winner) {
      partyWins[winner.party] = (partyWins[winner.party] || 0) + 1
    }
  })

  const topParties = Object.entries(partyWins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([party]) => party)

  if (topParties.length === 0) return null

  // Get unique years sorted
  const uniqueYears = [...new Set(historicData.map((h) => h.year))].sort((a, b) => a - b)

  // Calculate wins per year for each top party
  const yearlyData = uniqueYears
    .map((year) => {
      const yearWins: Record<string, string | number> = { year: year.toString() }

      topParties.forEach((party) => {
        // Count how many assemblies this party won in this year
        const winsInYear = historicData.filter(
          (h) => h.year === year && h.candidates.find((c) => c.rank === 1)?.party === party,
        ).length
        yearWins[party] = winsInYear
      })

      return yearWins
    })
    .filter((yearData) => {
      // Skip years where both top parties have 0 wins
      const hasData = topParties.some((party) => (yearData[party] as number) > 0)
      return hasData
    })

  const colors = ['hsl(220, 70%, 50%)', 'hsl(0, 70%, 50%)'] // Blue for 1st, Red for 2nd

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="font-semibold">Year-wise Seats Won by Top 2 Parties</h3>
          <p className="text-sm text-muted-foreground">
            Number of assembly seats won in each election year
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={yearlyData} margin={{ left: 20, right: 20, top: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              label={{ value: 'Election Year', position: 'insideBottom', offset: -10 }}
              className="text-xs"
            />
            <YAxis label={{ value: 'Seats Won', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {topParties.map((party, idx) => (
              <Bar key={party} dataKey={party} fill={colors[idx]} name={party} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default PartyWinsChart
