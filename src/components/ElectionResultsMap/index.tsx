'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'

import '@/components/AssemblyMap/leaflet-style-import'
import { getPartyColor } from '@/lib/partyColors'
import { trackClicked, setPageContext, PAGE_NAMES } from '@/analytics'
import { useStateConfig } from '@/components/providers/StateProvider'
import type { ElectionResultsDataset, SeatResult } from '@/lib/electionResults'

// ── Leaflet dynamic imports ──────────────────────────────────────────────────
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), {
  ssr: false,
})

let L: any = null
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  L = require('leaflet')
}

// ── Types ────────────────────────────────────────────────────────────────────
export type ElectionResultsMapProps = {
  data: ElectionResultsDataset
  geoJsonUrl: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getFeatureAssemblyId = (f: any, stateCode: string): string | null => {
  if (!f?.properties?.ac) return null
  const acNum = String(f.properties.ac).padStart(3, '0')
  return stateCode === 'TN' ? `ac${acNum}` : `${stateCode.toLowerCase()}-ac${acNum}`
}

const getPolygonCentroid = (coords: any, fallback: [number, number] = [11.1271, 78.6569]): [number, number] => {
  try {
    let points = coords[0]
    if (Array.isArray(coords[0]?.[0]?.[0])) points = coords[0][0]
    if (!Array.isArray(points) || !points.length) return fallback
    let lng = 0,
      lat = 0,
      n = 0
    for (const p of points) {
      if (Array.isArray(p) && p.length >= 2) {
        lng += p[0]
        lat += p[1]
        n++
      }
    }
    return n ? [lat / n, lng / n] : fallback
  } catch {
    return fallback
  }
}

const STATUS_LABEL: Record<SeatResult['status'], string> = {
  declared: 'DECLARED',
  leading: 'LEADING',
  counting: 'COUNTING',
  pending: 'PENDING',
}

const STATUS_BG: Record<SeatResult['status'], string> = {
  declared: '#10b981',
  leading: '#3b82f6',
  counting: '#f59e0b',
  pending: '#4b5563',
}

// ── Animated count-up hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = prevRef.current
    const diff = target - start
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setValue(Math.round(start + diff * ease))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else prevRef.current = target
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

/** Fires `true` for 600 ms whenever `value` changes — used for number flash effects */
function useFlash(value: number): boolean {
  const [flashing, setFlashing] = useState(false)
  const prevRef = useRef(value)
  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value
      setFlashing(true)
      const id = setTimeout(() => setFlashing(false), 600)
      return () => clearTimeout(id)
    }
  }, [value])
  return flashing
}

/** Returns `true` after `delay` ms on mount — for staggered CSS entry animations */
function useMounted(delay = 0): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(id)
  }, [delay])
  return mounted
}

// ── Ticker component (slide-from-right) ──────────────────────────────────────
function Ticker({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('show')

  useEffect(() => {
    const id = setInterval(() => {
      setPhase('exit')
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length)
        setPhase('enter')
        setTimeout(() => setPhase('show'), 40)
      }, 280)
    }, 5000)
    return () => clearInterval(id)
  }, [items.length])

  const slideStyle: React.CSSProperties = {
    transition: 'transform 0.28s ease, opacity 0.28s ease',
    transform:
      phase === 'enter' ? 'translateX(28px)' : phase === 'exit' ? 'translateX(-28px)' : 'translateX(0)',
    opacity: phase === 'show' ? 1 : 0,
  }

  return (
    <div className="flex shrink-0 items-center gap-3 overflow-hidden border-t border-gray-800 bg-gray-950 px-4 py-2.5">
      <span className="flex shrink-0 items-center gap-1.5 rounded bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-200" />
        </span>
        LIVE
      </span>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-gray-200" style={slideStyle}>
          {items[idx]}
        </p>
      </div>
    </div>
  )
}

