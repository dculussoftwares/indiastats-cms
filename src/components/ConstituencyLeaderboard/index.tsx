'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink, Trophy, Target, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { getPartyColor } from '@/lib/partyColors'
import { PartyLogo } from '@/components/PartyLogo'
import type { ConstituencyResult } from '@/app/api/election-analysis/route'
import { formatNumber } from '@/utilities/formatNumber'
import { getEnglishName } from '@/utilities/bilingualName'
import { SectionAccent } from '@/components/ui/section-accent'

interface ConstituencyLeaderboardProps {
  constituencies: ConstituencyResult[]
  stateSlug: string
}

type Tab = 'biggest' | 'closest' | 'highTurnout' | 'lowTurnout' | 'mostCandidates'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'biggest', label: 'Biggest Wins', icon: <Trophy className="h-3 w-3" /> },
  { key: 'closest', label: 'Closest Races', icon: <Target className="h-3 w-3" /> },
  { key: 'highTurnout', label: 'High Turnout', icon: <TrendingUp className="h-3 w-3" /> },
  { key: 'lowTurnout', label: 'Low Turnout', icon: <TrendingDown className="h-3 w-3" /> },
  { key: 'mostCandidates', label: 'Most Candidates', icon: <Users className="h-3 w-3" /> },
]

export function ConstituencyLeaderboard({
  constituencies,
  stateSlug,
}: ConstituencyLeaderboardProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('biggest')

  const sorted: ConstituencyResult[] = React.useMemo(() => {
    const arr = [...constituencies]
    switch (activeTab) {
      case 'biggest':
        return arr.sort((a, b) => b.margin - a.margin).slice(0, 10)
      case 'closest':
        return arr.sort((a, b) => a.margin - b.margin).slice(0, 10)
      case 'highTurnout':
        return arr.sort((a, b) => b.turnoutPct - a.turnoutPct).slice(0, 10)
      case 'lowTurnout':
        return arr.sort((a, b) => a.turnoutPct - b.turnoutPct).slice(0, 10)
      case 'mostCandidates':
        return arr.sort((a, b) => b.numCandidates - a.numCandidates).slice(0, 10)
      default:
        return arr.slice(0, 10)
    }
  }, [constituencies, activeTab])

  const rankBadge = (i: number) => {
    const medals = ['🥇', '🥈', '🥉']
    if (i < 3) return <span className="text-base leading-none">{medals[i]}</span>
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <SectionAccent />
          Constituency Leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                activeTab === t.key
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-300 dark:border-gray-600 hover:border-red-400 text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {sorted.map((c, i) => {
            const winnerColor = getPartyColor(c.winner.party)
            const runnerColor = c.runnerUp?.party ? getPartyColor(c.runnerUp.party) : '#9e9e9e'
            const name = getEnglishName(c.assemblyName)
            const districtName = getEnglishName(c.districtName)
            const href = `/${stateSlug}/assembly/${c.districtSlug}/${c.assemblySlug}`

            // Metric shown changes per tab
            let metric: React.ReactNode
            switch (activeTab) {
              case 'biggest':
              case 'closest':
                metric = (
                  <span className="text-right">
                    <span className="font-bold text-sm">{formatNumber(c.margin)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({c.marginPct}%)</span>
                  </span>
                )
                break
              case 'highTurnout':
              case 'lowTurnout':
                metric = <span className="font-bold text-sm">{c.turnoutPct}%</span>
                break
              case 'mostCandidates':
                metric = <span className="font-bold text-sm">{c.numCandidates} cands.</span>
                break
            }

            return (
              <div
                key={c.assemblyId}
                className="flex items-center gap-2 p-2 rounded border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-6 flex-shrink-0 flex justify-center">{rankBadge(i)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={href}
                      className="font-semibold text-xs hover:text-primary hover:underline inline-flex items-center gap-0.5 truncate"
                    >
                      {name}
                      <ExternalLink className="h-2.5 w-2.5 opacity-40 flex-shrink-0" />
                    </Link>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{districtName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[9px] font-bold"
                      style={{ backgroundColor: winnerColor }}
                    >
                      <PartyLogo party={c.winner.party} size={12} />
                      {c.winner.party}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {c.winner.name.split('.').slice(-1)[0]?.trim() ?? c.winner.name}
                    </span>
                    {c.runnerUp?.party && (
                      <>
                        <span className="text-muted-foreground text-[9px]">vs</span>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[9px] font-bold"
                          style={{ backgroundColor: runnerColor }}
                        >
                          <PartyLogo party={c.runnerUp.party} size={12} />
                          {c.runnerUp.party}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right text-xs">{metric}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
