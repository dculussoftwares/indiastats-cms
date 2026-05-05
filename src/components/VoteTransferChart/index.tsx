'use client'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface TooltipState {
  visible: boolean
  x: number
  y: number
  party: string
  votes: number
  pct: number
  color: string
  year: number
  isRibbon?: boolean
  prevVotes?: number
  prevYear?: number
}

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

interface AlluvialNode {
  party: string
  votes: number
  color: string
  y: number
  h: number
}

const SVG_W = 500
const SVG_H = 380
const COL_W = 56
const BLOCK_GAP = 3
const MARGIN_Y = 12

function buildAlluvialNodes(
  election: ElectionYear,
  baseline: number,
  usableH: number,
): AlluvialNode[] {
  const top3 = election.candidates.slice(0, 3)
  const top3Sum = top3.reduce((s, c) => s + c.votes, 0)
  const othersVotes = Math.max(0, (election.votesPolled || 0) - top3Sum)
  const nonVoters = Math.max(0, (election.totalVoters || 0) - (election.votesPolled || 0))

  const items: { party: string; votes: number; color: string }[] = [
    ...top3.map((c, i) => ({ party: c.party, votes: c.votes, color: getPartyColor(c.party, i) })),
    ...(othersVotes > 0 ? [{ party: 'Others', votes: othersVotes, color: '#9e9e9e' }] : []),
    ...(nonVoters > 0 ? [{ party: 'Non-voters', votes: nonVoters, color: '#e5e7eb' }] : []),
  ]

  const scale = (v: number) => (v / baseline) * usableH

  let y = MARGIN_Y
  return items.map((item) => {
    const h = Math.max(scale(item.votes), 1)
    const node: AlluvialNode = { ...item, y, h }
    y += h + BLOCK_GAP
    return node
  })
}

function ribbonPath(
  lx: number,
  ly1: number,
  ly2: number,
  rx: number,
  ry1: number,
  ry2: number,
): string {
  const midX = (lx + rx) / 2
  return [
    `M ${lx} ${ly1}`,
    `C ${midX} ${ly1} ${midX} ${ry1} ${rx} ${ry1}`,
    `L ${rx} ${ry2}`,
    `C ${midX} ${ry2} ${midX} ${ly2} ${lx} ${ly2}`,
    'Z',
  ].join(' ')
}