// ── Vote share mini bar ───────────────────────────────────────────────────────
function VoteShareBar({
  winner,
  runnerUp,
  winnerParty,
  runnerUpParty,
}: {
  winner: number
  runnerUp: number
  winnerParty: string
  runnerUpParty: string
}) {
  const total = winner + runnerUp
  const wPct = (winner / total) * 100
  const rPct = (runnerUp / total) * 100
  const animated = useMounted(120)

  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-gray-400">
        <span>{wPct.toFixed(0)}%</span>
        <span className="text-gray-600">vote share</span>
        <span>{rPct.toFixed(0)}%</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-l-full"
          style={{
            width: animated ? `${wPct}%` : '0%',
            backgroundColor: getPartyColor(winnerParty),
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        <div
          className="h-full rounded-r-full"
          style={{
            width: animated ? `${rPct}%` : '0%',
            backgroundColor: getPartyColor(runnerUpParty),
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1) 0.05s',
          }}
        />
      </div>
    </div>
  )
}

// ── Party bar (scoreboard row) ───────────────────────────────────────────────
function PartyRow({
  party,
  seats,
  leading,
  total,
  maxSeats,
  isActive,
  onClick,
  rank,
  delay,
}: {
  party: string
  seats: number
  leading: number
  total: number
  maxSeats: number
  isActive: boolean
  onClick: () => void
  rank: number
  delay: number
}) {
  const countedTotal = useCountUp(total, 1000)
  const barPct = (total / Math.max(maxSeats, 1)) * 100
  const color = getPartyColor(party)
  const mounted = useMounted(delay)
  const flash = useFlash(countedTotal)

  return (
    <button
      onClick={onClick}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease, background-color 0.15s ease',
        boxShadow: isActive ? `0 0 0 1px ${color}60, 0 0 14px ${color}20` : undefined,
      }}
      className={`group w-full rounded-lg px-3 py-2.5 text-left ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-4 text-[10px] font-bold tabular-nums text-gray-600">{rank}</span>
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-white">{party}</span>
        </div>
        <div className="flex items-center gap-1.5 text-right">
          <span
            className={`text-xl font-extrabold tabular-nums transition-colors duration-300 ${
              flash ? 'text-yellow-300' : 'text-white'
            }`}
          >
            {countedTotal}
          </span>
          {leading > 0 && (
            <span className="rounded bg-blue-500/20 px-1 py-0.5 text-[10px] font-semibold text-blue-300">
              +{leading}
            </span>
          )}
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${Math.max(barPct, 0.5)}%`,
            backgroundColor: color,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* Revealed on hover: declared vs leading breakdown */}
      <div className="mt-1 flex items-center gap-3 overflow-hidden max-h-0 group-hover:max-h-6 transition-all duration-200">
        <span className="text-[9px] text-emerald-400">{seats} declared</span>
        {leading > 0 && <span className="text-[9px] text-blue-400">{leading} leading</span>}
      </div>
    </button>
  )
}

// ── GeoJSON layer using raw Leaflet ──────────────────────────────────────────
function NativeGeoJSON({
  data,
  style,
  onEachFeature,
  refreshKey,
}: {
  data: any
  style: (f: any) => any
  onEachFeature: (f: any, l: any) => void
  refreshKey: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const map = require('react-leaflet').useMap()
  const layerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !L) return
    if (layerRef.current) map.removeLayer(layerRef.current)
    layerRef.current = L.geoJSON(data, { style, onEachFeature }).addTo(map)
    return () => {
      if (layerRef.current && map) map.removeLayer(layerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, refreshKey])

  return null
}

