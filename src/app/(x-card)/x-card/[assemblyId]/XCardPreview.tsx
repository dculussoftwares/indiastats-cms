'use client'

import React from 'react'
import { identifyBloc } from '@/utilities/blocs'

// ─── Types ───────────────────────────────────────────────────
interface ElectionResult {
  year: number
  winner: string
  winnerParty: string
  winnerVotes: number
  runnerUp: string
  runnerUpParty: string
  runnerUpVotes: number
  margin: number
  totalVoters: number
  votesPolled: number
  turnout: number
  candidates: { name: string; party: string; votes: number }[]
}

interface CardData {
  assemblyId: string
  stateCode?: string
  name: string
  districtName: string
  districtId: string
  isReserved: boolean
  voters: { male: number; female: number; total: number } | null
  lastElectionVoters: { total: number } | null
  electionHistory: ElectionResult[]
  topCastes: { name: string; percentage: number }[]
  allianceData: Record<number, { allianceName: string; parties: { partyName: string }[] }[]>
}

interface Props {
  data: CardData
  selectedTemplate?: string
}

// ─── Helpers ─────────────────────────────────────────────────

const getLeaderImage = (partyName: string): string | null => {
  if (partyName === 'ADMK' || partyName === 'AIADMK') return '/images/EPS.jpg'
  if (partyName === 'DMK') return '/images/Stalin.png'
  if (partyName === 'INC' || partyName === 'CONG') return '/images/karkae.jpg'
  if (partyName === 'BJP') return '/images/modi.png'
  if (partyName === 'PMK') return '/images/PMK.jpg'
  return null
}

const formatNum = (n: number) => {
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString('en-IN')
}

const formatBreakdown = (breakdown: Record<string, number>) => {
  return Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([party, wins]) => `${party}(${wins})`)
    .join(', ')
}

const cleanName = (name: string) => {
  const parts = name.split(' / ')
  return parts.length > 1 ? parts[1].trim() : name.trim()
}

const CASTE_COLORS = ['#dc2626', '#f59e0b', '#2563eb']

// ─── SVG Chart Components (Puppeteer-compatible) ─────────────
const DonutChart = ({
  segments,
  size = 100,
  strokeWidth = 14,
  centerLabel,
  centerSub,
  dark = false,
}: {
  segments: { value: number; color: string; label?: string }[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerSub?: string
  dark?: boolean
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={dark ? '#1e293b' : '#f1f5f9'}
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const pct = seg.value / total
        const dash = pct * circumference
        const gap = circumference - dash
        const rot = (offset / total) * 360 - 90
        offset += seg.value
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rot} ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        )
      })}
      {centerLabel && (
        <>
          <text
            x={size / 2}
            y={size / 2 - 4}
            textAnchor="middle"
            fill={dark ? '#f8fafc' : '#111827'}
            fontSize={size * 0.22}
            fontWeight="900"
            fontFamily={fontBase}
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text
              x={size / 2}
              y={size / 2 + 14}
              textAnchor="middle"
              fill={dark ? '#64748b' : '#94a3b8'}
              fontSize={size * 0.11}
              fontWeight="600"
              fontFamily={fontBase}
            >
              {centerSub}
            </text>
          )}
        </>
      )}
    </svg>
  )
}

const SemiCircleGauge = ({
  value,
  max,
  color,
  label,
  size = 100,
  dark = false,
}: {
  value: number
  max: number
  color: string
  label: string
  size?: number
  dark?: boolean
}) => {
  const radius = (size - 12) / 2
  const halfCirc = Math.PI * radius
  const pct = Math.min(value / (max || 1), 1)

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size / 2 + 8} viewBox={`0 0 ${size} ${size / 2 + 8}`}>
        <path
          d={`M 6,${size / 2 + 2} A ${radius},${radius} 0 0 1 ${size - 6},${size / 2 + 2}`}
          fill="none"
          stroke={dark ? '#1e293b' : '#e2e8f0'}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M 6,${size / 2 + 2} A ${radius},${radius} 0 0 1 ${size - 6},${size / 2 + 2}`}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${pct * halfCirc} ${halfCirc}`}
        />
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          fill={dark ? '#f8fafc' : '#111827'}
          fontSize={size * 0.22}
          fontWeight="900"
          fontFamily={fontBase}
        >
          {value}%
        </text>
      </svg>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: dark ? '#94a3b8' : '#64748b',
          marginTop: -4,
        }}
      >
        {label}
      </div>
    </div>
  )
}

const MiniBarChart = ({
  bars,
  height = 80,
  dark = false,
}: {
  bars: { label: string; value: number; color: string }[]
  height?: number
  dark?: boolean
}) => {
  const maxVal = Math.max(...bars.map((b) => b.value), 1)
  const barWidth = Math.min(40, Math.floor(200 / bars.length) - 8)

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, height }}
    >
      {bars.map((b, i) => (
        <div
          key={i}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: b.color }}>{b.value}</span>
          <div
            style={{
              width: barWidth,
              height: Math.max((b.value / maxVal) * (height - 30), 4),
              backgroundColor: b.color,
              borderRadius: '4px 4px 0 0',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: dark ? '#94a3b8' : '#64748b',
              maxWidth: barWidth + 10,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function deriveStats(data: CardData) {
  const elections = data.electionHistory
    .filter((e) => e.year >= 1977)
    .sort((a, b) => a.year - b.year)
  const partyWins: Record<string, number> = {}
  let dmkBlocWins = 0
  let aiadmkBlocWins = 0
  const dmkBlocBreakdown: Record<string, number> = {}
  const aiadmkBlocBreakdown: Record<string, number> = {}

  elections.forEach((e) => {
    partyWins[e.winnerParty] = (partyWins[e.winnerParty] || 0) + 1
    const bloc = identifyBloc(e.winnerParty, e.year, data.stateCode || 'TN', data.allianceData)
    if (bloc === 'dmk') {
      dmkBlocWins++
      dmkBlocBreakdown[e.winnerParty] = (dmkBlocBreakdown[e.winnerParty] || 0) + 1
    }
    if (bloc === 'aiadmk') {
      aiadmkBlocWins++
      aiadmkBlocBreakdown[e.winnerParty] = (aiadmkBlocBreakdown[e.winnerParty] || 0) + 1
    }
  })

  const sortedParties = Object.entries(partyWins).sort((a, b) => b[1] - a[1])
  const party1 = sortedParties[0] ? { name: sortedParties[0][0], wins: sortedParties[0][1] } : null
  const party2 = sortedParties[1] ? { name: sortedParties[1][0], wins: sortedParties[1][1] } : null

  const voterGrowth =
    data.voters?.total && data.lastElectionVoters?.total
      ? ((data.voters.total - data.lastElectionVoters.total) / data.lastElectionVoters.total) * 100
      : null

  const winDiff = party1 && party2 ? party1.wins - party2.wins : 0

  return {
    elections,
    partyWins,
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  }
}

type Stats = ReturnType<typeof deriveStats>

// ─── Shared sub-components ───────────────────────────────────
const fontBase =
  'var(--font-geist-sans), "Geist Sans", "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const cardBase: React.CSSProperties = {
  width: 600,
  minWidth: 600,
  overflow: 'hidden',
  fontFamily: fontBase,
}

const Logo = ({ light = false }: { light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      <div
        style={{
          width: 6,
          height: 10,
          backgroundColor: light ? '#fca5a5' : '#dc2626',
          borderRadius: 1,
        }}
      />
      <div
        style={{
          width: 6,
          height: 16,
          backgroundColor: light ? '#fca5a5' : '#dc2626',
          borderRadius: 1,
        }}
      />
      <div
        style={{
          width: 6,
          height: 22,
          backgroundColor: light ? '#fca5a5' : '#dc2626',
          borderRadius: 1,
        }}
      />
    </div>
    <span
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: light ? '#ffffff' : '#111827',
        marginLeft: 4,
        lineHeight: 1,
      }}
    >
      IndiaStats
    </span>
    <span
      style={{ fontSize: 20, fontWeight: 400, color: light ? '#cbd5e1' : '#6b7280', lineHeight: 1 }}
    >
      .org
    </span>
  </div>
)

const Badge = ({
  isReserved,
  variant = 'light',
}: {
  isReserved: boolean
  variant?: 'light' | 'dark' | 'red'
}) => (
  <div
    style={{
      backgroundColor: isReserved
        ? '#dc2626'
        : variant === 'dark'
          ? '#374151'
          : variant === 'red'
            ? '#fef2f2'
            : '#f3f4f6',
      color: isReserved
        ? '#fff'
        : variant === 'dark'
          ? '#e5e7eb'
          : variant === 'red'
            ? '#991b1b'
            : '#374151',
      padding: '5px 12px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 1,
    }}
  >
    {isReserved ? 'RESERVED (SC/ST)' : 'GENERAL'}
  </div>
)

/* eslint-disable @next/next/no-img-element */
const LeaderCircle = ({
  party,
  size = 80,
  borderColor = '#ef4444',
  borderWidth = 3,
}: {
  party: string
  size?: number
  borderColor?: string
  borderWidth?: number
}) => {
  const leader = getLeaderImage(party)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: `${borderWidth}px solid ${borderColor}`,
        backgroundColor: '#374151',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {leader ? (
        <img src={leader} alt="" style={{ width: size, height: size, objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: size * 0.4, fontWeight: 800, color: borderColor }}>
          {party.charAt(0)}
        </span>
      )}
    </div>
  )
}

const PartyLogo = ({ party, size = 28 }: { party: string; size?: number }) => (
  <img
    src={`/images/${party}.png`}
    alt=""
    style={{ width: size, height: size * 0.75, objectFit: 'contain' }}
    onError={(e) => {
      ;(e.target as HTMLImageElement).style.display = 'none'
    }}
  />
)

// ─── Bloc Pills (reusable) ──────────────────────────────────
const BlocSection = ({
  dmkWins,
  aiadmkWins,
  dmkBreakdown,
  aiadmkBreakdown,
  variant = 'dark',
}: {
  dmkWins: number
  aiadmkWins: number
  dmkBreakdown: Record<string, number>
  aiadmkBreakdown: Record<string, number>
  variant?: 'dark' | 'light' | 'colored'
}) => {
  const isDark = variant === 'dark'
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 10,
          backgroundColor: isDark ? '#450a0a' : variant === 'colored' ? '#fef2f2' : '#fff',
          border: isDark ? '1px solid #7f1d1d' : '2px solid #fca5a5',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#fca5a5' : '#991b1b' }}>
              DMK Bloc
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#ef4444' : '#dc2626' }}>
            {dmkWins}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isDark ? '#fca5a5' : '#6b7280',
            lineHeight: 1.4,
            display: 'block',
          }}
        >
          {formatBreakdown(dmkBreakdown)}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 10,
          backgroundColor: isDark ? '#052e16' : variant === 'colored' ? '#f0fdf4' : '#fff',
          border: isDark ? '1px solid #14532d' : '2px solid #86efac',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#86efac' : '#14532d' }}>
              AIADMK Bloc
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#22c55e' : '#16a34a' }}>
            {aiadmkWins}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isDark ? '#86efac' : '#6b7280',
            lineHeight: 1.4,
            display: 'block',
          }}
        >
          {formatBreakdown(aiadmkBreakdown)}
        </span>
      </div>
    </div>
  )
}

