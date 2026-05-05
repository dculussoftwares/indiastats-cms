'use client'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'

const PARTY_COLORS: Record<string, string> = {
  TVK: '#F5C518',
  DMK: '#E7191E',
  AIADMK: '#10663D',
  ADMK: '#10663D',
  INC: '#00bcd4',
  BJP: '#FF9933',
  PMK: '#D4A017',
  VCK: '#c2185b',
  NTK: '#4caf50',
  DMDK: '#7b1fa2',
  CPI: '#f44336',
  'CPI(M)': '#e91e63',
  CPIM: '#e91e63',
  AMMK: '#FF6B35',
  MNM: '#009688',
  IND: '#9e9e9e',
  NOTA: '#607d8b',
}

const FALLBACK_COLORS = ['#1976d2', '#0288d1', '#c2185b', '#ffa000', '#455a64', '#558b2f']

function getPartyColor(party: string, fallbackIndex: number): string {
  return PARTY_COLORS[party] ?? FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]
}

function fmtVotes(v: number): string {
  if (v >= 100000) return (v / 100000).toFixed(1) + 'L'
  if (v >= 1000) return (v / 1000).toFixed(0) + 'K'
  return v.toString()
}

interface Candidate {
  name: string
  party: string
  votes: number
}

interface ElectionYear {
  year: number
  totalVoters: number
  votesPolled: number
  candidates: Candidate[]
}

interface VoteTransferChartProps {
  electionHistory: ElectionYear[]
}

interface Segment {
  party: string
  votes: number
  color: string
}

function buildSegments(election: ElectionYear): { segments: Segment[]; othersVotes: number } {
  const top3 = election.candidates.slice(0, 3)
  const top3Sum = top3.reduce((s, c) => s + c.votes, 0)
  const others = Math.max(0, (election.votesPolled || 0) - top3Sum)
  const segments: Segment[] = top3.map((c, i) => ({
    party: c.party,
    votes: c.votes,
    color: getPartyColor(c.party, i),
  }))
  return { segments, othersVotes: others }
}

export function VoteTransferChart({ electionHistory }: VoteTransferChartProps) {
  const sorted = [...electionHistory].sort((a, b) => b.year - a.year)
  if (sorted.length < 2) return null

  const recent = sorted[0]
  const prev = sorted[1]

  // Use the larger totalVoters as the baseline width reference
  const baseline = Math.max(recent.totalVoters, prev.totalVoters, 1)

  const recentSegs = buildSegments(recent)
  const prevSegs = buildSegments(prev)

  // Collect unique parties for legend (in order of appearance)
  const legendParties = new Map<string, string>()
  ;[...recentSegs.segments, ...prevSegs.segments].forEach((s) => {
    if (!legendParties.has(s.party)) legendParties.set(s.party, s.color)
  })

  const renderRow = (
    label: string,
    isBaseline: boolean,
    segments: Segment[],
    othersVotes: number,
    total: number,
  ) => {
    const polledPct = (total / baseline) * 100
    const nonVoterPct = Math.max(0, 100 - polledPct)

    return (
      <div className="flex items-center gap-2 mb-3">
        {/* Label */}
        <div className="w-14 shrink-0 text-right">
          <span className="text-xs font-bold text-foreground">{label}</span>
          {!isBaseline && (
            <p className="text-[10px] text-muted-foreground">{fmtVotes(total)} votes</p>
          )}
        </div>

        {/* Bar */}
        <div className="flex-1 min-w-0">
          <div className="flex h-9 rounded overflow-hidden w-full">
            {isBaseline ? (
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">
                  {fmtVotes(baseline)} registered voters
                </span>
              </div>
            ) : (
              <>
                {segments.map((seg) => {
                  const pct = (seg.votes / baseline) * 100
                  return (
                    <div
                      key={seg.party}
                      style={{ width: `${pct}%`, backgroundColor: seg.color }}
                      className="h-full flex items-center justify-center overflow-hidden shrink-0"
                      title={`${seg.party}: ${seg.votes.toLocaleString()}`}
                    >
                      {pct >= 7 && (
                        <span className="text-[10px] font-bold text-white leading-none px-0.5 truncate">
                          {seg.party}
                        </span>
                      )}
                    </div>
                  )
                })}
                {othersVotes > 0 && (
                  <div
                    style={{
                      width: `${(othersVotes / baseline) * 100}%`,
                      backgroundColor: '#9e9e9e',
                    }}
                    className="h-full flex items-center justify-center overflow-hidden shrink-0"
                    title={`Others: ${othersVotes.toLocaleString()}`}
                  >
                    {(othersVotes / baseline) * 100 >= 7 && (
                      <span className="text-[10px] font-bold text-white leading-none px-0.5">
                        Others
                      </span>
                    )}
                  </div>
                )}
                {nonVoterPct > 0 && (
                  <div
                    style={{ width: `${nonVoterPct}%` }}
                    className="h-full bg-gray-100 dark:bg-gray-800 shrink-0"
                    title={`Did not vote: ~${fmtVotes(Math.round(baseline - total))}`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Turnout % */}
        <div className="w-16 shrink-0 text-left">
          {!isBaseline && (
            <span className="text-[10px] text-muted-foreground">
              {polledPct.toFixed(0)}% turnout
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground mb-4">
          Top 3 parties from each election. Bar width is proportional to registered voters — the
          gray area represents non-voters.
        </p>

        {renderRow('Voters', true, [], 0, baseline)}
        {renderRow(
          String(prev.year),
          false,
          prevSegs.segments,
          prevSegs.othersVotes,
          prev.votesPolled,
        )}
        {renderRow(
          String(recent.year),
          false,
          recentSegs.segments,
          recentSegs.othersVotes,
          recent.votesPolled,
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t">
          {Array.from(legendParties.entries()).map(([party, color]) => (
            <div key={party} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{party}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm shrink-0 bg-[#9e9e9e]" />
            <span className="text-xs text-muted-foreground">Others</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
            <span className="text-xs text-muted-foreground">Non-voters</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