// ── Selected seat card ───────────────────────────────────────────────────────
function SeatCard({ seat, onClose }: { seat: SeatResult; onClose: () => void }) {
  const color = getPartyColor(seat.winnerParty)
  const mounted = useMounted(0)
  const marginIsClose = seat.margin < 3000

  return (
    <div
      className="w-72 overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl"
      style={{
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
      }}
    >
      {/* Coloured header strip */}
      <div
        className="relative px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${color}22 0%, transparent 70%)`,
          borderBottom: `2px solid ${color}`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {seat.districtName}
            </p>
            <p className="truncate text-base font-extrabold text-white leading-snug">
              {seat.assemblyName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: STATUS_BG[seat.status] }}
            >
              {STATUS_LABEL[seat.status]}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Winner */}
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-500">
            Winner / Leading
          </p>
          <p className="text-base font-bold text-white">{seat.winnerName}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {seat.winnerParty}
            </span>
            <span className="text-sm font-semibold text-white">
              {seat.winnerVotes.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Animated vote-share bar */}
        <VoteShareBar
          winner={seat.winnerVotes}
          runnerUp={seat.runnerUpVotes}
          winnerParty={seat.winnerParty}
          runnerUpParty={seat.runnerUpParty}
        />

        {/* Runner-up */}
        <div className="rounded-lg bg-gray-800/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Runner-up</p>
          <p className="text-sm font-semibold text-white">{seat.runnerUpName}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: getPartyColor(seat.runnerUpParty) }}
            >
              {seat.runnerUpParty}
            </span>
            <span className="text-xs text-gray-300">{seat.runnerUpVotes.toLocaleString()}</span>
          </div>
        </div>

        {/* Margin + Turnout */}
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Margin</p>
            <p className={`font-bold ${marginIsClose ? 'text-amber-400' : 'text-white'}`}>
              {marginIsClose && <AlertTriangle className="mr-0.5 inline h-3 w-3 align-[-1px]" />}
              {seat.margin.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Total Votes</p>
            <p className="font-bold text-white">
              {seat.totalVotes.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Majority animated bar ─────────────────────────────────────────────────────
function MajorityBar({
  tallies,
  totalSeats,
  majorityMark,
  topParty,
}: {
  tallies: ElectionResultsDataset['partyTallies']
  totalSeats: number
  majorityMark: number
  topParty: ElectionResultsDataset['partyTallies'][0] | undefined
}) {
  const animated = useMounted(200)
  const majorityPct = (majorityMark / totalSeats) * 100
  const topCount = useCountUp(topParty?.total ?? 0, 1400)
  const topReachedMajority = (topParty?.total ?? 0) >= majorityMark

  return (
    <div className="shrink-0 border-b border-gray-800 bg-gray-900/70 px-6 py-3">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-2 font-semibold text-white">
          {topParty && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: getPartyColor(topParty.party) }}
            />
          )}
          {topParty?.party ?? '—'} leading —{' '}
          <span
            className={`text-base font-extrabold tabular-nums transition-colors duration-300 ${
              topReachedMajority ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {topCount}
          </span>
          {topReachedMajority && (
            <span className="animate-pulse rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              MAJORITY ✓
            </span>
          )}
        </span>
        <span className="text-gray-500">
          Majority:{' '}
          <strong className="text-white">{majorityMark}</strong> / {totalSeats}
        </span>
      </div>

      {/* Stacked animated bar */}
      <div className="relative h-6 overflow-hidden rounded-full bg-gray-800">
        {tallies.slice(0, 8).reduce<{ els: React.ReactNode[]; offset: number }>(
          ({ els, offset }, t) => {
            const w = (t.total / totalSeats) * 100
            els.push(
              <div
                key={t.party}
                title={`${t.party}: ${t.total} seats`}
                className="absolute top-0 h-full"
                style={{
                  left: `${offset}%`,
                  width: animated ? `${w}%` : '0%',
                  backgroundColor: getPartyColor(t.party),
                  transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${offset * 5}ms`,
                }}
              />,
            )
            return { els, offset: offset + w }
          },
          { els: [], offset: 0 },
        ).els}

        {/* Majority marker line */}
        <div
          className="absolute top-0 z-10 h-full w-0.5 bg-white/60"
          style={{ left: `${majorityPct}%` }}
        >
          <div className="absolute -top-0.5 left-1.5 whitespace-nowrap rounded bg-white/10 px-1 text-[9px] font-semibold text-white/60 backdrop-blur-sm">
            {majorityMark}
          </div>
        </div>
      </div>

      {/* Party legend dots */}
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {tallies.slice(0, 8).map((t) => (
          <div key={t.party} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: getPartyColor(t.party) }}
            />
            {t.party} {t.total}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Donut progress ring ───────────────────────────────────────────────────────
function DonutProgress({
  pct,
  color,
  size = 56,
}: {
  pct: number
  color: string
  size?: number
}) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const animated = useMounted(400)
  const dash = animated ? (pct / 100) * circ : 0

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={circ - dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1) 0.4s' }}
      />
    </svg>
  )
}