// ─── Caste Section (reusable) ───────────────────────────────
const CasteSection = ({
  castes,
  variant = 'dark',
}: {
  castes: { name: string; percentage: number }[]
  variant?: 'dark' | 'light'
}) => {
  if (castes.length === 0) return null
  const isDark = variant === 'dark'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        {castes.map((c, i) => (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
          >
            <div
              style={{
                width: 32,
                height: 5,
                borderRadius: 3,
                backgroundColor: CASTE_COLORS[i],
                marginBottom: 8,
              }}
            />
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#111827',
                lineHeight: 1,
              }}
            >
              {c.percentage}%
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: isDark ? '#d1d5db' : '#4b5563',
                marginTop: 4,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Voter Stats (reusable) ─────────────────────────────────
const VoterStats = ({
  voters,
  voterGrowth,
  variant = 'light',
}: {
  voters: { male: number; female: number; total: number } | null
  voterGrowth: number | null
  variant?: 'light' | 'dark' | 'inline'
}) => {
  if (!voters) return null
  if (variant === 'inline') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Voters
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>
            {formatNum(voters.total)}
          </span>
          {voterGrowth !== null && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: voterGrowth > 0 ? '#4ade80' : '#f87171',
              }}
            >
              {voterGrowth > 0 ? '+' : ''}
              {voterGrowth.toFixed(1)}%
            </span>
          )}
        </div>
        <div style={{ width: 1, height: 20, backgroundColor: '#334155' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa' }}>
          {formatNum(voters.male)} Male
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#f472b6' }}>
          {formatNum(voters.female)} Female
        </span>
      </div>
    )
  }
  const isDark = variant === 'dark'
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div
        style={{
          flex: 1,
          backgroundColor: isDark ? '#1e293b' : '#f9fafb',
          borderRadius: 10,
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isDark ? '#94a3b8' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Total Voters
          </span>
          {voterGrowth !== null && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                backgroundColor:
                  voterGrowth > 0
                    ? isDark
                      ? '#052e16'
                      : '#d1fae5'
                    : isDark
                      ? '#450a0a'
                      : '#fee2e2',
                color:
                  voterGrowth > 0
                    ? isDark
                      ? '#4ade80'
                      : '#059669'
                    : isDark
                      ? '#f87171'
                      : '#dc2626',
              }}
            >
              {voterGrowth > 0 ? '+' : ''}
              {voterGrowth.toFixed(1)}%
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: isDark ? '#f8fafc' : '#111827',
            display: 'block',
            marginTop: 2,
          }}
        >
          {formatNum(voters.total)}
        </span>
      </div>
      <div
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fee2e2',
          borderRadius: 10,
          padding: '10px 14px',
          minWidth: 90,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? '#60a5fa' : '#dc2626',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            display: 'block',
          }}
        >
          Male
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: isDark ? '#93c5fd' : '#dc2626',
            display: 'block',
            marginTop: 2,
          }}
        >
          {formatNum(voters.male)}
        </span>
      </div>
      <div
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fce7f3',
          borderRadius: 10,
          padding: '10px 14px',
          minWidth: 90,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isDark ? '#f472b6' : '#db2777',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            display: 'block',
          }}
        >
          Female
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: isDark ? '#f9a8d4' : '#db2777',
            display: 'block',
            marginTop: 2,
          }}
        >
          {formatNum(voters.female)}
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 1: BOLD CLASSIC (White bg, high contrast, clean)
// ═══════════════════════════════════════════════════════════════
function BoldClassic({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ height: 6, backgroundColor: '#dc2626' }} />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Logo />
        <Badge isReserved={data.isReserved} />
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Assembly name */}
        <div style={{ borderLeft: '5px solid #dc2626', paddingLeft: 14, marginBottom: 18 }}>
          <h2
            style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.1 }}
          >
            {data.name}
          </h2>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#6b7280', margin: '4px 0 0 0' }}>
            {cleanName(data.districtName)} District, Tamil Nadu
          </p>
        </div>

        {/* Dark panel - Party face-off */}
        <div
          style={{
            backgroundColor: '#111827',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 2,
              textAlign: 'center',
              margin: '0 0 14px 0',
            }}
          >
            MOST WINNING PARTIES (1977-2021)
          </p>

          {party1 && party2 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              {/* Party 1 */}
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
              >
                <LeaderCircle party={party1.name} size={80} borderColor="#ef4444" borderWidth={4} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <PartyLogo party={party1.name} size={28} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                    {party1.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    color: '#ef4444',
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  {party1.wins}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>wins</span>
              </div>

              {/* VS */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  margin: '0 8px',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#374151',
                    border: '2px solid #4b5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>VS</span>
                </div>
                {winDiff > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                    +{winDiff}
                  </span>
                )}
              </div>

              {/* Party 2 */}
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
              >
                <LeaderCircle party={party2.name} size={80} borderColor="#6b7280" borderWidth={4} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <PartyLogo party={party2.name} size={28} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#d1d5db' }}>
                    {party2.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    color: '#d1d5db',
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  {party2.wins}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>wins</span>
              </div>
            </div>
          )}

          {/* Bloc pills */}
          <div style={{ borderTop: '1px solid #374151', paddingTop: 14 }}>
            <BlocSection
              dmkWins={dmkBlocWins}
              aiadmkWins={aiadmkBlocWins}
              dmkBreakdown={dmkBlocBreakdown}
              aiadmkBreakdown={aiadmkBlocBreakdown}
              variant="dark"
            />
          </div>

          {/* Caste demographics */}
          {data.topCastes.length > 0 && (
            <div style={{ borderTop: '1px solid #374151', paddingTop: 14, marginTop: 14 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  textAlign: 'center',
                  margin: '0 0 12px 0',
                }}
              >
                KEY DEMOGRAPHICS (EST.)
              </p>
              <CasteSection castes={data.topCastes} variant="dark" />
            </div>
          )}
        </div>

        {/* Voter stats */}
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="light" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 2: RED BANNER (Bold red header, dramatic contrast)
// ═══════════════════════════════════════════════════════════════
function RedBanner({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Red header banner */}
      <div style={{ backgroundColor: '#dc2626', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <div style={{ width: 5, height: 8, backgroundColor: '#fca5a5', borderRadius: 1 }} />
                <div
                  style={{ width: 5, height: 14, backgroundColor: '#fca5a5', borderRadius: 1 }}
                />
                <div
                  style={{ width: 5, height: 20, backgroundColor: '#fca5a5', borderRadius: 1 }}
                />
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginLeft: 4,
                  lineHeight: 1,
                }}
              >
                IndiaStats.org
              </span>
            </div>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {data.name}
            </h2>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#fecaca', margin: '4px 0 0 0' }}>
              {cleanName(data.districtName)} District, Tamil Nadu
            </p>
          </div>
          <div
            style={{
              backgroundColor: data.isReserved ? '#ffffff' : 'rgba(255,255,255,0.2)',
              color: data.isReserved ? '#dc2626' : '#ffffff',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            {data.isReserved ? 'RESERVED (SC/ST)' : 'GENERAL'}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Party face-off - horizontal layout */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 12px 0',
          }}
        >
          MOST WINNING PARTIES (1977-2021)
        </p>

        {party1 && party2 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
            {/* Party 1 row */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fef2f2',
                borderRadius: 12,
                padding: '12px 14px',
                border: '2px solid #fecaca',
              }}
            >
              <LeaderCircle party={party1.name} size={64} borderColor="#dc2626" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PartyLogo party={party1.name} size={24} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                    {party1.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#dc2626' }}>{party1.wins}</span>
            </div>

            {/* VS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>VS</span>
              </div>
              {winDiff > 0 && (
                <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>
                  +{winDiff}
                </span>
              )}
            </div>

            {/* Party 2 row */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: '12px 14px',
                border: '2px solid #e5e7eb',
              }}
            >
              <LeaderCircle party={party2.name} size={64} borderColor="#6b7280" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PartyLogo party={party2.name} size={24} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#6b7280' }}>
                    {party2.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 38, fontWeight: 900, color: '#6b7280' }}>{party2.wins}</span>
            </div>
          </div>
        )}

        {/* Bloc pills */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="colored"
        />

        {/* Caste + Voter row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {/* Castes */}
          {data.topCastes.length > 0 && (
            <div
              style={{
                flex: 1,
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  margin: '0 0 10px 0',
                }}
              >
                Demographics (Est.)
              </p>
              {data.topCastes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: i < data.topCastes.length - 1 ? 8 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: CASTE_COLORS[i],
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', flex: 1 }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: CASTE_COLORS[i] }}>
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Voters */}
          <div
            style={{
              width: 200,
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 6px 0',
              }}
            >
              Voters
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>
                {data.voters ? formatNum(data.voters.total) : 'N/A'}
              </span>
              {voterGrowth !== null && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: voterGrowth > 0 ? '#059669' : '#dc2626',
                  }}
                >
                  {voterGrowth > 0 ? '+' : ''}
                  {voterGrowth.toFixed(1)}%
                </span>
              )}
            </div>
            {data.voters && (
              <>
                <div
                  style={{
                    display: 'flex',
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: `${(data.voters.male / data.voters.total) * 100}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                  <div
                    style={{
                      width: `${(data.voters.female / data.voters.total) * 100}%`,
                      backgroundColor: '#ec4899',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                    {formatNum(data.voters.male)} M
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#db2777' }}>
                    {formatNum(data.voters.female)} F
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 3: FULL DARK (Premium dark, bright accents)
// ═══════════════════════════════════════════════════════════════
function FullDark({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        border: '1px solid #1e293b',
      }}
    >
      {/* Gradient top bar */}
      <div
        style={{
          height: 5,
          background: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #22c55e 100%)',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Logo light />
        <Badge isReserved={data.isReserved} variant="dark" />
      </div>

      <div style={{ padding: '14px 20px' }}>
        {/* Assembly name */}
        <div style={{ borderLeft: '5px solid #dc2626', paddingLeft: 14, marginBottom: 18 }}>
          <h2
            style={{ fontSize: 30, fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: 1.1 }}
          >
            {data.name}
          </h2>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#64748b', margin: '4px 0 0 0' }}>
            {cleanName(data.districtName)} District, Tamil Nadu
          </p>
        </div>

        {/* Party face-off */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 14px 0',
          }}
        >
          MOST WINNING PARTIES (1977-2021)
        </p>

        {party1 && party2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div style={{ boxShadow: '0 0 24px rgba(239,68,68,0.5)', borderRadius: 44 }}>
                <LeaderCircle party={party1.name} size={80} borderColor="#ef4444" borderWidth={4} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <PartyLogo party={party1.name} size={28} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
                  {party1.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#ef4444',
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {party1.wins}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>wins</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 8px',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#1e293b',
                  border: '2px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0' }}>VS</span>
              </div>
              {winDiff > 0 && (
                <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                  +{winDiff}
                </span>
              )}
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div style={{ boxShadow: '0 0 16px rgba(148,163,184,0.3)', borderRadius: 44 }}>
                <LeaderCircle party={party2.name} size={80} borderColor="#64748b" borderWidth={4} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <PartyLogo party={party2.name} size={28} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>
                  {party2.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#94a3b8',
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {party2.wins}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>wins</span>
            </div>
          </div>
        )}

        {/* Bloc pills */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="dark"
        />

        {/* Caste demographics */}
        {data.topCastes.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e293b' }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 2,
                textAlign: 'center',
                margin: '0 0 12px 0',
              }}
            >
              KEY DEMOGRAPHICS (EST.)
            </p>
            <CasteSection castes={data.topCastes} variant="dark" />
          </div>
        )}
      </div>

      {/* Bottom ticker */}
      <div
        style={{ backgroundColor: '#1e293b', padding: '12px 20px', borderTop: '1px solid #334155' }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 4: NEWSPAPER (Clean editorial, two-column)
// ═══════════════════════════════════════════════════════════════
function Newspaper({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 0,
        border: '2px solid #111827',
      }}
    >
      {/* Masthead */}
      <div
        style={{
          borderBottom: '4px solid #111827',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Logo />
        <Badge isReserved={data.isReserved} variant="red" />
      </div>

      {/* Headline */}
      <div style={{ padding: '14px 20px 10px', borderBottom: '2px solid #111827' }}>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: '#111827',
            margin: 0,
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: -0.5,
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#dc2626', margin: '4px 0 0 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>
      </div>

      {/* Two column layout */}
      <div style={{ display: 'flex' }}>
        {/* Left column */}
        <div style={{ flex: 1, padding: '14px 16px 14px 20px', borderRight: '1px solid #d1d5db' }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: 2,
              margin: '0 0 12px 0',
              borderBottom: '2px solid #dc2626',
              paddingBottom: 4,
              display: 'inline-block',
            }}
          >
            Most Winning (1977-2021)
          </p>

          {party1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <LeaderCircle party={party1.name} size={60} borderColor="#dc2626" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PartyLogo party={party1.name} size={22} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                    {party1.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#dc2626' }}>{party1.wins}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>VS</span>
            </div>
            {winDiff > 0 && (
              <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>+{winDiff}</span>
            )}
            <div style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
          </div>

          {party2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              <LeaderCircle party={party2.name} size={60} borderColor="#9ca3af" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PartyLogo party={party2.name} size={22} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#6b7280' }}>
                    {party2.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#9ca3af' }}>{party2.wins}</span>
            </div>
          )}

          {/* Bloc pills */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #dc2626',
                padding: '8px 12px',
                marginBottom: 6,
                borderRadius: '0 8px 8px 0',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#991b1b' }}>DMK Bloc</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>
                  {dmkBlocWins}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
                {formatBreakdown(dmkBlocBreakdown)}
              </span>
            </div>
            <div
              style={{
                backgroundColor: '#f0fdf4',
                borderLeft: '4px solid #16a34a',
                padding: '8px 12px',
                borderRadius: '0 8px 8px 0',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: '#14532d' }}>AIADMK Bloc</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
                  {aiadmkBlocWins}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>
                {formatBreakdown(aiadmkBlocBreakdown)}
              </span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ width: 240, padding: '14px 20px 14px 16px' }}>
          {/* Voters */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#111827',
              textTransform: 'uppercase',
              letterSpacing: 2,
              margin: '0 0 8px 0',
              borderBottom: '2px solid #dc2626',
              paddingBottom: 4,
              display: 'inline-block',
            }}
          >
            Voter Stats
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: '#111827' }}>
              {data.voters ? formatNum(data.voters.total) : 'N/A'}
            </span>
            {voterGrowth !== null && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: voterGrowth > 0 ? '#d1fae5' : '#fee2e2',
                  color: voterGrowth > 0 ? '#059669' : '#dc2626',
                }}
              >
                {voterGrowth > 0 ? '+' : ''}
                {voterGrowth.toFixed(1)}%
              </span>
            )}
          </div>
          {data.voters && (
            <>
              <div
                style={{
                  display: 'flex',
                  height: 10,
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginBottom: 6,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    width: `${(data.voters.male / data.voters.total) * 100}%`,
                    backgroundColor: '#2563eb',
                  }}
                />
                <div
                  style={{
                    width: `${(data.voters.female / data.voters.total) * 100}%`,
                    backgroundColor: '#db2777',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                  {formatNum(data.voters.male)} M
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#db2777' }}>
                  {formatNum(data.voters.female)} F
                </span>
              </div>
            </>
          )}

          {/* Caste demographics */}
          {data.topCastes.length > 0 && (
            <>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#111827',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  margin: '0 0 10px 0',
                  borderBottom: '2px solid #dc2626',
                  paddingBottom: 4,
                  display: 'inline-block',
                }}
              >
                Demographics (Est.)
              </p>
              {data.topCastes.map((c, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 3,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: CASTE_COLORS[i] }}>
                      {c.percentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      backgroundColor: '#f1f5f9',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: 8,
                        width: `${Math.min(c.percentage * 2, 100)}%`,
                        backgroundColor: CASTE_COLORS[i],
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 5: SCOREBOARD (Sports-style, bold numbers)
// ═══════════════════════════════════════════════════════════════
function Scoreboard({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#111827', borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Score header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Logo light />
          <Badge isReserved={data.isReserved} variant="dark" />
        </div>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.1,
            textTransform: 'uppercase',
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fecaca', margin: '2px 0 0 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>
      </div>

      {/* Score display */}
      {party1 && party2 && (
        <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #1e293b' }}>
          {/* Party 1 score */}
          <div
            style={{
              flex: 1,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              backgroundColor: '#1e293b',
            }}
          >
            <LeaderCircle party={party1.name} size={64} borderColor="#ef4444" borderWidth={3} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PartyLogo party={party1.name} size={22} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                  {party1.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#ef4444',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {party1.wins}
              </span>
            </div>
          </div>

          {/* VS center */}
          <div
            style={{
              width: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900, color: '#475569' }}>VS</span>
            {winDiff > 0 && (
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
                +{winDiff}
              </span>
            )}
          </div>

          {/* Party 2 score */}
          <div
            style={{
              flex: 1,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              backgroundColor: '#1e293b',
              flexDirection: 'row-reverse',
            }}
          >
            <LeaderCircle party={party2.name} size={64} borderColor="#64748b" borderWidth={3} />
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
                  {party2.name}
                </span>
                <PartyLogo party={party2.name} size={22} />
              </div>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#94a3b8',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {party2.wins}
              </span>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        {/* Label */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center',
            margin: '12px 0',
          }}
        >
          WINS SINCE 1977
        </p>

        {/* Bloc pills */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="dark"
        />

        {/* Caste demographics */}
        {data.topCastes.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1e293b' }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 2,
                textAlign: 'center',
                margin: '0 0 10px 0',
              }}
            >
              KEY DEMOGRAPHICS (EST.)
            </p>
            <CasteSection castes={data.topCastes} variant="dark" />
          </div>
        )}
      </div>

      {/* Bottom voter bar */}
      <div
        style={{
          backgroundColor: '#0f172a',
          padding: '12px 20px',
          marginTop: 14,
          borderTop: '1px solid #1e293b',
        }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 6: DASHBOARD GRID (2x2 modular cards)
// ═══════════════════════════════════════════════════════════════
function DashboardGrid({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#f1f5f9', borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '3px solid #dc2626',
        }}
      >
        <Logo />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
            {data.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
            {cleanName(data.districtName)} District, Tamil Nadu
          </div>
        </div>
        <Badge isReserved={data.isReserved} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10 }}>
        {/* Top-left: Party Battle */}
        <div style={{ backgroundColor: '#111827', borderRadius: 12, padding: 14 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: '0 0 10px 0',
            }}
          >
            Most Winning (1977-2021)
          </p>
          {party1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <LeaderCircle party={party1.name} size={50} borderColor="#ef4444" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party1.name} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {party1.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#ef4444' }}>{party1.wins}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #4b5563',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 800, color: '#e2e8f0' }}>VS</span>
            </div>
            {winDiff > 0 && (
              <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444' }}>+{winDiff}</span>
            )}
            <div style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
          </div>
          {party2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <LeaderCircle party={party2.name} size={50} borderColor="#64748b" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party2.name} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>
                    {party2.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#94a3b8' }}>{party2.wins}</span>
            </div>
          )}
        </div>

        {/* Top-right: Bloc Performance */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 14,
            border: '1px solid #e2e8f0',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: '0 0 10px 0',
            }}
          >
            Alliance Performance
          </p>
          <div
            style={{
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #dc2626',
              padding: '10px 12px',
              borderRadius: '0 10px 10px 0',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#991b1b' }}>DMK Bloc</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>{dmkBlocWins}</span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#b91c1c',
                display: 'block',
                marginTop: 2,
              }}
            >
              {formatBreakdown(dmkBlocBreakdown)}
            </span>
          </div>
          <div
            style={{
              backgroundColor: '#f0fdf4',
              borderLeft: '4px solid #16a34a',
              padding: '10px 12px',
              borderRadius: '0 10px 10px 0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#14532d' }}>AIADMK Bloc</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>
                {aiadmkBlocWins}
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#15803d',
                display: 'block',
                marginTop: 2,
              }}
            >
              {formatBreakdown(aiadmkBlocBreakdown)}
            </span>
          </div>
        </div>

        {/* Bottom-left: Demographics with gauges */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 14,
            border: '1px solid #e2e8f0',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: '0 0 8px 0',
            }}
          >
            Key Demographics (Est.)
          </p>
          {data.topCastes.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {data.topCastes.map((c, i) => (
                <SemiCircleGauge
                  key={i}
                  value={c.percentage}
                  max={50}
                  color={CASTE_COLORS[i]}
                  label={c.name}
                  size={88}
                />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#94a3b8' }}>No data available</span>
          )}
        </div>

        {/* Bottom-right: Voter Stats */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 14,
            border: '1px solid #e2e8f0',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: '0 0 8px 0',
            }}
          >
            Voter Statistics
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#111827' }}>
              {data.voters ? formatNum(data.voters.total) : 'N/A'}
            </span>
            {voterGrowth !== null && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: voterGrowth > 0 ? '#d1fae5' : '#fee2e2',
                  color: voterGrowth > 0 ? '#059669' : '#dc2626',
                }}
              >
                {voterGrowth > 0 ? '+' : ''}
                {voterGrowth.toFixed(1)}%
              </span>
            )}
          </div>
          {data.voters && (
            <>
              <div
                style={{
                  display: 'flex',
                  height: 10,
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginBottom: 8,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    width: `${(data.voters.male / data.voters.total) * 100}%`,
                    backgroundColor: '#2563eb',
                  }}
                />
                <div
                  style={{
                    width: `${(data.voters.female / data.voters.total) * 100}%`,
                    backgroundColor: '#db2777',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#2563eb',
                      display: 'inline-block',
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#2563eb' }}>
                    {formatNum(data.voters.male)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>
                    Male
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#db2777',
                      display: 'inline-block',
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#db2777' }}>
                    {formatNum(data.voters.female)}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>
                    Female
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
// TEMPLATE 8: NEON PULSE (Dark with vivid neon borders)
// ═══════════════════════════════════════════════════════════════
function NeonPulse({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#020617',
        borderRadius: 12,
        border: '1px solid #1e293b',
        overflow: 'hidden',
      }}
    >
      {/* Neon top line */}
      <div
        style={{
          height: 3,
          background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7)',
        }}
      />

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #0f172a' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Logo light />
          <Badge isReserved={data.isReserved} variant="dark" />
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#f8fafc',
            margin: 0,
            lineHeight: 1,
            letterSpacing: -0.5,
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: '4px 0 0 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>
      </div>

      <div style={{ padding: '14px 20px' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 14px 0',
          }}
        >
          MOST WINNING PARTIES (1977-2021)
        </p>

        {party1 && party2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div
                style={{
                  padding: 4,
                  borderRadius: 48,
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  boxShadow: '0 0 30px rgba(239,68,68,0.4)',
                }}
              >
                <LeaderCircle party={party1.name} size={76} borderColor="#020617" borderWidth={3} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <PartyLogo party={party1.name} size={26} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                  {party1.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  color: '#ef4444',
                  lineHeight: 1,
                  marginTop: 2,
                  textShadow: '0 0 20px rgba(239,68,68,0.5)',
                }}
              >
                {party1.wins}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>wins</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 6px',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  border: '2px solid #334155',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 900, color: '#94a3b8' }}>VS</span>
              </div>
              {winDiff > 0 && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#ef4444',
                    marginTop: 4,
                    textShadow: '0 0 8px rgba(239,68,68,0.5)',
                  }}
                >
                  +{winDiff}
                </span>
              )}
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div
                style={{
                  padding: 4,
                  borderRadius: 48,
                  background: 'linear-gradient(135deg, #64748b, #94a3b8)',
                  boxShadow: '0 0 20px rgba(148,163,184,0.25)',
                }}
              >
                <LeaderCircle party={party2.name} size={76} borderColor="#020617" borderWidth={3} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <PartyLogo party={party2.name} size={26} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>
                  {party2.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  color: '#94a3b8',
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {party2.wins}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>wins</span>
            </div>
          </div>
        )}

        {/* Neon bloc cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: '#0f172a',
              border: '1px solid #ef4444',
              boxShadow: '0 0 12px rgba(239,68,68,0.15), inset 0 0 12px rgba(239,68,68,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5' }}>DMK Bloc</span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#ef4444',
                  textShadow: '0 0 10px rgba(239,68,68,0.5)',
                }}
              >
                {dmkBlocWins}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
              {formatBreakdown(dmkBlocBreakdown)}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              backgroundColor: '#0f172a',
              border: '1px solid #22c55e',
              boxShadow: '0 0 12px rgba(34,197,94,0.15), inset 0 0 12px rgba(34,197,94,0.05)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#86efac' }}>AIADMK Bloc</span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#22c55e',
                  textShadow: '0 0 10px rgba(34,197,94,0.5)',
                }}
              >
                {aiadmkBlocWins}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>
              {formatBreakdown(aiadmkBlocBreakdown)}
            </span>
          </div>
        </div>

        {/* Demographics row */}
        {data.topCastes.length > 0 && (
          <div
            style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid #1e293b' }}
          >
            {data.topCastes.map((c, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '8px 0',
                  borderRadius: 10,
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: CASTE_COLORS[i],
                    display: 'block',
                    textShadow: `0 0 12px ${CASTE_COLORS[i]}40`,
                  }}
                >
                  {c.percentage}%
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voter ticker */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0f172a, #1e293b)',
          padding: '12px 20px',
          borderTop: '1px solid #1e293b',
        }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 9: CHAMPIONSHIP (Gold/trophy themed, winner focus)
// ═══════════════════════════════════════════════════════════════
function Championship({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        border: '2px solid #d97706',
        overflow: 'hidden',
      }}
    >
      {/* Gold header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #78350f 0%, #92400e 30%, #b45309 60%, #d97706 100%)',
          padding: '16px 22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <div style={{ width: 6, height: 10, backgroundColor: '#fcd34d', borderRadius: 1 }} />
              <div style={{ width: 6, height: 16, backgroundColor: '#fcd34d', borderRadius: 1 }} />
              <div style={{ width: 6, height: 22, backgroundColor: '#fcd34d', borderRadius: 1 }} />
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#fef3c7',
                marginLeft: 4,
                lineHeight: 1,
              }}
            >
              IndiaStats
            </span>
            <span style={{ fontSize: 20, fontWeight: 400, color: '#d97706', lineHeight: 1 }}>
              .org
            </span>
          </div>
          <div
            style={{
              backgroundColor: data.isReserved ? '#dc2626' : 'rgba(254,243,199,0.2)',
              color: data.isReserved ? '#fff' : '#fef3c7',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {data.isReserved ? 'RESERVED (SC/ST)' : 'GENERAL'}
          </div>
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fef3c7', margin: 0, lineHeight: 1.1 }}>
          {data.name}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fbbf24', margin: '4px 0 0 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>
      </div>

      <div style={{ padding: '16px 22px' }}>
        {/* Champion spotlight */}
        {party1 && party2 && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16,
                padding: '14px 16px',
                backgroundColor: '#ffffff',
                borderRadius: 14,
                border: '2px solid #f59e0b',
                boxShadow: '0 4px 12px rgba(217,119,6,0.15)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <LeaderCircle party={party1.name} size={80} borderColor="#d97706" borderWidth={4} />
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fffbeb',
                  }}
                >
                  <span style={{ fontSize: 14 }}>&#9733;</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PartyLogo party={party1.name} size={26} />
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>
                    {party1.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#92400e',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Most Wins (1977-2021)
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: 50,
                    fontWeight: 900,
                    color: '#b45309',
                    lineHeight: 1,
                    display: 'block',
                  }}
                >
                  {party1.wins}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>wins</span>
              </div>
            </div>

            {/* Runner up */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 16,
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
              }}
            >
              <LeaderCircle party={party2.name} size={52} borderColor="#9ca3af" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party2.name} size={20} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#6b7280' }}>
                    {party2.name}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginLeft: 4 }}>
                    Runner Up
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#9ca3af' }}>{party2.wins}</span>
              {winDiff > 0 && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#b45309',
                    backgroundColor: '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  +{winDiff}
                </span>
              )}
            </div>
          </>
        )}

        {/* Blocs */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="colored"
        />

        {/* Demographics + voters */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 14,
            paddingTop: 14,
            borderTop: '2px solid #fde68a',
          }}
        >
          {data.topCastes.length > 0 && (
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#92400e',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  margin: '0 0 8px 0',
                }}
              >
                Demographics (Est.)
              </p>
              {data.topCastes.map((c, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: CASTE_COLORS[i],
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', flex: 1 }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: CASTE_COLORS[i] }}>
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ width: 1, backgroundColor: '#fde68a' }} />
          <div style={{ width: 150 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#92400e',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 6px 0',
              }}
            >
              Voters
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#111827' }}>
                {data.voters ? formatNum(data.voters.total) : 'N/A'}
              </span>
              {voterGrowth !== null && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: voterGrowth > 0 ? '#059669' : '#dc2626',
                  }}
                >
                  {voterGrowth > 0 ? '+' : ''}
                  {voterGrowth.toFixed(1)}%
                </span>
              )}
            </div>
            {data.voters && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginRight: 8 }}>
                  {formatNum(data.voters.male)} M
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#db2777' }}>
                  {formatNum(data.voters.female)} F
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 10: BREAKING NEWS (TV ticker / lower-third style)
// ═══════════════════════════════════════════════════════════════
function BreakingNews({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#0c1222',
        borderRadius: 0,
        overflow: 'hidden',
        border: '2px solid #1e293b',
      }}
    >
      {/* Breaking news bar */}
      <div
        style={{
          backgroundColor: '#dc2626',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          ELECTION DATA
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <Logo light />
      </div>

      {/* Assembly name banner */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
          padding: '14px 20px',
          borderBottom: '3px solid #dc2626',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {data.name}
            </h2>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '4px 0 0 0' }}>
              {cleanName(data.districtName)} District, Tamil Nadu
            </p>
          </div>
          <Badge isReserved={data.isReserved} variant="dark" />
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '14px 20px' }}>
        {/* Score strip */}
        {party1 && party2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              marginBottom: 14,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #1e293b',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                backgroundColor: '#1e293b',
              }}
            >
              <LeaderCircle party={party1.name} size={56} borderColor="#ef4444" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party1.name} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                    {party1.name}
                  </span>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#dc2626',
                  padding: '8px 14px',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#ffffff',
                    lineHeight: 1,
                    display: 'block',
                  }}
                >
                  {party1.wins}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fecaca',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  WINS
                </span>
              </div>
            </div>

            <div
              style={{
                width: 44,
                backgroundColor: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: '#475569' }}>VS</span>
              {winDiff > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>+{winDiff}</span>
              )}
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                backgroundColor: '#1e293b',
                flexDirection: 'row-reverse',
              }}
            >
              <LeaderCircle party={party2.name} size={56} borderColor="#64748b" borderWidth={3} />
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>
                    {party2.name}
                  </span>
                  <PartyLogo party={party2.name} size={20} />
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#374151',
                  padding: '8px 14px',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#e2e8f0',
                    lineHeight: 1,
                    display: 'block',
                  }}
                >
                  {party2.wins}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  WINS
                </span>
              </div>
            </div>
          </div>
        )}

        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center',
            margin: '0 0 10px 0',
          }}
        >
          ALLIANCE PERFORMANCE (1977-2021)
        </p>

        {/* Bloc pills */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="dark"
        />

        {/* Demographics strip */}
        {data.topCastes.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #1e293b',
            }}
          >
            {data.topCastes.map((c, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: '#1e293b',
                  borderRadius: 8,
                  padding: '8px 12px',
                  textAlign: 'center',
                  borderTop: `3px solid ${CASTE_COLORS[i]}`,
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', display: 'block' }}>
                  {c.percentage}%
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom ticker */}
      <div
        style={{
          backgroundColor: '#dc2626',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#fecaca',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          VOTERS
        </span>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
          {data.voters ? formatNum(data.voters.total) : 'N/A'}
        </span>
        {voterGrowth !== null && (
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fef3c7' }}>
            {voterGrowth > 0 ? '+' : ''}
            {voterGrowth.toFixed(1)}%
          </span>
        )}
        {data.voters && (
          <>
            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fecaca' }}>
              {formatNum(data.voters.male)} Male
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fecaca' }}>
              {formatNum(data.voters.female)} Female
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// TEMPLATE 12: STEEL FRAME (Industrial, metallic feel)
// ═══════════════════════════════════════════════════════════════
function SteelFrame({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#1a1a2e',
        borderRadius: 4,
        border: '2px solid #3a3a5c',
        overflow: 'hidden',
      }}
    >
      {/* Top bar with metallic gradient */}
      <div style={{ background: 'linear-gradient(90deg, #3a3a5c, #5a5a8c, #3a3a5c)', height: 4 }} />

      <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a4a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <div style={{ width: 6, height: 10, backgroundColor: '#7c7cac', borderRadius: 1 }} />
              <div style={{ width: 6, height: 16, backgroundColor: '#9c9ccc', borderRadius: 1 }} />
              <div style={{ width: 6, height: 22, backgroundColor: '#bcbcec', borderRadius: 1 }} />
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#e2e2ff',
                marginLeft: 4,
                lineHeight: 1,
              }}
            >
              IndiaStats
            </span>
            <span style={{ fontSize: 20, fontWeight: 400, color: '#6a6a9a', lineHeight: 1 }}>
              .org
            </span>
          </div>
          <div
            style={{
              backgroundColor: data.isReserved ? '#dc2626' : '#2a2a4a',
              color: data.isReserved ? '#fff' : '#9a9acc',
              padding: '5px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              border: '1px solid #4a4a7c',
            }}
          >
            {data.isReserved ? 'RESERVED (SC/ST)' : 'GENERAL'}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 20px' }}>
        {/* Assembly name */}
        <div style={{ borderLeft: '4px solid #7c7cac', paddingLeft: 14, marginBottom: 16 }}>
          <h2
            style={{ fontSize: 30, fontWeight: 900, color: '#e8e8ff', margin: 0, lineHeight: 1.1 }}
          >
            {data.name}
          </h2>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#6a6a9a', margin: '4px 0 0 0' }}>
            {cleanName(data.districtName)} District, Tamil Nadu
          </p>
        </div>

        {/* Party face-off in steel panels */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#6a6a9a',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 12px 0',
          }}
        >
          MOST WINNING PARTIES (1977-2021)
        </p>

        {party1 && party2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div
                style={{
                  border: '3px solid #7c7cac',
                  borderRadius: 44,
                  padding: 2,
                  background: 'linear-gradient(135deg, #3a3a5c, #2a2a4a)',
                }}
              >
                <LeaderCircle party={party1.name} size={72} borderColor="#1a1a2e" borderWidth={2} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <PartyLogo party={party1.name} size={26} />
                <span style={{ fontSize: 17, fontWeight: 700, color: '#e8e8ff' }}>
                  {party1.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#bcbcec',
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {party1.wins}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6a6a9a' }}>wins</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 8px',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, #3a3a5c, #2a2a4a)',
                  border: '2px solid #5a5a8c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 900, color: '#bcbcec' }}>VS</span>
              </div>
              {winDiff > 0 && (
                <span style={{ fontSize: 13, fontWeight: 800, color: '#bcbcec', marginTop: 4 }}>
                  +{winDiff}
                </span>
              )}
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div
                style={{
                  border: '3px solid #4a4a7c',
                  borderRadius: 44,
                  padding: 2,
                  background: 'linear-gradient(135deg, #3a3a5c, #2a2a4a)',
                }}
              >
                <LeaderCircle party={party2.name} size={72} borderColor="#1a1a2e" borderWidth={2} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <PartyLogo party={party2.name} size={26} />
                <span style={{ fontSize: 17, fontWeight: 700, color: '#9a9acc' }}>
                  {party2.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: '#6a6a9a',
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {party2.wins}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4a4a7c' }}>wins</span>
            </div>
          </div>
        )}

        {/* Blocs with donut chart */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
          <DonutChart
            size={100}
            strokeWidth={16}
            dark
            segments={[
              { value: dmkBlocWins, color: '#ef4444' },
              { value: aiadmkBlocWins, color: '#22c55e' },
            ]}
            centerLabel={`${dmkBlocWins + aiadmkBlocWins}`}
            centerSub="total"
          />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div
                  style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' }}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5' }}>DMK Bloc</span>
                <span
                  style={{ fontSize: 22, fontWeight: 900, color: '#ef4444', marginLeft: 'auto' }}
                >
                  {dmkBlocWins}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9a9acc', paddingLeft: 16 }}>
                {formatBreakdown(dmkBlocBreakdown)}
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div
                  style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' }}
                />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#86efac' }}>AIADMK Bloc</span>
                <span
                  style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', marginLeft: 'auto' }}
                >
                  {aiadmkBlocWins}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9a9acc', paddingLeft: 16 }}>
                {formatBreakdown(aiadmkBlocBreakdown)}
              </span>
            </div>
          </div>
        </div>

        {/* Caste with bar chart */}
        {data.topCastes.length > 0 && (
          <div style={{ paddingTop: 12, borderTop: '1px solid #2a2a4a' }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6a6a9a',
                textTransform: 'uppercase',
                letterSpacing: 2,
                textAlign: 'center',
                margin: '0 0 8px 0',
              }}
            >
              KEY DEMOGRAPHICS (EST.)
            </p>
            <MiniBarChart
              dark
              bars={data.topCastes.map((c, i) => ({
                label: c.name,
                value: c.percentage,
                color: CASTE_COLORS[i],
              }))}
              height={70}
            />
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #2a2a4a, #1a1a2e)',
          padding: '12px 20px',
          borderTop: '1px solid #3a3a5c',
        }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// TEMPLATE 14: HORIZON (Wide horizontal bars, data-heavy)
// ═══════════════════════════════════════════════════════════════
function Horizon({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats
  const totalBlocWins = dmkBlocWins + aiadmkBlocWins || 1

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Logo light />
        <Badge isReserved={data.isReserved} variant="dark" />
      </div>

      <div style={{ padding: '14px 20px' }}>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#f8fafc',
            margin: '0 0 2px 0',
            lineHeight: 1,
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: '0 0 16px 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>

        {/* Horizontal bar comparison */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 10px 0',
          }}
        >
          MOST WINNING PARTIES (1977-2021)
        </p>

        {party1 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <LeaderCircle party={party1.name} size={44} borderColor="#ef4444" borderWidth={2} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PartyLogo party={party1.name} size={20} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                  {party1.name}
                </span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', marginLeft: 'auto' }}>
                {party1.wins}
              </span>
            </div>
            <div
              style={{
                height: 14,
                backgroundColor: '#1e293b',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: 14,
                  width: `${Math.min((party1.wins / (party1.wins + (party2?.wins || 0))) * 100, 100)}%`,
                  backgroundColor: '#ef4444',
                  borderRadius: 7,
                  minWidth: 20,
                }}
              />
            </div>
          </div>
        )}

        {party2 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <LeaderCircle party={party2.name} size={44} borderColor="#64748b" borderWidth={2} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PartyLogo party={party2.name} size={20} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>
                  {party2.name}
                </span>
              </div>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#94a3b8', marginLeft: 'auto' }}>
                {party2.wins}
              </span>
              {winDiff > 0 && (
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>
                  (-{winDiff})
                </span>
              )}
            </div>
            <div
              style={{
                height: 14,
                backgroundColor: '#1e293b',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: 14,
                  width: `${Math.min((party2.wins / (party1?.wins || 1 + party2.wins)) * 100, 100)}%`,
                  backgroundColor: '#64748b',
                  borderRadius: 7,
                  minWidth: 20,
                }}
              />
            </div>
          </div>
        )}

        {/* Bloc horizontal bar */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 8px 0',
          }}
        >
          ALLIANCE BLOC WINS
        </p>
        <div
          style={{
            display: 'flex',
            height: 36,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: `${(dmkBlocWins / totalBlocWins) * 100}%`,
              backgroundColor: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 60,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>DMK {dmkBlocWins}</span>
          </div>
          <div
            style={{
              width: `${(aiadmkBlocWins / totalBlocWins) * 100}%`,
              backgroundColor: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 60,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
              AIADMK {aiadmkBlocWins}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>
            {formatBreakdown(dmkBlocBreakdown)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#86efac' }}>
            {formatBreakdown(aiadmkBlocBreakdown)}
          </span>
        </div>

        {/* Demographics bar */}
        {data.topCastes.length > 0 && (
          <>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 2,
                margin: '0 0 8px 0',
              }}
            >
              KEY DEMOGRAPHICS (EST.)
            </p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {data.topCastes.map((c, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: CASTE_COLORS[i] }}>
                      {c.percentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      backgroundColor: '#1e293b',
                      borderRadius: 5,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: 10,
                        width: `${Math.min(c.percentage * 2, 100)}%`,
                        backgroundColor: CASTE_COLORS[i],
                        borderRadius: 5,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Voter footer */}
      <div
        style={{ backgroundColor: '#1e293b', padding: '12px 20px', borderTop: '1px solid #334155' }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 15: TRICOLOR (India flag inspired - saffron/white/green)
// ═══════════════════════════════════════════════════════════════
function Tricolor({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      {/* Tricolor top stripe */}
      <div style={{ display: 'flex', height: 8 }}>
        <div style={{ flex: 1, backgroundColor: '#f97316' }} />
        <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
        <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <Badge isReserved={data.isReserved} />
        </div>
      </div>

      {/* Assembly title with saffron accent */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ borderLeft: '5px solid #f97316', paddingLeft: 14, marginBottom: 16 }}>
          <h2
            style={{ fontSize: 32, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.1 }}
          >
            {data.name}
          </h2>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280', margin: '4px 0 0 0' }}>
            {cleanName(data.districtName)} District, Tamil Nadu
          </p>
        </div>
      </div>

      {/* Three section layout */}
      <div style={{ display: 'flex' }}>
        {/* Left section - saffron tinted (parties) */}
        <div style={{ flex: 1, padding: '12px 16px 12px 22px', backgroundColor: '#fff7ed' }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#c2410c',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: '0 0 10px 0',
            }}
          >
            Most Winning (1977-2021)
          </p>
          {party1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <LeaderCircle party={party1.name} size={56} borderColor="#f97316" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party1.name} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {party1.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#c2410c' }}>{party1.wins}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#fed7aa' }} />
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>VS</span>
            </div>
            {winDiff > 0 && (
              <span style={{ fontSize: 12, fontWeight: 800, color: '#c2410c' }}>+{winDiff}</span>
            )}
            <div style={{ flex: 1, height: 1, backgroundColor: '#fed7aa' }} />
          </div>
          {party2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <LeaderCircle party={party2.name} size={56} borderColor="#9ca3af" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party2.name} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#6b7280' }}>
                    {party2.name}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#9ca3af' }}>{party2.wins}</span>
            </div>
          )}
        </div>

        {/* Middle section - white (blocs) */}
        <div style={{ width: 1, backgroundColor: '#e5e7eb' }} />
        <div style={{ width: 200, padding: '12px 16px', backgroundColor: '#ffffff' }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              margin: '0 0 8px 0',
            }}
          >
            Alliance Blocs
          </p>
          <div
            style={{
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #dc2626',
              padding: '8px 10px',
              borderRadius: '0 8px 8px 0',
              marginBottom: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#991b1b' }}>DMK</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>{dmkBlocWins}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
              {formatBreakdown(dmkBlocBreakdown)}
            </span>
          </div>
          <div
            style={{
              backgroundColor: '#f0fdf4',
              borderLeft: '4px solid #16a34a',
              padding: '8px 10px',
              borderRadius: '0 8px 8px 0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#14532d' }}>AIADMK</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>
                {aiadmkBlocWins}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>
              {formatBreakdown(aiadmkBlocBreakdown)}
            </span>
          </div>

          {/* Castes */}
          {data.topCastes.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
              {data.topCastes.map((c, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: CASTE_COLORS[i],
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>
                    {c.name}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: CASTE_COLORS[i] }}>
                    {c.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Green voter footer */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          padding: '12px 22px',
          borderTop: '2px solid #16a34a',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#14532d',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Voters
        </span>
        <span style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>
          {data.voters ? formatNum(data.voters.total) : 'N/A'}
        </span>
        {voterGrowth !== null && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: voterGrowth > 0 ? '#059669' : '#dc2626',
            }}
          >
            {voterGrowth > 0 ? '+' : ''}
            {voterGrowth.toFixed(1)}%
          </span>
        )}
        {data.voters && (
          <>
            <div style={{ width: 1, height: 18, backgroundColor: '#bbf7d0' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
              {formatNum(data.voters.male)} Male
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#db2777' }}>
              {formatNum(data.voters.female)} Female
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 16: ANALYTICS (Chart-heavy, data dashboard)
// ═══════════════════════════════════════════════════════════════
function Analytics({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden' }}
    >
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <Logo light />
        <Badge isReserved={data.isReserved} variant="dark" />
      </div>

      <div style={{ padding: '12px 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', margin: 0, lineHeight: 1 }}>
          {data.name}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '4px 0 14px 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>

        {/* Three-column chart row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          {/* Bloc donut */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 10,
              padding: 12,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 8px 0',
              }}
            >
              Bloc Wins
            </p>
            <DonutChart
              size={96}
              strokeWidth={14}
              dark
              segments={[
                { value: dmkBlocWins, color: '#ef4444' },
                { value: aiadmkBlocWins, color: '#22c55e' },
              ]}
              centerLabel={`${dmkBlocWins + aiadmkBlocWins}`}
              centerSub="total"
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>
                  DMK {dmkBlocWins}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#86efac' }}>
                  AIADMK {aiadmkBlocWins}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                {formatBreakdown(dmkBlocBreakdown)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                {formatBreakdown(aiadmkBlocBreakdown)}
              </span>
            </div>
          </div>

          {/* Party wins bar chart */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 10,
              padding: 12,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 8px 0',
              }}
            >
              Party Wins
            </p>
            {party1 && party2 && (
              <MiniBarChart
                dark
                height={100}
                bars={[
                  { label: party1.name, value: party1.wins, color: '#ef4444' },
                  { label: party2.name, value: party2.wins, color: '#64748b' },
                  ...Object.entries(stats.partyWins)
                    .filter(([p]) => p !== party1.name && p !== party2.name)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 2)
                    .map(([p, w]) => ({ label: p, value: w, color: '#475569' })),
                ]}
              />
            )}
          </div>

          {/* Demographics gauges */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 10,
              padding: 12,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 6px 0',
              }}
            >
              Demographics
            </p>
            {data.topCastes.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                {data.topCastes.map((c, i) => (
                  <SemiCircleGauge
                    key={i}
                    value={c.percentage}
                    max={50}
                    color={CASTE_COLORS[i]}
                    label={c.name}
                    size={80}
                    dark
                  />
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 12, color: '#64748b' }}>N/A</span>
            )}
          </div>
        </div>

        {/* Party face-off strip */}
        {party1 && party2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#1e293b',
              borderRadius: 10,
              padding: '10px 14px',
            }}
          >
            <LeaderCircle party={party1.name} size={52} borderColor="#ef4444" borderWidth={3} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PartyLogo party={party1.name} size={20} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                  {party1.name}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#ef4444' }}>{party1.wins}</span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>VS</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#94a3b8' }}>{party2.wins}</span>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>
                  {party2.name}
                </span>
                <PartyLogo party={party2.name} size={20} />
              </div>
            </div>
            <LeaderCircle party={party2.name} size={52} borderColor="#64748b" borderWidth={3} />
            {winDiff > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  top: -8,
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#ef4444',
                  backgroundColor: '#1e293b',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}
              >
                +{winDiff}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voter footer */}
      <div
        style={{
          backgroundColor: '#1e293b',
          padding: '12px 20px',
          marginTop: 12,
          borderTop: '1px solid #334155',
        }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 17: COMPARISON (Side-by-side face-off with progress)
// ═══════════════════════════════════════════════════════════════
function Comparison({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats
  const totalWins = (party1?.wins || 0) + (party2?.wins || 0) || 1

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ height: 5, backgroundColor: '#dc2626' }} />

      <div style={{ padding: '14px 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <Logo />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
              {data.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
              {cleanName(data.districtName)} District, Tamil Nadu
            </div>
          </div>
          <Badge isReserved={data.isReserved} />
        </div>

        {party1 && party2 && (
          <>
            {/* Leader images + names */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <LeaderCircle party={party1.name} size={64} borderColor="#dc2626" borderWidth={3} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PartyLogo party={party1.name} size={22} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                      {party1.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                    #{1} Most Wins
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>VS</span>
                </div>
                {winDiff > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>
                    +{winDiff}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                  flexDirection: 'row-reverse',
                }}
              >
                <LeaderCircle party={party2.name} size={64} borderColor="#94a3b8" borderWidth={3} />
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#64748b' }}>
                      {party2.name}
                    </span>
                    <PartyLogo party={party2.name} size={22} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>#{2}</span>
                </div>
              </div>
            </div>

            {/* Win comparison progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#dc2626' }}>
                  {party1.wins}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#94a3b8',
                    alignSelf: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Wins Since 1977
                </span>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#94a3b8' }}>
                  {party2.wins}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  height: 18,
                  borderRadius: 9,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: `${(party1.wins / totalWins) * 100}%`,
                    backgroundColor: '#dc2626',
                    borderRadius: '9px 0 0 9px',
                    minWidth: 20,
                  }}
                />
                <div
                  style={{
                    width: `${(party2.wins / totalWins) * 100}%`,
                    backgroundColor: '#94a3b8',
                    borderRadius: '0 9px 9px 0',
                    minWidth: 20,
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Bloc comparison bars */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div
            style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: 10, padding: '10px 12px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: '#991b1b' }}>DMK Bloc</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{dmkBlocWins}</span>
            </div>
            <div
              style={{ height: 8, backgroundColor: '#fecaca', borderRadius: 4, overflow: 'hidden' }}
            >
              <div
                style={{
                  height: 8,
                  width: `${(dmkBlocWins / (dmkBlocWins + aiadmkBlocWins || 1)) * 100}%`,
                  backgroundColor: '#dc2626',
                  borderRadius: 4,
                  minWidth: 8,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#b91c1c',
                marginTop: 4,
                display: 'block',
              }}
            >
              {formatBreakdown(dmkBlocBreakdown)}
            </span>
          </div>
          <div
            style={{ flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10, padding: '10px 12px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: '#14532d' }}>AIADMK Bloc</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                {aiadmkBlocWins}
              </span>
            </div>
            <div
              style={{ height: 8, backgroundColor: '#bbf7d0', borderRadius: 4, overflow: 'hidden' }}
            >
              <div
                style={{
                  height: 8,
                  width: `${(aiadmkBlocWins / (dmkBlocWins + aiadmkBlocWins || 1)) * 100}%`,
                  backgroundColor: '#16a34a',
                  borderRadius: 4,
                  minWidth: 8,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#15803d',
                marginTop: 4,
                display: 'block',
              }}
            >
              {formatBreakdown(aiadmkBlocBreakdown)}
            </span>
          </div>
        </div>

        {/* Bottom: demographics + voters */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '2px solid #f1f5f9' }}>
          {data.topCastes.length > 0 &&
            data.topCastes.map((c, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: CASTE_COLORS[i],
                    display: 'block',
                  }}
                >
                  {c.percentage}%
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{c.name}</span>
              </div>
            ))}
          <div style={{ width: 1, backgroundColor: '#e2e8f0' }} />
          <div style={{ width: 160 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                {data.voters ? formatNum(data.voters.total) : 'N/A'}
              </span>
              {voterGrowth !== null && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: voterGrowth > 0 ? '#059669' : '#dc2626',
                  }}
                >
                  {voterGrowth > 0 ? '+' : ''}
                  {voterGrowth.toFixed(1)}%
                </span>
              )}
            </div>
            {data.voters && (
              <div style={{ marginTop: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginRight: 6 }}>
                  {formatNum(data.voters.male)} M
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#db2777' }}>
                  {formatNum(data.voters.female)} F
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 18: SPOTLIGHT (Big leader focus, radial stats)
// ═══════════════════════════════════════════════════════════════
function Spotlight({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#111827', borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Title bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #dc2626, #991b1b)',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Logo light />
        <Badge isReserved={data.isReserved} variant="dark" />
      </div>

      <div style={{ padding: '14px 20px' }}>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: '#f8fafc',
            margin: '0 0 2px 0',
            lineHeight: 1,
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 16px 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>

        {/* Big leader spotlight with donut around it */}
        {party1 && party2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            {/* Party 1 with donut ring */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DonutChart
                size={110}
                strokeWidth={8}
                dark
                segments={[
                  { value: party1.wins, color: '#ef4444' },
                  { value: party2.wins, color: '#374151' },
                ]}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  overflow: 'hidden',
                  backgroundColor: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getLeaderImage(party1.name) ? (
                  <img
                    src={getLeaderImage(party1.name)!}
                    alt=""
                    style={{ width: 76, height: 76, objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 30, fontWeight: 900, color: '#ef4444' }}>
                    {party1.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <PartyLogo party={party1.name} size={26} />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>
                  {party1.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: '#ef4444',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {party1.wins}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                wins since 1977
              </span>
            </div>

            <div style={{ width: 1, height: 80, backgroundColor: '#1e293b' }} />

            {/* Party 2 compact */}
            <div style={{ textAlign: 'center' }}>
              <LeaderCircle party={party2.name} size={56} borderColor="#64748b" borderWidth={2} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                  justifyContent: 'center',
                }}
              >
                <PartyLogo party={party2.name} size={18} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
                  {party2.name}
                </span>
              </div>
              <span style={{ fontSize: 30, fontWeight: 900, color: '#94a3b8', lineHeight: 1 }}>
                {party2.wins}
              </span>
              {winDiff > 0 && (
                <div style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
                  -{winDiff}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blocs */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="dark"
        />

        {/* Demographics with gauges */}
        {data.topCastes.length > 0 && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {data.topCastes.map((c, i) => (
              <SemiCircleGauge
                key={i}
                value={c.percentage}
                max={50}
                color={CASTE_COLORS[i]}
                label={c.name}
                size={90}
                dark
              />
            ))}
          </div>
        )}
      </div>

      {/* Voter footer */}
      <div
        style={{ backgroundColor: '#0f172a', padding: '12px 20px', borderTop: '1px solid #1e293b' }}
      >
        <VoterStats voters={data.voters} voterGrowth={voterGrowth} variant="inline" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 20: ELECTION MAP (Clean infographic with visual bars)
// ═══════════════════════════════════════════════════════════════
function ElectionMap({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats
  const totalBloc = dmkBlocWins + aiadmkBlocWins || 1

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#fafaf9',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #d6d3d1',
      }}
    >
      {/* Clean header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '14px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #111827',
        }}
      >
        <Logo />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1 }}>
            {data.name}
          </h2>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#78716c', margin: '2px 0 0 0' }}>
            {cleanName(data.districtName)} District, Tamil Nadu
          </p>
        </div>
        <Badge isReserved={data.isReserved} />
      </div>

      <div style={{ padding: '16px 22px' }}>
        {/* Party battle with visual bar */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 12px 0',
          }}
        >
          Most Winning Parties (1977-2021)
        </p>

        {party1 && party2 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <LeaderCircle party={party1.name} size={60} borderColor="#dc2626" borderWidth={3} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PartyLogo party={party1.name} size={22} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                      {party1.name}
                    </span>
                  </div>
                </div>
                <span
                  style={{ fontSize: 38, fontWeight: 900, color: '#dc2626', marginLeft: 'auto' }}
                >
                  {party1.wins}
                </span>
              </div>

              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>VS</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                  flexDirection: 'row-reverse',
                }}
              >
                <LeaderCircle party={party2.name} size={60} borderColor="#78716c" borderWidth={3} />
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#78716c' }}>
                      {party2.name}
                    </span>
                    <PartyLogo party={party2.name} size={22} />
                  </div>
                </div>
                <span
                  style={{ fontSize: 38, fontWeight: 900, color: '#a8a29e', marginRight: 'auto' }}
                >
                  {party2.wins}
                </span>
              </div>
            </div>

            {/* Stacked bar */}
            <div
              style={{
                display: 'flex',
                height: 12,
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 4,
                border: '1px solid #d6d3d1',
              }}
            >
              <div
                style={{
                  width: `${(party1.wins / (party1.wins + party2.wins)) * 100}%`,
                  backgroundColor: '#dc2626',
                }}
              />
              <div
                style={{
                  width: `${(party2.wins / (party1.wins + party2.wins)) * 100}%`,
                  backgroundColor: '#a8a29e',
                }}
              />
            </div>
            {winDiff > 0 && (
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#dc2626',
                  textAlign: 'center',
                  margin: '0 0 12px 0',
                }}
              >
                {party1.name} leads by +{winDiff} wins
              </p>
            )}
          </>
        )}

        {/* Alliance split bar */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#111827',
            textTransform: 'uppercase',
            letterSpacing: 2,
            margin: '0 0 8px 0',
          }}
        >
          Alliance Bloc Wins
        </p>
        <div
          style={{
            display: 'flex',
            height: 32,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 6,
            border: '1px solid #d6d3d1',
          }}
        >
          <div
            style={{
              width: `${(dmkBlocWins / totalBloc) * 100}%`,
              backgroundColor: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 50,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>DMK {dmkBlocWins}</span>
          </div>
          <div
            style={{
              width: `${(aiadmkBlocWins / totalBloc) * 100}%`,
              backgroundColor: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 50,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
              AIADMK {aiadmkBlocWins}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c' }}>
            {formatBreakdown(dmkBlocBreakdown)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>
            {formatBreakdown(aiadmkBlocBreakdown)}
          </span>
        </div>

        {/* Demographics + Voters in columns */}
        <div style={{ display: 'flex', gap: 16, paddingTop: 14, borderTop: '2px solid #d6d3d1' }}>
          {data.topCastes.length > 0 && (
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#111827',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  margin: '0 0 8px 0',
                }}
              >
                Demographics (Est.)
              </p>
              {data.topCastes.map((c, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#44403c' }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: CASTE_COLORS[i] }}>
                      {c.percentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      backgroundColor: '#e7e5e4',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        width: `${Math.min(c.percentage * 2, 100)}%`,
                        backgroundColor: CASTE_COLORS[i],
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ width: 1, backgroundColor: '#d6d3d1' }} />
          <div style={{ width: 160 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#111827',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                margin: '0 0 8px 0',
              }}
            >
              Voters
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#111827' }}>
                {data.voters ? formatNum(data.voters.total) : 'N/A'}
              </span>
              {voterGrowth !== null && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: voterGrowth > 0 ? '#d1fae5' : '#fee2e2',
                    color: voterGrowth > 0 ? '#059669' : '#dc2626',
                  }}
                >
                  {voterGrowth > 0 ? '+' : ''}
                  {voterGrowth.toFixed(1)}%
                </span>
              )}
            </div>
            {data.voters && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                  {formatNum(data.voters.male)} M
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#db2777' }}>
                  {formatNum(data.voters.female)} F
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 21: FIGHT NIGHT (UFC/boxing poster — WHO DOMINATES?)
// ═══════════════════════════════════════════════════════════════
function FightNight({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
  } = stats
  const winner = dmkBlocWins >= aiadmkBlocWins ? 'DMK' : 'AIADMK'

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#000000', borderRadius: 0, overflow: 'hidden' }}
    >
      {/* Fight poster top */}
      <div
        style={{
          background: 'linear-gradient(180deg, #450a0a 0%, #000000 100%)',
          padding: '16px 24px 0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Logo light />
          <Badge isReserved={data.isReserved} variant="dark" />
        </div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#dc2626',
            textTransform: 'uppercase',
            letterSpacing: 4,
            margin: '0 0 4px 0',
          }}
        >
          WHO DOMINATES?
        </p>
        <h2
          style={{
            fontSize: 34,
            fontWeight: 900,
            color: '#ffffff',
            margin: '0 0 4px 0',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#71717a', margin: '0 0 14px 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>
      </div>

      {/* Fight card - dramatic face off */}
      {party1 && party2 && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            {/* Red corner */}
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #450a0a 0%, #1c1917 100%)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRight: '2px solid #dc2626',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#dc2626',
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  margin: '0 0 10px 0',
                }}
              >
                RED CORNER
              </p>
              <div style={{ boxShadow: '0 0 30px rgba(220,38,38,0.6)', borderRadius: 48 }}>
                <LeaderCircle party={party1.name} size={88} borderColor="#dc2626" borderWidth={4} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <PartyLogo party={party1.name} size={28} />
                <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
                  {party1.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: '#dc2626',
                  lineHeight: 1,
                  marginTop: 4,
                  textShadow: '0 0 30px rgba(220,38,38,0.5)',
                }}
              >
                {party1.wins}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#71717a' }}>WINS</span>
            </div>

            {/* VS center */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  background: 'linear-gradient(135deg, #dc2626, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid #000',
                  boxShadow: '0 0 20px rgba(220,38,38,0.5)',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>VS</span>
              </div>
              {winDiff > 0 && (
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#f59e0b',
                      textShadow: '0 0 8px rgba(245,158,11,0.5)',
                    }}
                  >
                    +{winDiff}
                  </span>
                </div>
              )}
            </div>

            {/* Blue corner */}
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(225deg, #1e293b 0%, #1c1917 100%)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: '2px solid #475569',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  margin: '0 0 10px 0',
                }}
              >
                BLUE CORNER
              </p>
              <div style={{ boxShadow: '0 0 20px rgba(100,116,139,0.4)', borderRadius: 48 }}>
                <LeaderCircle party={party2.name} size={88} borderColor="#64748b" borderWidth={4} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <PartyLogo party={party2.name} size={28} />
                <span style={{ fontSize: 20, fontWeight: 900, color: '#94a3b8' }}>
                  {party2.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: '#94a3b8',
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {party2.wins}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#71717a' }}>WINS</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div
        style={{ backgroundColor: '#0a0a0a', padding: '12px 20px', borderTop: '1px solid #27272a' }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              borderRadius: 8,
              padding: '8px 12px',
              borderLeft: '3px solid #dc2626',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fca5a5' }}>DMK Bloc</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>{dmkBlocWins}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>
              {formatBreakdown(dmkBlocBreakdown)}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              borderRadius: 8,
              padding: '8px 12px',
              borderLeft: '3px solid #22c55e',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#86efac' }}>AIADMK Bloc</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#22c55e' }}>
                {aiadmkBlocWins}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>
              {formatBreakdown(aiadmkBlocBreakdown)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {data.topCastes.map((c, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa' }}>
                <span style={{ color: CASTE_COLORS[i], fontWeight: 900 }}>{c.percentage}%</span>{' '}
                {c.name}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>
              {data.voters ? formatNum(data.voters.total) : 'N/A'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#71717a' }}>voters</span>
            {voterGrowth !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: voterGrowth > 0 ? '#4ade80' : '#f87171',
                }}
              >
                {voterGrowth > 0 ? '+' : ''}
                {voterGrowth.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom verdict */}
      <div
        style={{
          background: 'linear-gradient(90deg, #dc2626, #f59e0b)',
          padding: '8px 20px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          {winner} BLOC DOMINATES THIS CONSTITUENCY
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 22: DID YOU KNOW (Trivia/fact card, curiosity hook)
// ═══════════════════════════════════════════════════════════════
function DidYouKnow({ data, stats }: { data: CardData; stats: Stats }) {
  const { party1, dmkBlocWins, aiadmkBlocWins, dmkBlocBreakdown, voterGrowth, elections } = stats
  const streakParty = elections.length > 0 ? elections[elections.length - 1].winnerParty : ''
  let streak = 0
  for (let i = elections.length - 1; i >= 0; i--) {
    if (elections[i].winnerParty === streakParty) streak++
    else break
  }
  const dominance = party1 ? Math.round((party1.wins / elections.length) * 100) : 0

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#fffbeb',
        borderRadius: 16,
        overflow: 'hidden',
        border: '2px solid #f59e0b',
      }}
    >
      {/* Question mark header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 900, color: '#d97706' }}>?</span>
        </div>
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: 3,
              margin: 0,
            }}
          >
            DID YOU KNOW
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fef3c7', margin: '2px 0 0 0' }}>
            Facts about {data.name}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Logo light />
        </div>
      </div>

      <div style={{ padding: '18px 24px' }}>
        {/* Fact cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {/* Fact 1: Dominance */}
          {party1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: '12px 16px',
                border: '1px solid #fde68a',
              }}
            >
              <LeaderCircle party={party1.name} size={56} borderColor="#d97706" borderWidth={3} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', display: 'block' }}>
                  {party1.name} has won{' '}
                  <span style={{ color: '#d97706', fontSize: 22 }}>{dominance}%</span> of all
                  elections
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                  {party1.wins} out of {elections.length} elections since 1977
                </span>
              </div>
            </div>
          )}

          {/* Fact 2: Streak */}
          {streak > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: '12px 16px',
                border: '1px solid #fde68a',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 900, color: '#d97706' }}>{streak}</span>
              </div>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', display: 'block' }}>
                  {streakParty} is on a{' '}
                  <span style={{ color: '#dc2626' }}>{streak}-election winning streak</span>!
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                  Consecutive wins in the last {streak} elections
                </span>
              </div>
            </div>
          )}

          {/* Fact 3: Bloc battle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '12px 16px',
              border: '1px solid #fde68a',
            }}
          >
            <DonutChart
              size={56}
              strokeWidth={10}
              segments={[
                { value: dmkBlocWins, color: '#dc2626' },
                { value: aiadmkBlocWins, color: '#16a34a' },
              ]}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', display: 'block' }}>
                {dmkBlocWins > aiadmkBlocWins ? 'DMK' : 'AIADMK'} bloc leads{' '}
                <span style={{ color: '#dc2626' }}>{Math.abs(dmkBlocWins - aiadmkBlocWins)}</span>{' '}
                wins ahead!
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                DMK: {dmkBlocWins} vs AIADMK: {aiadmkBlocWins} ({formatBreakdown(dmkBlocBreakdown)})
              </span>
            </div>
          </div>

          {/* Fact 4: Voter growth */}
          {voterGrowth !== null && data.voters && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: '#ffffff',
                borderRadius: 12,
                padding: '12px 16px',
                border: '1px solid #fde68a',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: voterGrowth > 0 ? '#d1fae5' : '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: voterGrowth > 0 ? '#059669' : '#dc2626',
                  }}
                >
                  {voterGrowth > 0 ? '+' : ''}
                  {voterGrowth.toFixed(0)}%
                </span>
              </div>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', display: 'block' }}>
                  Voter count {voterGrowth > 0 ? 'surged' : 'dropped'} to{' '}
                  <span style={{ color: '#d97706' }}>{formatNum(data.voters.total)}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                  {formatNum(data.voters.male)} Male, {formatNum(data.voters.female)} Female
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Caste row */}
        {data.topCastes.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
              paddingTop: 12,
              borderTop: '2px solid #fde68a',
            }}
          >
            {data.topCastes.map((c, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: CASTE_COLORS[i],
                    display: 'block',
                  }}
                >
                  {c.percentage}%
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#fef3c7',
          padding: '8px 24px',
          textAlign: 'center',
          borderTop: '1px solid #fde68a',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
          Source: IndiaStats.org | {cleanName(data.districtName)} District, Tamil Nadu
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', marginLeft: 8 }}>
          {data.isReserved ? 'Reserved (SC/ST)' : 'General'}
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 23: VERDICT (Courtroom split-verdict — clean, dramatic)
// ═══════════════════════════════════════════════════════════════
function Verdict({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
    elections,
  } = stats
  const totalElections = elections.length

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Gold verdict banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          padding: '16px 24px 14px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Logo light />
          <Badge isReserved={data.isReserved} />
        </div>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 20px',
            borderRadius: 4,
            backgroundColor: '#f59e0b',
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: '#1a1a2e',
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            THE VERDICT
          </span>
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#f8fafc',
            margin: '4px 0 2px',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>
      </div>

      {/* Face-off — symmetrical centered */}
      {party1 && party2 && (
        <div style={{ display: 'flex', alignItems: 'stretch', padding: '20px 16px 16px' }}>
          {/* Winner side */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 8px',
              backgroundColor: '#fefce8',
              borderRadius: 12,
              border: '2px solid #f59e0b',
            }}
          >
            <div style={{ position: 'relative' }}>
              <LeaderCircle party={party1.name} size={80} borderColor="#f59e0b" borderWidth={4} />
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#f59e0b',
                  borderRadius: 4,
                  padding: '1px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#1a1a2e',
                    textTransform: 'uppercase',
                  }}
                >
                  Winner
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <PartyLogo party={party1.name} size={28} />
              <span style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e' }}>{party1.name}</span>
            </div>
            <span
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: '#b45309',
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {party1.wins}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
              wins out of {totalElections}
            </span>
          </div>

          {/* VS divider */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
            }}
          >
            <div style={{ width: 2, flex: 1, backgroundColor: '#e2e8f0' }} />
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#1a1a2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '8px 0',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 900, color: '#f59e0b' }}>VS</span>
            </div>
            {winDiff > 0 && (
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>
                +{winDiff}
              </span>
            )}
            <div style={{ width: 2, flex: 1, backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Runner-up side */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px 8px',
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ position: 'relative' }}>
              <LeaderCircle party={party2.name} size={80} borderColor="#94a3b8" borderWidth={3} />
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#94a3b8',
                  borderRadius: 4,
                  padding: '1px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    textTransform: 'uppercase',
                  }}
                >
                  Runner Up
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <PartyLogo party={party2.name} size={28} />
              <span style={{ fontSize: 20, fontWeight: 900, color: '#475569' }}>{party2.name}</span>
            </div>
            <span
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: '#94a3b8',
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {party2.wins}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
              wins out of {totalElections}
            </span>
          </div>
        </div>
      )}

      {/* Alliance blocs — horizontal pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fef2f2',
            borderRadius: 10,
            padding: '10px 12px',
            border: '1px solid #fecaca',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>{dmkBlocWins}</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#dc2626' }}>DMK Bloc</span>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', lineHeight: 1.3 }}>
              {formatBreakdown(dmkBlocBreakdown)}
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#f0fdf4',
            borderRadius: 10,
            padding: '10px 12px',
            border: '1px solid #bbf7d0',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>{aiadmkBlocWins}</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>AIADMK Bloc</span>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', lineHeight: 1.3 }}>
              {formatBreakdown(aiadmkBlocBreakdown)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — castes + voters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {data.topCastes.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CASTE_COLORS[i] }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{c.name}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: CASTE_COLORS[i] }}>
              {c.percentage}%
            </span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 17, fontWeight: 900, color: '#1a1a2e' }}>
          {data.voters ? formatNum(data.voters.total) : 'N/A'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>voters</span>
        {voterGrowth !== null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: voterGrowth > 0 ? '#16a34a' : '#dc2626',
            }}
          >
            {voterGrowth > 0 ? '+' : ''}
            {voterGrowth.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 24: POWER RANKING (Tier list / ranking card)
// ═══════════════════════════════════════════════════════════════
function PowerRanking({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    partyWins,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
    elections,
  } = stats
  const sortedParties = Object.entries(partyWins).sort(([, a], [, b]) => b - a)
  const maxWins = sortedParties[0]?.[1] || 1
  const totalElections = elections.length

  return (
    <div
      data-card
      style={{ ...cardBase, backgroundColor: '#111827', borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(90deg, #dc2626, #991b1b)',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Logo light />
        <Badge isReserved={data.isReserved} variant="dark" />
      </div>

      <div style={{ padding: '14px 20px' }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#f8fafc',
            margin: '0 0 2px 0',
            lineHeight: 1,
          }}
        >
          {data.name}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', margin: '0 0 14px 0' }}>
          {cleanName(data.districtName)} District, Tamil Nadu
        </p>

        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#dc2626',
            textTransform: 'uppercase',
            letterSpacing: 3,
            margin: '0 0 10px 0',
          }}
        >
          POWER RANKINGS (1977-2021)
        </p>

        {/* Ranking rows */}
        {sortedParties.slice(0, 5).map(([party, wins], i) => {
          const pct = (wins / totalElections) * 100
          const medal = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#475569'
          return (
            <div
              key={party}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
            >
              {/* Rank */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: medal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 900, color: i < 3 ? '#000' : '#fff' }}>
                  #{i + 1}
                </span>
              </div>
              {/* Leader */}
              <LeaderCircle
                party={party}
                size={38}
                borderColor={i === 0 ? '#f59e0b' : '#475569'}
                borderWidth={2}
              />
              {/* Party info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PartyLogo party={party} size={18} />
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: i === 0 ? '#f59e0b' : '#e2e8f0',
                    }}
                  >
                    {party}
                  </span>
                </div>
                {/* Win bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: '#1e293b',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: 8,
                        width: `${(wins / maxWins) * 100}%`,
                        backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#475569',
                        borderRadius: 4,
                        minWidth: 8,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Win count */}
              <span
                style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? '#f59e0b' : '#94a3b8' }}
              >
                {wins}
              </span>
            </div>
          )
        })}

        {/* Bloc row */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #1e293b',
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: '#1e293b',
              borderRadius: 8,
              padding: '8px 12px',
              borderLeft: '3px solid #dc2626',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>DMK Bloc</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>{dmkBlocWins}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
              {formatBreakdown(dmkBlocBreakdown)}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: '#1e293b',
              borderRadius: 8,
              padding: '8px 12px',
              borderLeft: '3px solid #22c55e',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#86efac' }}>AIADMK Bloc</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>
                {aiadmkBlocWins}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
              {formatBreakdown(aiadmkBlocBreakdown)}
            </span>
          </div>
        </div>

        {/* Demographics + voters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', gap: 14 }}>
            {data.topCastes.map((c, i) => (
              <span key={i} style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>
                <span style={{ color: CASTE_COLORS[i], fontWeight: 900, fontSize: 18 }}>
                  {c.percentage}%
                </span>{' '}
                {c.name}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>
              {data.voters ? formatNum(data.voters.total) : 'N/A'}
            </span>
            {voterGrowth !== null && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: voterGrowth > 0 ? '#4ade80' : '#f87171',
                }}
              >
                {voterGrowth > 0 ? '+' : ''}
                {voterGrowth.toFixed(1)}%
              </span>
            )}
            {data.voters && (
              <>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>
                  {formatNum(data.voters.male)}M
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f472b6' }}>
                  {formatNum(data.voters.female)}F
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 25: TIMELINE (Year-by-year election timeline)
// ═══════════════════════════════════════════════════════════════
function Timeline({ data, stats }: { data: CardData; stats: Stats }) {
  const {
    party1,
    party2,
    winDiff,
    dmkBlocWins,
    aiadmkBlocWins,
    dmkBlocBreakdown,
    aiadmkBlocBreakdown,
    voterGrowth,
    elections,
  } = stats

  const getBlocColor = (party: string, year: number) => {
    const bloc = identifyBloc(party, year, data.stateCode || 'TN', data.allianceData)
    return bloc === 'dmk' ? '#dc2626' : bloc === 'aiadmk' ? '#16a34a' : '#64748b'
  }

  return (
    <div
      data-card
      style={{
        ...cardBase,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ height: 5, backgroundColor: '#dc2626' }} />

      <div style={{ padding: '14px 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <Logo />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
              {data.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
              {cleanName(data.districtName)} District, TN
            </div>
          </div>
          <Badge isReserved={data.isReserved} />
        </div>

        {/* Timeline */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#dc2626',
            textTransform: 'uppercase',
            letterSpacing: 3,
            margin: '0 0 10px 0',
          }}
        >
          ELECTION TIMELINE (1977-2021)
        </p>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          {/* Timeline line */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              height: 3,
              backgroundColor: '#e2e8f0',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {elections.map((e, i) => {
              const color = getBlocColor(e.winnerParty, e.year)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 1,
                  }}
                >
                  {/* Dot with party logo */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `3px solid ${color}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    <PartyLogo party={e.winnerParty} size={22} />
                  </div>
                  {/* Year */}
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 4 }}>
                    {e.year}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#dc2626' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>DMK Bloc</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#16a34a' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>AIADMK Bloc</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#64748b' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Other</span>
            </div>
          </div>
        </div>

        {/* Party face-off — centered symmetrical */}
        {party1 && party2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Left side — Party 1 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <LeaderCircle party={party1.name} size={48} borderColor="#dc2626" borderWidth={3} />
              <PartyLogo party={party1.name} size={24} />
              <span style={{ fontSize: 30, fontWeight: 900, color: '#dc2626' }}>{party1.wins}</span>
            </div>

            {/* Center — VS badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 12px',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>VS</span>
              </div>
              {winDiff > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>
                  +{winDiff}
                </span>
              )}
            </div>

            {/* Right side — Party 2 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 900, color: '#94a3b8' }}>{party2.wins}</span>
              <PartyLogo party={party2.name} size={24} />
              <LeaderCircle party={party2.name} size={48} borderColor="#94a3b8" borderWidth={3} />
            </div>
          </div>
        )}

        {/* Blocs */}
        <BlocSection
          dmkWins={dmkBlocWins}
          aiadmkWins={aiadmkBlocWins}
          dmkBreakdown={dmkBlocBreakdown}
          aiadmkBreakdown={aiadmkBlocBreakdown}
          variant="colored"
        />

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '2px solid #f1f5f9',
            alignItems: 'center',
          }}
        >
          {data.topCastes.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: CASTE_COLORS[i] }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.name}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: CASTE_COLORS[i] }}>
                {c.percentage}%
              </span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>
            {data.voters ? formatNum(data.voters.total) : 'N/A'}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>voters</span>
          {voterGrowth !== null && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: voterGrowth > 0 ? '#059669' : '#dc2626',
              }}
            >
              {voterGrowth > 0 ? '+' : ''}
              {voterGrowth.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* eslint-enable @next/next/no-img-element */

// ─── Preview page ────────────────────────────────────────────
export function XCardPreview({ data, selectedTemplate }: Props) {
  const stats = deriveStats(data)
  const templates = [
    { id: 'card1', name: 'Bold Classic', component: <BoldClassic data={data} stats={stats} /> },
    { id: 'card2', name: 'Red Banner', component: <RedBanner data={data} stats={stats} /> },
    { id: 'card3', name: 'Full Dark', component: <FullDark data={data} stats={stats} /> },
    { id: 'card4', name: 'Newspaper', component: <Newspaper data={data} stats={stats} /> },
    { id: 'card5', name: 'Scoreboard', component: <Scoreboard data={data} stats={stats} /> },
    { id: 'card6', name: 'Dashboard Grid', component: <DashboardGrid data={data} stats={stats} /> },
    { id: 'card7', name: 'Neon Pulse', component: <NeonPulse data={data} stats={stats} /> },
    { id: 'card8', name: 'Championship', component: <Championship data={data} stats={stats} /> },
    { id: 'card9', name: 'Breaking News', component: <BreakingNews data={data} stats={stats} /> },
    { id: 'card10', name: 'Steel Frame', component: <SteelFrame data={data} stats={stats} /> },
    { id: 'card11', name: 'Horizon', component: <Horizon data={data} stats={stats} /> },
    { id: 'card12', name: 'Tricolor', component: <Tricolor data={data} stats={stats} /> },
    { id: 'card13', name: 'Analytics', component: <Analytics data={data} stats={stats} /> },
    { id: 'card14', name: 'Comparison', component: <Comparison data={data} stats={stats} /> },
    { id: 'card15', name: 'Spotlight', component: <Spotlight data={data} stats={stats} /> },
    { id: 'card16', name: 'Election Map', component: <ElectionMap data={data} stats={stats} /> },
    { id: 'card17', name: 'Fight Night', component: <FightNight data={data} stats={stats} /> },
    { id: 'card18', name: 'Did You Know', component: <DidYouKnow data={data} stats={stats} /> },
    { id: 'card19', name: 'Verdict', component: <Verdict data={data} stats={stats} /> },
    { id: 'card20', name: 'Power Ranking', component: <PowerRanking data={data} stats={stats} /> },
    { id: 'card21', name: 'Timeline', component: <Timeline data={data} stats={stats} /> },
  ]

  if (selectedTemplate) {
    const tmpl = templates.find((t) => t.id === selectedTemplate)
    if (tmpl) {
      return (
        <div style={{ padding: 0, display: 'inline-block' }}>
          <div
            data-assembly-meta
            data-name={cleanName(data.name)}
            data-district={cleanName(data.districtName)}
            data-district-id={data.districtId}
            data-assembly-id={data.assemblyId}
            style={{ display: 'none' }}
          />
          {tmpl.component}
        </div>
      )
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: 4,
          fontFamily: fontBase,
        }}
      >
        X Card Preview: {data.name}
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, fontFamily: fontBase }}>
        {data.assemblyId} &middot; {data.districtName} &middot;{' '}
        {data.isReserved ? 'Reserved' : 'General'}
      </p>

      {templates.map((tmpl) => (
        <div key={tmpl.id} style={{ marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              fontFamily: fontBase,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{tmpl.name}</h2>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>?template={tmpl.id}</span>
          </div>
          {tmpl.component}
        </div>
      ))}
    </div>
  )
}