export function VoteTransferChart({ electionHistory }: VoteTransferChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const touchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [tooltip, setTooltip] = React.useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    party: '',
    votes: 0,
    pct: 0,
    color: '',
    year: 0,
  })

  const sorted = [...electionHistory].sort((a, b) => b.year - a.year)
  if (sorted.length < 2) return null

  const recent = sorted[0]
  const prev = sorted[1]

  const baseline = Math.max(recent.totalVoters, prev.totalVoters, 1)
  const usableH = SVG_H - MARGIN_Y * 2

  const leftNodes = buildAlluvialNodes(prev, baseline, usableH)
  const rightNodes = buildAlluvialNodes(recent, baseline, usableH)

  // Ribbons: connect same-named parties from left to right
  const ribbons: { path: string; color: string; party: string; lVotes: number; rVotes: number }[] =
    []
  for (const rNode of rightNodes) {
    if (rNode.party === 'Non-voters' || rNode.party === 'Others') continue
    const lNode = leftNodes.find((n) => n.party === rNode.party)
    if (!lNode) continue
    ribbons.push({
      path: ribbonPath(
        COL_W,
        lNode.y,
        lNode.y + lNode.h,
        SVG_W - COL_W,
        rNode.y,
        rNode.y + rNode.h,
      ),
      color: rNode.color,
      party: rNode.party,
      lVotes: lNode.votes,
      rVotes: rNode.votes,
    })
  }

  // Legend
  const legendMap = new Map<string, string>()
  ;[...leftNodes, ...rightNodes].forEach((n) => {
    if (!legendMap.has(n.party)) legendMap.set(n.party, n.color)
  })

  function getSvgPos(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const scaleX = SVG_W / rect.width
    const scaleY = SVG_H / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  function getSvgMousePos(e: React.MouseEvent<SVGElement>) {
    return getSvgPos(e.clientX, e.clientY)
  }

  function getSvgTouchPos(e: React.TouchEvent<SVGElement>) {
    const t = e.changedTouches[0]
    return getSvgPos(t.clientX, t.clientY)
  }

  function autoHideAfter(ms: number) {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
    touchTimerRef.current = setTimeout(() => setTooltip((t) => ({ ...t, visible: false })), ms)
  }

  function showBlockTooltipAt(
    pos: { x: number; y: number },
    node: AlluvialNode,
    year: number,
    polled: number,
  ) {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
    setTooltip({
      visible: true,
      x: pos.x,
      y: pos.y,
      party: node.party,
      votes: node.votes,
      pct: polled > 0 ? (node.votes / polled) * 100 : 0,
      color: node.color,
      year,
    })
  }

  function showRibbonTooltipAt(pos: { x: number; y: number }, ribbon: (typeof ribbons)[0]) {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
    const recentPolled = recent.votesPolled || 1
    setTooltip({
      visible: true,
      x: pos.x,
      y: pos.y,
      party: ribbon.party,
      votes: ribbon.rVotes,
      pct: (ribbon.rVotes / recentPolled) * 100,
      color: ribbon.color,
      year: recent.year,
      isRibbon: true,
      prevVotes: ribbon.lVotes,
      prevYear: prev.year,
    })
  }

  function hideTooltip() {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
    setTooltip((t) => ({ ...t, visible: false }))
  }

  // Tooltip box dimensions
  const TT_W = 140
  const TT_H = tooltip.isRibbon ? 82 : 62
  const ttX = tooltip.x + 12 > SVG_W - TT_W ? tooltip.x - TT_W - 8 : tooltip.x + 12
  const ttY = tooltip.y + TT_H + 12 > SVG_H ? tooltip.y - TT_H - 8 : tooltip.y + 8

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        {/* Year labels — widths match SVG column percentage (56/500 = 11.2%) */}
        <div className="flex text-xs font-bold text-muted-foreground mb-1 select-none">
          <span className="w-[11.2%] shrink-0">{prev.year}</span>
          <span className="flex-1" />
          <span className="w-[11.2%] shrink-0 text-right">{recent.year}</span>
        </div>

        {/* Alluvial SVG */}
        <div className="w-full overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full cursor-default sm:max-h-[380px]"
            style={{ display: 'block' }}
            aria-label={`Vote share comparison ${prev.year} vs ${recent.year}`}
            onMouseLeave={hideTooltip}
            onTouchEnd={(e) => {
              if ((e.target as SVGElement).tagName === 'svg') hideTooltip()
            }}
          >
            {/* Ribbons */}
            {ribbons.map((r) => (
              <path
                key={r.party}
                d={r.path}
                fill={r.color}
                fillOpacity={0.28}
                stroke={r.color}
                strokeOpacity={0.45}
                strokeWidth={0.5}
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) => showRibbonTooltipAt(getSvgMousePos(e), r)}
                onMouseLeave={hideTooltip}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  showRibbonTooltipAt(getSvgTouchPos(e), r)
                  autoHideAfter(3000)
                }}
              />
            ))}

            {/* Left column blocks */}
            {leftNodes.map((node) => (
              <g
                key={`l-${node.party}`}
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) =>
                  showBlockTooltipAt(getSvgMousePos(e), node, prev.year, prev.votesPolled)
                }
                onMouseLeave={hideTooltip}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  showBlockTooltipAt(getSvgTouchPos(e), node, prev.year, prev.votesPolled)
                  autoHideAfter(3000)
                }}
              >
                <rect x={0} y={node.y} width={COL_W} height={node.h} fill={node.color} rx={2} />
                {node.h >= 16 && (
                  <text
                    x={COL_W / 2}
                    y={node.y + node.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fontWeight="700"
                    fill={node.party === 'Non-voters' ? '#6b7280' : 'white'}
                    className="select-none"
                  >
                    {node.party}
                  </text>
                )}
                {node.h >= 10 && (
                  <text
                    x={COL_W / 2}
                    y={node.y + node.h + 9}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#9ca3af"
                    className="select-none"
                  >
                    {fmtVotes(node.votes)}
                  </text>
                )}
              </g>
            ))}

            {/* Right column blocks */}
            {rightNodes.map((node) => (
              <g
                key={`r-${node.party}`}
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) =>
                  showBlockTooltipAt(getSvgMousePos(e), node, recent.year, recent.votesPolled)
                }
                onMouseLeave={hideTooltip}
                onTouchEnd={(e) => {
                  e.stopPropagation()
                  showBlockTooltipAt(getSvgTouchPos(e), node, recent.year, recent.votesPolled)
                  autoHideAfter(3000)
                }}
              >
                <rect
                  x={SVG_W - COL_W}
                  y={node.y}
                  width={COL_W}
                  height={node.h}
                  fill={node.color}
                  rx={2}
                />
                {node.h >= 16 && (
                  <text
                    x={SVG_W - COL_W / 2}
                    y={node.y + node.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fontWeight="700"
                    fill={node.party === 'Non-voters' ? '#6b7280' : 'white'}
                    className="select-none"
                  >
                    {node.party}
                  </text>
                )}
                {node.h >= 10 && (
                  <text
                    x={SVG_W - COL_W / 2}
                    y={node.y + node.h + 9}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#9ca3af"
                    className="select-none"
                  >
                    {fmtVotes(node.votes)}
                  </text>
                )}
              </g>
            ))}

            {/* Tooltip overlay */}
            {tooltip.visible && (
              <g>
                <rect
                  x={ttX}
                  y={ttY}
                  width={TT_W}
                  height={TT_H}
                  rx={4}
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
                />
                {/* Color indicator strip */}
                <rect x={ttX} y={ttY} width={4} height={TT_H} rx={2} fill={tooltip.color} />
                {/* Party + year */}
                <text
                  x={ttX + 10}
                  y={ttY + 14}
                  fontSize={10}
                  fontWeight="700"
                  fill="#111827"
                  className="select-none"
                >
                  {tooltip.party}
                </text>
                <text
                  x={ttX + TT_W - 6}
                  y={ttY + 14}
                  fontSize={9}
                  fill="#6b7280"
                  textAnchor="end"
                  className="select-none"
                >
                  {tooltip.year}
                </text>
                {/* Votes */}
                <text x={ttX + 10} y={ttY + 28} fontSize={9} fill="#374151" className="select-none">
                  Votes: {tooltip.votes.toLocaleString()}
                </text>
                {/* Vote share */}
                <text x={ttX + 10} y={ttY + 42} fontSize={9} fill="#374151" className="select-none">
                  Vote share: {tooltip.pct.toFixed(1)}%
                </text>
                {/* Ribbon: prev election comparison */}
                {tooltip.isRibbon && tooltip.prevVotes !== undefined && (
                  <>
                    <text
                      x={ttX + 10}
                      y={ttY + 57}
                      fontSize={9}
                      fill="#6b7280"
                      className="select-none"
                    >
                      {tooltip.prevYear}: {tooltip.prevVotes.toLocaleString()} votes
                    </text>
                    <text
                      x={ttX + 10}
                      y={ttY + 70}
                      fontSize={9}
                      fontWeight="600"
                      fill={tooltip.votes > (tooltip.prevVotes ?? 0) ? '#16a34a' : '#dc2626'}
                      className="select-none"
                    >
                      {tooltip.votes > (tooltip.prevVotes ?? 0) ? '▲' : '▼'}{' '}
                      {Math.abs(tooltip.votes - (tooltip.prevVotes ?? 0)).toLocaleString()} votes
                    </text>
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t">
          {Array.from(legendMap.entries()).map(([party, color]) => (
            <div key={party} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{party}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
          Block height = votes. Ribbons connect the same party across elections. Parties with no
          ribbon are new entrants or did not contest.
        </p>
      </CardContent>
    </Card>
  )
}