// ── Map tap hint overlay ──────────────────────────────────────────────────────
function MapTooltip({ onDismiss }: { onDismiss: () => void }) {
  const visible = useMounted(700)

  return (
    <div
      className="pointer-events-none absolute bottom-14 left-1/2 z-[1001] -translate-x-1/2"
      style={{
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      <div
        className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-gray-950/90 px-4 py-2 text-xs font-medium text-gray-300 shadow-xl backdrop-blur-sm"
        onClick={onDismiss}
      >
        <MapPin className="h-3.5 w-3.5 text-red-400" />
        Tap any constituency to see results
        <X className="ml-1 h-3 w-3 text-gray-500" />
      </div>
    </div>
  )
}

// ── Trending seat button (extracted to allow useMounted hook) ────────────────
function TrendingSeatButton({
  seat,
  delay,
  onFly,
}: {
  seat: SeatResult
  delay: number
  onFly: (id: string) => void
}) {
  const mounted = useMounted(delay)
  return (
    <button
      onClick={() => onFly(seat.assemblyId)}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
      className="group flex w-full items-center justify-between rounded-lg bg-gray-900 px-2.5 py-2 transition-colors hover:bg-gray-800"
    >
      <div className="text-left">
        <p className="text-xs font-semibold text-white">{seat.assemblyName}</p>
        <p className="text-[10px] text-gray-500">{seat.districtName}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: getPartyColor(seat.winnerParty) }}
        >
          {seat.winnerParty}
        </span>
        <Zap className="h-3 w-3 text-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  )
}

// ── Status bar row (extracted to allow useMounted hook) ───────────────────────
function StatusBarRow({
  label,
  count,
  totalSeats,
  color,
  delay,
}: {
  label: string
  count: number
  totalSeats: number
  color: string
  delay: number
}) {
  const barIn = useMounted(delay)
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-bold text-white">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-1.5 rounded-full"
          style={{
            width: barIn ? `${(count / totalSeats) * 100}%` : '0%',
            backgroundColor: color,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1) 0.25s',
          }}
        />
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function ElectionResultsMap({ data, geoJsonUrl }: ElectionResultsMapProps) {
  const stateConfig = useStateConfig()
  const mapRef = useRef<any>(null)
  const [geoJson, setGeoJson] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [popupPos, setPopupPos] = useState<[number, number] | null>(null)
  const [activeParty, setActiveParty] = useState<string | null>(null)
  const [showMapTooltip, setShowMapTooltip] = useState(true)

  // auto-cycle time display
  const [timeStr, setTimeStr] = useState('')
  useEffect(() => {
    const tick = () =>
      setTimeStr(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch GeoJSON client-side from Cloudflare CDN instead of embedding in RSC payload
  useEffect(() => {
    fetch(geoJsonUrl)
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(() => {/* map renders without boundaries on error */})
  }, [geoJsonUrl])

  // Dismiss tooltip after first seat click or after 8s
  useEffect(() => {
    if (selectedId) setShowMapTooltip(false)
  }, [selectedId])
  useEffect(() => {
    const id = setTimeout(() => setShowMapTooltip(false), 8000)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ELECTION_RESULTS,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }, [])

  const topParty = data.partyTallies[0]
  const totalLeading = data.partyTallies.reduce((s, t) => s + t.leading, 0)
  const declaredCount = useCountUp(data.declared, 1200)
  const leadingCount = useCountUp(totalLeading, 1200)
  const countingCount = useCountUp(data.counting, 1200)
  const declaredFlash = useFlash(declaredCount)
  const leadingFlash = useFlash(leadingCount)
  const declaredPct = Math.round((data.declared / data.totalSeats) * 100)

  // Trending seats
  const trendingSeats = useMemo(
    () =>
      Object.values(data.results)
        .filter((r) => r.isTrending)
        .slice(0, 6),
    [data.results],
  )

  const styleFeature = useCallback(
    (feature: any) => {
      const aid = getFeatureAssemblyId(feature, stateConfig.code)
      const result = aid ? data.results[aid] : undefined
      const isSelected = aid === selectedId
      const isFiltered = activeParty ? result?.winnerParty !== activeParty : false
      const isDeclared = result?.status === 'declared' || result?.status === 'leading'
      const fillColor =
        isDeclared && result?.winnerParty ? getPartyColor(result.winnerParty) : '#374151'

      return {
        color: isSelected ? '#ffffff' : '#1f2937',
        fillColor,
        fillOpacity: isSelected ? 1 : isFiltered ? 0.08 : isDeclared ? 0.85 : 0.35,
        weight: isSelected ? 2.5 : 0.8,
        opacity: 1,
      }
    },
    [data.results, selectedId, activeParty, stateConfig.code],
  )

  const onEachFeature = useCallback(
    (feature: any, layer: any) => {
      layer.on({
        click: (e: any) => {
          e.originalEvent?.stopPropagation()
          const aid = getFeatureAssemblyId(feature, stateConfig.code)
          if (!aid) return
          const centroid = feature.geometry
            ? getPolygonCentroid(feature.geometry.coordinates, stateConfig.mapCenter)
            : null
          setSelectedId(aid)
          setPopupPos(centroid)
          trackClicked({
            name: 'election_results_seat_click',
            page_name: PAGE_NAMES.ELECTION_RESULTS,
            assembly_id: aid,
            assembly_name: feature.properties?.ac_name ?? '',
          })
        },
        mouseover: (e: any) => {
          e.target.bringToFront()
          e.target.setStyle({ color: '#ffffff', fillOpacity: 0.96, weight: 2 })
        },
        mouseout: (e: any) => {
          e.target.setStyle(styleFeature(feature))
        },
      })
    },
    [styleFeature, stateConfig.code, stateConfig.mapCenter],
  )

  const refreshKey = [selectedId ?? 'none', activeParty ?? 'all'].join('-')

  const selectedSeat = selectedId ? data.results[selectedId] : null

  const handlePartyFilter = (party: string) => {
    const next = activeParty === party ? null : party
    setActiveParty(next)
    trackClicked({
      name: 'election_results_party_filter',
      page_name: PAGE_NAMES.ELECTION_RESULTS,
      party,
      active: next !== null,
    })
  }

  const flyToSeat = (assemblyId: string) => {
    const feature = geoJson?.features?.find(
      (f: any) => getFeatureAssemblyId(f, stateConfig.code) === assemblyId,
    )
    if (!feature) return
    const centroid = getPolygonCentroid(feature.geometry.coordinates, stateConfig.mapCenter)
    setSelectedId(assemblyId)
    setPopupPos(centroid)
    if (mapRef.current) mapRef.current.flyTo(centroid, 9, { duration: 0.9, easeLinearity: 0.3 })
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="relative shrink-0 overflow-hidden border-b border-gray-800 bg-gray-950 px-6 py-3">
        {/* Subtle CRT scan-line effect */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-200" />
              </span>
              <Activity className="h-3.5 w-3.5" />
              LIVE COUNT
            </span>
            <div>
              <h1 className="text-lg font-extrabold leading-none tracking-tight text-white">
                {data.stateName} Election Results
              </h1>
              <p className="text-[11px] text-gray-500">
                {data.electionYear} — Tamil Nadu Legislative Assembly
              </p>
            </div>
          </div>

          {/* Stat pill row */}
          <div className="flex items-center divide-x divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {[
              { label: 'Declared', value: declaredCount, color: 'text-emerald-400', flash: declaredFlash },
              { label: 'Leading', value: leadingCount, color: 'text-blue-400', flash: leadingFlash },
              { label: 'Counting', value: countingCount, color: 'text-amber-400', flash: false },
              { label: 'Pending', value: data.pending, color: 'text-gray-500', flash: false },
            ].map(({ label, value, color, flash }) => (
              <div key={label} className="px-4 py-2 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-600">{label}</p>
                <p
                  className={`text-2xl font-extrabold tabular-nums transition-colors duration-300 ${color} ${flash ? 'brightness-[1.6]' : ''}`}
                >
                  {value}
                </p>
              </div>
            ))}
            <div className="px-4 py-2 text-center">
              <p className="text-[9px] uppercase tracking-widest text-gray-600">Updated</p>
              <p className="font-mono text-sm font-semibold text-gray-300">{timeStr}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Majority animated bar ─────────────────────────────────────────── */}
      <MajorityBar
        tallies={data.partyTallies}
        totalSeats={data.totalSeats}
        majorityMark={data.majorityMark}
        topParty={topParty}
      />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: scoreboard */}
        <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-800 bg-gray-950">
          <div className="px-3 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Party Tally</p>
              {activeParty && (
                <button
                  onClick={() => setActiveParty(null)}
                  className="flex items-center gap-1 rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:text-white"
                >
                  <X className="h-3 w-3" />
                  clear
                </button>
              )}
            </div>
            <div className="space-y-1">
              {data.partyTallies.slice(0, 10).map((t, i) => (
                <PartyRow
                  key={t.party}
                  party={t.party}
                  seats={t.seats}
                  leading={t.leading}
                  total={t.total}
                  maxSeats={data.partyTallies[0]?.total ?? 1}
                  isActive={activeParty === t.party}
                  onClick={() => handlePartyFilter(t.party)}
                  rank={i + 1}
                  delay={i * 55}
                />
              ))}
            </div>
          </div>

          {/* Trending seats */}
          {trendingSeats.length > 0 && (
            <div className="mt-2 border-t border-gray-800 px-3 pb-3 pt-3">
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500">
                  Trending Seats
                </p>
              </div>
              <div className="space-y-1">
                {trendingSeats.map((seat, i) => (
                  <TrendingSeatButton
                    key={seat.assemblyId}
                    seat={seat}
                    delay={350 + i * 70}
                    onFly={(id) => {
                      flyToSeat(id)
                      trackClicked({
                        name: 'election_results_map',
                        page_name: PAGE_NAMES.ELECTION_RESULTS,
                        assembly_id: id,
                        source: 'trending_panel',
                      })
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Centre: map */}
        <main className="relative flex-1 overflow-hidden">
          <MapContainer
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            center={stateConfig.mapCenter}
            zoom={stateConfig.mapZoom}
            scrollWheelZoom
            ref={mapRef}
            attributionControl={false}
          >
            <NativeGeoJSON
              data={geoJson}
              style={styleFeature}
              onEachFeature={onEachFeature}
              refreshKey={refreshKey}
            />

            {popupPos && selectedSeat && (
              <Popup position={popupPos} closeButton={false} maxWidth={300}>
                <SeatCard
                  seat={selectedSeat}
                  onClose={() => {
                    setSelectedId(null)
                    setPopupPos(null)
                  }}
                />
              </Popup>
            )}
          </MapContainer>

          {/* "Tap to see results" hint */}
          {showMapTooltip && <MapTooltip onDismiss={() => setShowMapTooltip(false)} />}

          {/* Active party filter badge */}
          {activeParty && (
            <div
              className="absolute left-3 top-3 z-[1001] flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
              style={{
                backgroundColor: `${getPartyColor(activeParty)}dd`,
                boxShadow: `0 0 18px ${getPartyColor(activeParty)}55`,
              }}
            >
              <span className="h-2 w-2 rounded-sm bg-white/30" />
              Showing: {activeParty}
              <button
                onClick={() => setActiveParty(null)}
                className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Refresh hint (hidden when party filter active) */}
          {!activeParty && (
            <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full border border-white/5 bg-gray-950/80 px-3 py-1 text-[11px] text-gray-500 backdrop-blur-sm">
              <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
              Counting in progress
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-white/10 bg-gray-950/90 px-3 py-2.5 shadow-xl backdrop-blur-sm">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">Legend</p>
            <div className="space-y-1.5">
              {[
                { color: '#10b981', label: 'Declared', pulse: false },
                { color: '#3b82f6', label: 'Leading', pulse: false },
                { color: '#f59e0b', label: 'Counting', pulse: true },
                { color: '#374151', label: 'Pending', pulse: false },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div
                    className="relative flex h-3 w-3 items-center justify-center rounded-sm"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.pulse && (
                      <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-white/50" />
                    )}
                  </div>
                  <span className="text-xs text-gray-300">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right: status + leading party */}
        <aside className="flex w-52 shrink-0 flex-col overflow-y-auto border-l border-gray-800 bg-gray-950">
          <div className="px-4 pt-4">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-gray-500">Progress</p>

            {/* Donut ring + declared count */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <DonutProgress pct={declaredPct} color="#10b981" size={56} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-emerald-400">
                  {declaredPct}%
                </span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Declared</p>
                <p className="text-2xl font-extrabold text-white">{data.declared}</p>
                <p className="text-[10px] text-gray-600">of {data.totalSeats} seats</p>
              </div>
            </div>

            {/* Status bars with entrance animation */}
            {[
              { label: 'Leading', count: totalLeading, color: '#3b82f6' },
              { label: 'Counting', count: data.counting, color: '#f59e0b' },
              { label: 'Pending', count: data.pending, color: '#4b5563' },
            ].map((item, i) => (
              <StatusBarRow
                key={item.label}
                label={item.label}
                count={item.count}
                totalSeats={data.totalSeats}
                color={item.color}
                delay={220 + i * 100}
              />
            ))}

            {/* Majority callout */}
            <div className="mb-4 mt-2 rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Majority</p>
              <p className="text-3xl font-extrabold text-white">{data.majorityMark}</p>
              <p className="text-[10px] text-gray-500">of {data.totalSeats} seats</p>
            </div>

            {/* Leading party card */}
            {topParty && (
              <div
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, ${getPartyColor(topParty.party)}18 0%, transparent 80%)`,
                  border: `1px solid ${getPartyColor(topParty.party)}40`,
                }}
              >
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Front Runner</p>
                <p className="mt-0.5 text-lg font-extrabold text-white">{topParty.party}</p>
                <p
                  className="text-3xl font-extrabold tabular-nums"
                  style={{ color: getPartyColor(topParty.party) }}
                >
                  {topParty.total}
                </p>
                {topParty.swing !== 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    {topParty.swing > 0 ? (
                      <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span
                      className={`text-xs font-semibold ${topParty.swing > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {topParty.swing > 0 ? '+' : ''}
                      {topParty.swing}% swing
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <Ticker items={data.tickerItems} />
    </div>
  )
}

export default ElectionResultsMap
