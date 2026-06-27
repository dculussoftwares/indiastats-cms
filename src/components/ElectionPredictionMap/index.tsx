'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  X,
  Zap,
} from 'lucide-react'

import '@/components/AssemblyMap/leaflet-style-import'
import type { ElectionPredictionDataset, PredictionMapEntry } from '@/lib/electionPredictions'
import { buildAssemblyUrl } from '@/lib/assemblyRouting'
import { getStateByCode } from '@/config/states'
import { getPartyColor } from '@/lib/partyColors'
import { trackClicked, trackViewed, setPageContext, PAGE_NAMES } from '@/analytics'
import { useStateConfig } from '@/components/providers/StateProvider'

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

// ── Compact custom zoom control ───────────────────────────────────────────────
function ZoomControl({ mapRef }: { mapRef: React.RefObject<any> }) {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col overflow-hidden rounded-lg border border-white/10 bg-gray-950/90 shadow-xl backdrop-blur-sm">
      <button
        aria-label="Zoom in"
        onClick={() => mapRef.current?.zoomIn()}
        className="flex h-8 w-8 items-center justify-center border-b border-white/10 text-gray-300 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20 text-lg font-light leading-none"
      >
        +
      </button>
      <button
        aria-label="Zoom out"
        onClick={() => mapRef.current?.zoomOut()}
        className="flex h-8 w-8 items-center justify-center text-gray-300 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20 text-lg font-light leading-none"
      >
        −
      </button>
    </div>
  )
}

let L: any = null
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  L = require('leaflet')
}

type ViewMode = 'winner' | 'heat' | 'type'

type HighlightFilter =
  | { type: 'party'; value: string }
  | { type: 'predictionType'; value: string }
  | { type: 'heatLevel'; value: 'stable' | 'close' | 'tooClose' }
  | null

type ElectionPredictionMapProps = {
  initialData: ElectionPredictionDataset
  map: any
  stateCode: string
  stateName: string
}

type PopupContent = {
  ac: number
  ac_name: string
  assemblyId: string
  pc_name: string
}

// ── Animation hooks ──────────────────────────────────────────────────────────
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
      const ease = 1 - Math.pow(1 - progress, 3)
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

function useMounted(delay = 0): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(id)
  }, [delay])
  return mounted
}

const TYPE_COLORS = [
  '#0f766e',
  '#1d4ed8',
  '#ea580c',
  '#be123c',
  '#7c3aed',
  '#059669',
  '#0369a1',
  '#b45309',
  '#0891b2',
  '#4f46e5',
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const getFeatureAssemblyId = (feature: any, stateCode: string): string | null => {
  if (!feature?.properties?.ac) return null
  const acNum = String(feature.properties.ac).padStart(3, '0')
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
      if (Array.isArray(p) && p.length >= 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1])) {
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

const getDisplayText = (value: string | null | undefined): string => {
  if (!value) return ''
  const parts = value
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts[parts.length - 1] ?? value
}

const matchesHighlight = (
  entry: PredictionMapEntry | undefined,
  highlight: HighlightFilter,
): boolean => {
  if (!highlight || !entry) return false
  switch (highlight.type) {
    case 'party':
      return entry.predictedWinningParty === highlight.value
    case 'predictionType':
      return entry.predictionType === highlight.value
    case 'heatLevel':
      if (highlight.value === 'tooClose') return entry.predictedWinningParty === null
      if (highlight.value === 'close')
        return entry.isCloseContest && entry.predictedWinningParty !== null
      return !entry.isCloseContest && entry.predictedWinningParty !== null
  }
}

// ── NativeGeoJSON ─────────────────────────────────────────────────────────────
function NativeGeoJSON({
  data,
  style,
  onEachFeature,
  refreshKey,
}: {
  data: any
  style: any
  onEachFeature: any
  refreshKey?: string
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

// ── Ticker ────────────────────────────────────────────────────────────────────
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
      phase === 'enter'
        ? 'translateX(28px)'
        : phase === 'exit'
          ? 'translateX(-28px)'
          : 'translateX(0)',
    opacity: phase === 'show' ? 1 : 0,
  }
  return (
    <div className="flex shrink-0 items-center gap-3 overflow-hidden border-t border-gray-800 bg-gray-950 px-4 py-2.5">
      <span className="flex shrink-0 items-center gap-1.5 rounded bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-200" />
        </span>
        FORECAST
      </span>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-gray-200" style={slideStyle}>
          {items[idx]}
        </p>
      </div>
    </div>
  )
}

// ── PartyRow ──────────────────────────────────────────────────────────────────
function PartyRow({
  party,
  count,
  total,
  maxSeats,
  isActive,
  onClick,
  rank,
  delay,
}: {
  party: string
  count: number
  total: number
  maxSeats: number
  isActive: boolean
  onClick: () => void
  rank: number
  delay: number
}) {
  const animated = useCountUp(count, 1000)
  const barPct = (count / Math.max(maxSeats, 1)) * 100
  const color = getPartyColor(party)
  const mounted = useMounted(delay)
  const flash = useFlash(animated)
  return (
    <button
      onClick={onClick}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        boxShadow: isActive ? `0 0 0 1px ${color}60, 0 0 14px ${color}20` : undefined,
      }}
      className={`group w-full rounded-lg px-3 py-2.5 text-left ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-4 text-[10px] font-bold tabular-nums text-gray-600">{rank}</span>
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-white">{party}</span>
        </div>
        <span
          className={`text-xl font-extrabold tabular-nums transition-colors duration-300 ${flash ? 'text-yellow-300' : 'text-white'}`}
        >
          {animated}
        </span>
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
      <div className="mt-1 flex items-center gap-1 overflow-hidden max-h-0 group-hover:max-h-5 transition-all duration-200">
        <span className="text-[9px] text-gray-400">
          {count} called · {total - count} toss-ups
        </span>
      </div>
    </button>
  )
}

// ── DonutProgress ─────────────────────────────────────────────────────────────
function DonutProgress({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
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

// ── WatchlistButton ───────────────────────────────────────────────────────────
function WatchlistButton({
  entry,
  delay,
  onFocus,
}: {
  entry: PredictionMapEntry
  delay: number
  onFocus: (id: string) => void
}) {
  const mounted = useMounted(delay)
  return (
    <button
      onClick={() => onFocus(entry.assemblyId)}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
      className="group flex w-full items-center justify-between rounded-lg bg-gray-900 px-2.5 py-2 transition-colors hover:bg-gray-800"
    >
      <div className="text-left">
        <p className="text-xs font-semibold text-white">{getDisplayText(entry.assemblyName)}</p>
        <p className="text-[10px] text-gray-500">{getDisplayText(entry.districtName)}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {entry.predictedWinningParty ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: getPartyColor(entry.predictedWinningParty) }}
          >
            {entry.predictedWinningParty}
          </span>
        ) : (
          <span className="rounded bg-amber-600/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
            TOSS
          </span>
        )}
        <Zap className="h-3 w-3 text-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </button>
  )
}

// ── SeatPopupCard (dark TV-mode) ──────────────────────────────────────────────
function SeatPopupCard({
  popupContent,
  popupEntry,
  onClose,
  onNavigate,
}: {
  popupContent: PopupContent
  popupEntry: PredictionMapEntry | null
  onClose: () => void
  onNavigate: () => void
}) {
  const color = popupEntry?.predictedWinningParty
    ? getPartyColor(popupEntry.predictedWinningParty)
    : '#d97706'
  const mounted = useMounted(0)
  return (
    <div
      className="w-72 overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl"
      style={{
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
      }}
    >
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
              {popupContent.pc_name}
            </p>
            <p className="truncate text-base font-extrabold text-white leading-snug">
              {popupContent.ac_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-400 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        {popupEntry ? (
          <>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-gray-500">
                {popupEntry.predictedWinningParty ? 'Predicted winner' : 'Too close to call'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {popupEntry.predictedWinningParty ? (
                  <span
                    className="rounded px-2 py-0.5 text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {popupEntry.predictedWinningParty}
                  </span>
                ) : (
                  popupEntry.closeParties.map((p) => (
                    <span
                      key={p}
                      className="rounded px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: getPartyColor(p) }}
                    >
                      {p}
                    </span>
                  ))
                )}
                {popupEntry.isCloseContest && popupEntry.predictedWinningParty && (
                  <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                    <AlertTriangle className="h-2.5 w-2.5" /> Close fight
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                  {popupEntry.predictionType}
                </span>
              </div>
            </div>
            {popupEntry.additionalNotes && (
              <div className="rounded-lg bg-gray-800/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Note</p>
                <p className="mt-1 text-xs leading-5 text-gray-300">{popupEntry.additionalNotes}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500">No prediction data for this seat.</p>
        )}
        <button
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
        >
          View Assembly <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ── ForecastBar ───────────────────────────────────────────────────────────────
function ForecastBar({
  topParties,
  tooCloseToCall,
  totalAssemblies,
}: {
  topParties: { key: string; count: number }[]
  tooCloseToCall: number
  totalAssemblies: number
}) {
  const animated = useMounted(200)
  const topParty = topParties[0]
  const topCount = useCountUp(topParty?.count ?? 0, 1400)
  const majority = Math.ceil(totalAssemblies / 2)
  const majorityPct = (majority / totalAssemblies) * 100

  return (
    <div className="shrink-0 border-b border-gray-800 bg-gray-900/70 px-3 py-2 md:px-6 md:py-3">
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-2 font-semibold text-white">
          {topParty && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: getPartyColor(topParty.key) }}
            />
          )}
          {topParty?.key ?? '—'} leading —{' '}
          <span
            className={`text-base font-extrabold tabular-nums transition-colors duration-300 ${topCount >= majority ? 'text-emerald-400' : 'text-white'}`}
          >
            {topCount}
          </span>
          {topCount >= majority && (
            <span className="hidden sm:inline-flex animate-pulse items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              MAJORITY ✓
            </span>
          )}
        </span>
        <span className="hidden sm:block text-gray-500">
          Majority: <strong className="text-white">{majority}</strong> / {totalAssemblies}
        </span>
      </div>
      <div className="relative h-6 overflow-hidden rounded-full bg-gray-800">
        {
          topParties.slice(0, 8).reduce<{ els: React.ReactNode[]; offset: number }>(
            ({ els, offset }, t) => {
              const w = (t.count / totalAssemblies) * 100
              els.push(
                <div
                  key={t.key}
                  title={`${t.key}: ${t.count}`}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${offset}%`,
                    width: animated ? `${w}%` : '0%',
                    backgroundColor: getPartyColor(t.key),
                    transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${offset * 5}ms`,
                  }}
                />,
              )
              return { els, offset: offset + w }
            },
            { els: [], offset: 0 },
          ).els
        }
        {tooCloseToCall > 0 &&
          (() => {
            const calledPct = (topParties.reduce((s, t) => s + t.count, 0) / totalAssemblies) * 100
            const w = (tooCloseToCall / totalAssemblies) * 100
            return (
              <div
                className="absolute top-0 h-full bg-amber-600/60"
                style={{
                  left: `${calledPct}%`,
                  width: animated ? `${w}%` : '0%',
                  transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 200ms',
                }}
              />
            )
          })()}
        <div
          className="absolute top-0 z-10 h-full w-0.5 bg-white/60"
          style={{ left: `${majorityPct}%` }}
        >
          <div className="absolute -top-0.5 left-1.5 whitespace-nowrap rounded bg-white/10 px-1 text-[9px] font-semibold text-white/60 backdrop-blur-sm">
            {majority}
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {topParties.slice(0, 6).map((t) => (
          <div key={t.key} className="flex items-center gap-1 text-[10px] text-gray-500">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: getPartyColor(t.key) }}
            />
            {t.key} {t.count}
          </div>
        ))}
        {tooCloseToCall > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="h-2 w-2 rounded-sm bg-amber-600/60" />
            TOSS {tooCloseToCall}
          </div>
        )}
      </div>
    </div>
  )
}

// ── StatusBarRow ──────────────────────────────────────────────────────────────
function StatusBarRow({
  label,
  count,
  total,
  color,
  delay,
}: {
  label: string
  count: number
  total: number
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
            width: barIn ? `${(count / total) * 100}%` : '0%',
            backgroundColor: color,
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1) 0.25s',
          }}
        />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ElectionPredictionMap({
  initialData,
  map,
  stateCode,
  stateName,
}: ElectionPredictionMapProps) {
  const stateConfig = useStateConfig()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mapRef = useRef<any>(null)

  // ── Parse initial state from URL ────────────────────────────────────────
  const initPredictorId = searchParams.get('predictor') ?? initialData.selectedPredictor?.id ?? ''
  const initYear = searchParams.get('year')
    ? Number(searchParams.get('year'))
    : initialData.electionYear
  const initViewMode = (searchParams.get('view') as ViewMode | null) ?? 'winner'
  const initDistrict = searchParams.get('district') ?? null
  const initAssembly = searchParams.get('assembly') ?? null
  const initHighlight = (() => {
    const raw = searchParams.get('highlight')
    if (!raw) return null
    const [type, ...rest] = raw.split(':')
    const value = rest.join(':')
    if (!type || !value) return null
    if (type === 'party') return { type: 'party' as const, value }
    if (type === 'predictionType') return { type: 'predictionType' as const, value }
    if (type === 'heatLevel' && (value === 'stable' || value === 'close' || value === 'tooClose'))
      return { type: 'heatLevel' as const, value: value as 'stable' | 'close' | 'tooClose' }
    return null
  })()

  const [dataset, setDataset] = useState(initialData)
  const [selectedPredictorId, setSelectedPredictorId] = useState(initPredictorId)
  const [selectedYear, setSelectedYear] = useState(initYear)
  const [viewMode, setViewMode] = useState<ViewMode>(initViewMode)
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | null>(initAssembly)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(initDistrict)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [popupContent, setPopupContent] = useState<PopupContent | null>(null)
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>(initHighlight)
  const [timeStr, setTimeStr] = useState('')
  const [showMapHint, setShowMapHint] = useState(true)
  const [mobileTab, setMobileTab] = useState<'map' | 'forecast' | 'stats'>('map')

  // ── Sync state → URL (shallow replace, no reload) ──────────────────────
  const updateUrl = useCallback(
    (
      overrides: Partial<{
        predictor: string
        year: number
        view: ViewMode
        highlight: HighlightFilter
        district: string | null
        assembly: string | null
      }>,
    ) => {
      const params = new URLSearchParams()
      const p = {
        predictor: selectedPredictorId,
        year: selectedYear,
        view: viewMode,
        highlight: highlightFilter,
        district: selectedDistrict,
        assembly: selectedAssemblyId,
        ...overrides,
      }
      if (p.predictor) params.set('predictor', p.predictor)
      if (p.year) params.set('year', String(p.year))
      if (p.view && p.view !== 'winner') params.set('view', p.view)
      if (p.highlight) params.set('highlight', `${p.highlight.type}:${p.highlight.value}`)
      if (p.district) params.set('district', p.district)
      if (p.assembly) params.set('assembly', p.assembly)
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [
      selectedPredictorId,
      selectedYear,
      viewMode,
      highlightFilter,
      selectedDistrict,
      selectedAssemblyId,
      pathname,
      router,
    ],
  )

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

  useEffect(() => {
    if (selectedAssemblyId) setShowMapHint(false)
  }, [selectedAssemblyId])
  useEffect(() => {
    const id = setTimeout(() => setShowMapHint(false), 8000)
    return () => clearTimeout(id)
  }, [])

  // Re-render map when switching back to map tab on mobile
  useEffect(() => {
    if (mobileTab === 'map' && mapRef.current) {
      const id = setTimeout(() => mapRef.current?.invalidateSize?.(), 150)
      return () => clearTimeout(id)
    }
  }, [mobileTab])

  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
    trackViewed({
      name: 'election_prediction_page',
      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
      predictor_name: initialData.selectedPredictor?.name ?? '',
      election_year: initialData.electionYear,
      state_code: stateCode,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const assemblyOptions = useMemo(() => {
    if (!Array.isArray(map?.features)) return []
    return map.features
      .map((f: any) => {
        const assemblyId = getFeatureAssemblyId(f, stateConfig.code)
        const name = f?.properties?.ac_name
        return assemblyId && name ? { assemblyId, name } : null
      })
      .filter(Boolean) as { assemblyId: string; name: string }[]
  }, [map, stateConfig.code])

  const filteredAssemblies = useMemo(() => {
    if (!searchQuery) return assemblyOptions.slice(0, 8)
    return assemblyOptions
      .filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8)
  }, [assemblyOptions, searchQuery])

  const typeColorMap = useMemo(() => {
    const m: Record<string, string> = {}
    dataset.predictionTypeCounts.forEach((item, i) => {
      m[item.key] = TYPE_COLORS[i % TYPE_COLORS.length]
    })
    return m
  }, [dataset.predictionTypeCounts])

  const tickerItems = useMemo(() => {
    const items = dataset.topParties.slice(0, 5).map((p) => `${p.key} — ${p.count} seats called`)
    if (dataset.summary.tooCloseToCall > 0)
      items.push(`${dataset.summary.tooCloseToCall} seats too close to call`)
    if (dataset.summary.closeContests > 0)
      items.push(`${dataset.summary.closeContests} close contests flagged`)
    if (dataset.selectedPredictor?.name)
      items.push(`Forecast by ${dataset.selectedPredictor.name} · ${dataset.electionYear}`)
    return items.length ? items : ['Election forecast loading…']
  }, [dataset])

  const toggleHighlight = (next: HighlightFilter) => {
    const clearing =
      highlightFilter &&
      next &&
      highlightFilter.type === next.type &&
      highlightFilter.value === next.value
    const resolved = clearing ? null : next
    setHighlightFilter(resolved)
    updateUrl({ highlight: resolved })
    if (next && !clearing) {
      trackClicked({
        name: 'prediction_highlight',
        page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
        highlight_type: next.type,
        highlight_value: next.value,
      })
    }
  }

  const loadDataset = async (nextPredictorId: string, nextYear?: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ predictorId: nextPredictorId, stateCode })
      if (nextYear) params.set('electionYear', String(nextYear))
      const res = await fetch(`/api/election-predictions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      const nextData = (await res.json()) as ElectionPredictionDataset
      setDataset(nextData)
      setSelectedPredictorId(nextData.selectedPredictor?.id ?? '')
      setSelectedYear(nextData.electionYear)
      setSelectedAssemblyId(null)
      setSearchQuery('')
      setPopupContent(null)
      setPopupPosition(null)
      setHighlightFilter(null)
      updateUrl({
        predictor: nextData.selectedPredictor?.id ?? '',
        year: nextData.electionYear,
        highlight: null,
        assembly: null,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const focusAssemblyById = useCallback(
    (assemblyId: string) => {
      const feature = map?.features?.find((f: any) => getFeatureAssemblyId(f, stateConfig.code) === assemblyId)
      if (!feature) return
      const centroid = feature.geometry ? getPolygonCentroid(feature.geometry.coordinates, stateConfig.mapCenter) : null
      if (!centroid) return
      setSelectedAssemblyId(assemblyId)
      setSearchQuery(feature.properties?.ac_name ?? '')
      setPopupContent({
        ac: feature.properties?.ac,
        ac_name: feature.properties?.ac_name,
        assemblyId,
        pc_name: feature.properties?.pc_name,
      })
      setPopupPosition(centroid)
      updateUrl({ assembly: assemblyId })
      if (mapRef.current) mapRef.current.flyTo(centroid, 9, { duration: 0.9, easeLinearity: 0.3 })
    },
    [map, updateUrl, stateConfig.code, stateConfig.mapCenter],
  )

  const handleDistrictSelect = (district: string | null) => {
    setSelectedDistrict(district)
    updateUrl({ district: district })
    if (!district) {
      if (mapRef.current) mapRef.current.setView(stateConfig.mapCenter, stateConfig.mapZoom)
      return
    }
    const features = map?.features?.filter((f: any) => f?.properties?.pc_name === district)
    if (!features?.length || !L || !mapRef.current) return
    const points: [number, number][] = []
    features.forEach((f: any) => {
      if (!f.geometry?.coordinates) return
      let coords = f.geometry.coordinates[0]
      if (Array.isArray(coords?.[0]?.[0])) coords = coords[0]
      coords.forEach((p: any) => {
        if (Array.isArray(p) && p.length >= 2) points.push([p[1], p[0]])
      })
    })
    if (points.length) mapRef.current.fitBounds(L.latLngBounds(points), { padding: [18, 18] })
  }

  const getPredictionFill = useCallback(
    (entry: PredictionMapEntry | undefined): string => {
      if (!entry) return '#374151'
      if (viewMode === 'heat') {
        if (entry.predictedWinningParty === null) return '#b45309'
        if (entry.isCloseContest) return '#f97316'
        return '#0f766e'
      }
      if (viewMode === 'type') return typeColorMap[entry.predictionType] || '#475569'
      if (entry.predictedWinningParty) return getPartyColor(entry.predictedWinningParty)
      return '#d97706'
    },
    [viewMode, typeColorMap],
  )

  const styleFeature = useCallback(
    (feature: any) => {
      const aid = getFeatureAssemblyId(feature, stateConfig.code)
      const entry = aid ? dataset.results[aid] : undefined
      const isSelected = aid === selectedAssemblyId
      const isWithinDistrict =
        !selectedDistrict || feature?.properties?.pc_name === selectedDistrict
      const isHighlighted = highlightFilter ? matchesHighlight(entry, highlightFilter) : true
      const isDimmed = !isWithinDistrict || !isHighlighted
      const borderColor = isSelected
        ? '#ffffff'
        : !isHighlighted
          ? '#1f2937'
          : entry?.predictedWinningParty === null
            ? '#7c2d12'
            : entry?.isCloseContest
              ? '#9a3412'
              : '#1f2937'
      return {
        color: isDimmed ? '#1f2937' : borderColor,
        fillColor: getPredictionFill(entry),
        fillOpacity: isSelected ? 1 : isDimmed ? 0.08 : 0.88,
        opacity: 1,
        weight: isSelected
          ? 2.5
          : !isHighlighted
            ? 0.5
            : entry?.isCloseContest || entry?.predictedWinningParty === null
              ? 1.8
              : 0.8,
      }
    },
    [dataset.results, selectedAssemblyId, selectedDistrict, highlightFilter, getPredictionFill, stateConfig.code],
  )

  const onEachFeature = useCallback(
    (feature: any, layer: any) => {
      layer.on({
        click: (e: any) => {
          e.originalEvent?.stopPropagation()
          const aid = getFeatureAssemblyId(feature, stateConfig.code)
          if (!aid) return
          setSelectedAssemblyId(aid)
          setSearchQuery(feature?.properties?.ac_name ?? '')
          setPopupContent({
            ac: feature?.properties?.ac,
            ac_name: feature?.properties?.ac_name,
            assemblyId: aid,
            pc_name: feature?.properties?.pc_name,
          })
          setPopupPosition([e.latlng.lat, e.latlng.lng])
          updateUrl({ assembly: aid })
          trackClicked({
            name: 'link',
            page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
            link_name: 'view_prediction_for_assembly',
            link_location: 'prediction_map',
            assembly_id: aid,
            assembly_name: feature?.properties?.ac_name ?? '',
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
    [styleFeature, updateUrl, stateConfig.code],
  )

  const refreshKey = [
    dataset.selectedPredictor?.id ?? 'none',
    dataset.electionYear,
    viewMode,
    selectedAssemblyId ?? 'none',
    selectedDistrict ?? 'all',
    highlightFilter ? `${highlightFilter.type}:${highlightFilter.value}` : 'nofilter',
  ].join('-')

  const popupEntry = popupContent ? dataset.results[popupContent.assemblyId] : null
  const calledCount = useCountUp(dataset.summary.calledSeats, 1200)
  const closeCount = useCountUp(dataset.summary.closeContests, 1200)
  const tossCount = useCountUp(dataset.summary.tooCloseToCall, 1200)
  const calledFlash = useFlash(calledCount)
  const calledPct = Math.round(
    (dataset.summary.calledSeats / Math.max(dataset.summary.totalAssemblies, 1)) * 100,
  )

  const winnerLegendItems = useMemo(() => {
    const items = dataset.topParties
      .slice(0, 8)
      .map((p) => ({ color: getPartyColor(p.key), count: p.count, label: p.key }))
    if (dataset.summary.tooCloseToCall > 0)
      items.push({
        color: '#d97706',
        count: dataset.summary.tooCloseToCall,
        label: 'Too close to call',
      })
    return items
  }, [dataset.summary.tooCloseToCall, dataset.topParties])

  const watchlist = dataset.watchlist.slice(0, 8)

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative shrink-0 overflow-hidden border-b border-gray-800 bg-gray-950 px-4 py-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)',
          }}
        />
        <div className="relative flex h-16 items-center justify-between gap-4">
          {/* Left — predictor identity */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Predictor avatar */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-red-600 bg-gray-800 shadow-[0_0_12px_rgba(185,28,28,0.45)]">
              {dataset.selectedPredictor?.imagePath ? (
                <Image
                  src={dataset.selectedPredictor.imagePath}
                  alt={dataset.selectedPredictor.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Activity className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>

            {/* Title + subtitle */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-extrabold leading-none tracking-tight text-white">
                  {dataset.selectedPredictor?.name ?? 'Election Predictions'}
                </h1>
                <span className="shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                  Forecast
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-gray-500">
                {stateName} · {dataset.electionYear} Assembly
              </p>
            </div>

            {/* Divider */}
            <div className="mx-1 h-6 w-px shrink-0 bg-gray-800" />

            {/* Predictor / Year / View-mode controls */}
            <div className="hidden md:flex items-center gap-2">
              <select
                value={selectedPredictorId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedPredictorId(id)
                  void loadDataset(id, selectedYear)
                  trackClicked({
                    name: 'prediction_predictor_changed',
                    page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                    predictor_id: id,
                    predictor_name: dataset.predictors.find((p) => p.id === id)?.name ?? '',
                    location: 'header',
                  })
                }}
                className="h-7 rounded-md border border-gray-700 bg-gray-900 px-2 text-[11px] text-gray-300 focus:border-red-600 focus:outline-none"
              >
                {dataset.predictors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value)
                  setSelectedYear(y)
                  void loadDataset(selectedPredictorId, y)
                  trackClicked({
                    name: 'prediction_year_changed',
                    page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                    election_year: y,
                    location: 'header',
                  })
                }}
                className="h-7 rounded-md border border-gray-700 bg-gray-900 px-2 text-[11px] text-gray-300 focus:border-red-600 focus:outline-none"
              >
                {dataset.availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <div className="flex rounded-md bg-gray-800 p-0.5">
                {(
                  [
                    ['winner', 'Party'],
                    ['heat', 'Heat'],
                    ['type', 'Type'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => {
                      setViewMode(v)
                      updateUrl({ view: v })
                      trackClicked({
                        name: 'prediction_view_mode_changed',
                        page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                        view_mode: v,
                        location: 'header',
                      })
                    }}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${viewMode === v ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — stat pills + clock */}
          {/* Mobile: compact called count only */}
          <div className="flex md:hidden items-center overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shrink-0">
            <div className="px-3 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-widest text-gray-600">Called</p>
              <p
                className={`text-xl font-extrabold tabular-nums transition-colors duration-300 text-emerald-400 ${calledFlash ? 'brightness-[1.6]' : ''}`}
              >
                {calledCount}
              </p>
            </div>
          </div>
          {/* Desktop: full stat pills + clock */}
          <div className="hidden md:flex items-center divide-x divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shrink-0">
            {[
              {
                label: 'Called',
                value: calledCount,
                color: 'text-emerald-400',
                flash: calledFlash,
              },
              { label: 'Close', value: closeCount, color: 'text-amber-400', flash: false },
              { label: 'Toss-up', value: tossCount, color: 'text-orange-500', flash: false },
              {
                label: 'Total',
                value: dataset.summary.totalAssemblies,
                color: 'text-gray-400',
                flash: false,
              },
            ].map(({ label, value, color, flash }) => (
              <div key={label} className="px-3 py-1.5 text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-600">{label}</p>
                <p
                  className={`text-xl font-extrabold tabular-nums transition-colors duration-300 ${color} ${flash ? 'brightness-[1.6]' : ''}`}
                >
                  {value}
                </p>
              </div>
            ))}
            <div className="px-3 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-widest text-gray-600">Time</p>
              <p className="font-mono text-xs font-semibold text-gray-300">{timeStr}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile top tab bar (always visible, no scroll required) ──────── */}
      <nav className="md:hidden shrink-0 flex border-b border-gray-800 bg-gray-950">
        {(
          [
            { id: 'map', label: 'Map', Icon: MapPin },
            { id: 'forecast', label: 'Forecast', Icon: BarChart3 },
            { id: 'stats', label: 'Stats', Icon: Activity },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => {
              setMobileTab(id)
              trackClicked({
                name: 'prediction_mobile_tab_changed',
                page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                tab: id,
              })
            }}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
              mobileTab === id
                ? 'border-b-2 border-red-500 text-red-500'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon
              className={`h-4 w-4 transition-transform duration-150 ${
                mobileTab === id ? 'scale-110' : ''
              }`}
            />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Forecast majority bar ────────────────────────────────────────── */}
      <ForecastBar
        topParties={dataset.topParties}
        tooCloseToCall={dataset.summary.tooCloseToCall}
        totalAssemblies={dataset.summary.totalAssemblies}
      />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: party tally — desktop only; mobile shows Forecast overlay tab */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-800 bg-gray-950">
          <div className="px-3 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Seat Forecast</p>
              {highlightFilter && (
                <button
                  onClick={() => {
                    setHighlightFilter(null)
                    updateUrl({ highlight: null })
                  }}
                  className="flex items-center gap-1 rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                  clear
                </button>
              )}
            </div>
            <div className="space-y-1">
              {dataset.topParties.slice(0, 10).map((t, i) => (
                <PartyRow
                  key={t.key}
                  party={t.key}
                  count={t.count}
                  total={dataset.summary.totalAssemblies}
                  maxSeats={dataset.topParties[0]?.count ?? 1}
                  isActive={highlightFilter?.type === 'party' && highlightFilter.value === t.key}
                  onClick={() => toggleHighlight({ type: 'party', value: t.key })}
                  rank={i + 1}
                  delay={i * 55}
                />
              ))}
              {dataset.summary.tooCloseToCall > 0 && (
                <button
                  onClick={() => toggleHighlight({ type: 'heatLevel', value: 'tooClose' })}
                  style={{ opacity: 1, transition: 'background-color 0.15s ease' }}
                  className={`group w-full rounded-lg px-3 py-2.5 text-left ${highlightFilter?.type === 'heatLevel' && highlightFilter.value === 'tooClose' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-amber-600" />
                      <span className="text-sm font-semibold text-amber-400">Too Close</span>
                    </div>
                    <span className="text-xl font-extrabold tabular-nums text-amber-400">
                      {dataset.summary.tooCloseToCall}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Watchlist */}
          {watchlist.length > 0 && (
            <div className="mt-2 border-t border-gray-800 px-3 pb-3 pt-3">
              <div className="mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Watchlist</p>
              </div>
              <div className="space-y-1">
                {watchlist.map((entry, i) => (
                  <WatchlistButton
                    key={entry.assemblyId}
                    entry={entry}
                    delay={350 + i * 60}
                    onFocus={(id) => {
                      focusAssemblyById(id)
                      trackClicked({
                        name: 'watchlist_seat',
                        page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                        assembly_id: id,
                        assembly_name: entry.assemblyName ?? '',
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
          {isLoading && (
            <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-4 border-gray-700 border-t-red-600 animate-spin" />
                <p className="text-sm font-medium text-gray-300">Updating forecast…</p>
              </div>
            </div>
          )}
          <MapContainer
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            center={stateConfig.mapCenter}
            zoom={stateConfig.mapZoom}
            scrollWheelZoom
            zoomControl={false}
            ref={mapRef}
            attributionControl={false}
          >
            <NativeGeoJSON
              data={map}
              style={styleFeature}
              onEachFeature={onEachFeature}
              refreshKey={refreshKey}
            />
            {popupPosition && popupContent && (
              <Popup position={popupPosition} closeButton={false} maxWidth={300}>
                <SeatPopupCard
                  popupContent={popupContent}
                  popupEntry={popupEntry}
                  onClose={() => {
                    setSelectedAssemblyId(null)
                    setPopupContent(null)
                    setPopupPosition(null)
                    updateUrl({ assembly: null })
                  }}
                  onNavigate={() => {
                    const stateSlug = getStateByCode(stateCode)?.slug ?? 'tamil-nadu'
                    const url = buildAssemblyUrl(popupContent.ac, stateSlug)
                    if (url) {
                      trackClicked({
                        name: 'link',
                        page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                        link_name: 'view_assembly_from_prediction',
                        link_location: 'prediction_popup',
                        assembly_id: popupContent.assemblyId,
                        assembly_name: popupContent.ac_name,
                      })
                      router.push(url)
                    }
                  }}
                />
              </Popup>
            )}
          </MapContainer>

          {/* Custom compact zoom — bottom-left, clear of legend */}
          <ZoomControl mapRef={mapRef} />

          {/* Map hint */}
          {showMapHint && (
            <div
              className="pointer-events-none absolute bottom-4 left-1/2 z-[1001] -translate-x-1/2"
              style={{
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                opacity: 1,
                transform: 'translateY(0)',
              }}
            >
              <div
                className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-gray-950/90 px-4 py-2 text-xs font-medium text-gray-300 shadow-xl backdrop-blur-sm"
                onClick={() => setShowMapHint(false)}
              >
                <MapPin className="h-3.5 w-3.5 text-red-400" />
                Tap any constituency to see forecast
                <X className="ml-1 h-3 w-3 text-gray-500" />
              </div>
            </div>
          )}

          {/* Search bar overlay + highlight chip — full-width on mobile, fixed right on desktop */}
          <div className="absolute left-2 right-2 top-3 z-[1001] md:left-auto md:right-4 md:top-4 md:w-72">
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-red-400"
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
              <input
                type="text"
                value={searchQuery}
                placeholder="Search constituency…"
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="h-11 w-full rounded-xl border-2 border-red-500 bg-gray-950/95 pl-10 pr-10 text-sm font-medium text-white placeholder:text-gray-400 focus:outline-none backdrop-blur-md shadow-2xl transition-colors"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setShowDropdown(false)
                    setSelectedAssemblyId(null)
                    setPopupContent(null)
                    setPopupPosition(null)
                    updateUrl({ assembly: null })
                    trackClicked({
                      name: 'prediction_search_cleared',
                      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                    })
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              )}
              {showDropdown && filteredAssemblies.length > 0 && (
                <div className="absolute mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-700 bg-gray-950/98 shadow-2xl backdrop-blur-md">
                  {filteredAssemblies.map((a) => (
                    <button
                      key={a.assemblyId}
                      className="flex w-full items-center gap-3 border-b border-gray-800 px-4 py-3 text-left text-sm text-gray-200 last:border-0 hover:bg-white/5 hover:text-white transition-colors"
                      onClick={() => {
                        setShowDropdown(false)
                        focusAssemblyById(a.assemblyId)
                        trackClicked({
                          name: 'prediction_search_result_clicked',
                          page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                          assembly_id: a.assemblyId,
                          assembly_name: a.name,
                          search_query: searchQuery,
                        })
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span className="font-medium">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active highlight chip — sits directly below the search box */}
            {highlightFilter && (
              <div className="mt-2 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg w-fit">
                {highlightFilter.type === 'party' && (
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: getPartyColor(highlightFilter.value) }}
                  />
                )}
                {highlightFilter.type === 'heatLevel'
                  ? highlightFilter.value === 'tooClose'
                    ? 'Too close to call'
                    : highlightFilter.value === 'close'
                      ? 'Close contests'
                      : 'Stable'
                  : highlightFilter.value}
                <button
                  onClick={() => {
                    setHighlightFilter(null)
                    updateUrl({ highlight: null })
                    trackClicked({
                      name: 'prediction_highlight_cleared',
                      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                    })
                  }}
                  className="ml-0.5 opacity-70 hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-2 z-[1000] rounded-xl border border-white/10 bg-gray-950/90 px-3 py-2.5 shadow-xl backdrop-blur-sm md:right-4">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">
              {viewMode === 'winner' ? 'Party' : viewMode === 'heat' ? 'Intensity' : 'Type'}
            </p>
            <div className="space-y-1 max-h-[140px] overflow-y-auto md:max-h-[220px]">
              {viewMode === 'winner' &&
                winnerLegendItems.map((item) => {
                  const isTooClose = item.label === 'Too close to call'
                  const filter: HighlightFilter = isTooClose
                    ? { type: 'heatLevel', value: 'tooClose' }
                    : { type: 'party', value: item.label }
                  const isActive =
                    highlightFilter?.type === filter?.type &&
                    highlightFilter?.value === filter?.value
                  return (
                    <button
                      key={item.label}
                      onClick={() => toggleHighlight(filter)}
                      className={`flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs ${isActive ? 'bg-red-900/40' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className={`font-medium ${isActive ? 'text-red-300' : 'text-gray-300'}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className={isActive ? 'font-semibold text-red-400' : 'text-gray-500'}>
                        {item.count}
                      </span>
                    </button>
                  )
                })}
              {viewMode === 'heat' &&
                [
                  {
                    color: '#0f766e',
                    count: dataset.summary.calledSeats - dataset.summary.closeContests,
                    value: 'stable' as const,
                    label: 'Stable',
                  },
                  {
                    color: '#f97316',
                    count: dataset.summary.closeContests,
                    value: 'close' as const,
                    label: 'Close',
                  },
                  {
                    color: '#b45309',
                    count: dataset.summary.tooCloseToCall,
                    value: 'tooClose' as const,
                    label: 'Toss-up',
                  },
                ].map((item) => {
                  const isActive =
                    highlightFilter?.type === 'heatLevel' && highlightFilter.value === item.value
                  return (
                    <button
                      key={item.label}
                      onClick={() => toggleHighlight({ type: 'heatLevel', value: item.value })}
                      className={`flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs ${isActive ? 'bg-red-900/40' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className={`font-medium ${isActive ? 'text-red-300' : 'text-gray-300'}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className={isActive ? 'font-semibold text-red-400' : 'text-gray-500'}>
                        {item.count}
                      </span>
                    </button>
                  )
                })}
              {viewMode === 'type' &&
                dataset.predictionTypeCounts.slice(0, 10).map((item) => {
                  const isActive =
                    highlightFilter?.type === 'predictionType' && highlightFilter.value === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleHighlight({ type: 'predictionType', value: item.key })}
                      className={`flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs ${isActive ? 'bg-red-900/40' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: typeColorMap[item.key] || '#475569' }}
                        />
                        <span
                          className={`font-medium ${isActive ? 'text-red-300' : 'text-gray-300'}`}
                        >
                          {item.key}
                        </span>
                      </div>
                      <span className={isActive ? 'font-semibold text-red-400' : 'text-gray-500'}>
                        {item.count}
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* District filter status */}
          {!isLoading && (
            <div className="absolute left-3 bottom-4 z-[1000] flex items-center gap-1.5 rounded-full border border-white/5 bg-gray-950/80 px-3 py-1 text-[11px] text-gray-500 backdrop-blur-sm">
              <RefreshCw className="h-3 w-3" style={{ animation: 'none' }} />
              {selectedDistrict ? `${selectedDistrict} · filtered` : 'All districts'}
            </div>
          )}

          {/* ── Mobile: Forecast overlay (slide up from bottom) ──────────── */}
          <div
            className={`md:hidden absolute inset-0 z-[1100] flex flex-col bg-gray-950 transition-transform duration-300 ease-in-out ${
              mobileTab === 'forecast' ? 'translate-y-0' : 'translate-y-full pointer-events-none'
            }`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Seat Forecast
              </p>
              <button
                onClick={() => setMobileTab('map')}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Party Tally</p>
                {highlightFilter && (
                  <button
                    onClick={() => {
                      setHighlightFilter(null)
                      updateUrl({ highlight: null })
                    }}
                    className="flex items-center gap-1 rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400 hover:text-white"
                  >
                    <X className="h-3 w-3" /> clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {dataset.topParties.slice(0, 10).map((t, i) => (
                  <PartyRow
                    key={t.key}
                    party={t.key}
                    count={t.count}
                    total={dataset.summary.totalAssemblies}
                    maxSeats={dataset.topParties[0]?.count ?? 1}
                    isActive={highlightFilter?.type === 'party' && highlightFilter.value === t.key}
                    onClick={() => {
                      toggleHighlight({ type: 'party', value: t.key })
                      setMobileTab('map')
                    }}
                    rank={i + 1}
                    delay={i * 55}
                  />
                ))}
                {dataset.summary.tooCloseToCall > 0 && (
                  <button
                    onClick={() => {
                      toggleHighlight({ type: 'heatLevel', value: 'tooClose' })
                      setMobileTab('map')
                    }}
                    className={`group w-full rounded-lg px-3 py-2.5 text-left ${
                      highlightFilter?.type === 'heatLevel' && highlightFilter.value === 'tooClose'
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-amber-600" />
                        <span className="text-sm font-semibold text-amber-400">Too Close</span>
                      </div>
                      <span className="text-xl font-extrabold tabular-nums text-amber-400">
                        {dataset.summary.tooCloseToCall}
                      </span>
                    </div>
                  </button>
                )}
              </div>
              {watchlist.length > 0 && (
                <div className="mt-4 border-t border-gray-800 pt-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Watchlist</p>
                  </div>
                  <div className="space-y-1">
                    {watchlist.map((entry, i) => (
                      <WatchlistButton
                        key={entry.assemblyId}
                        entry={entry}
                        delay={350 + i * 60}
                        onFocus={(id) => {
                          focusAssemblyById(id)
                          setMobileTab('map')
                          trackClicked({
                            name: 'watchlist_seat',
                            page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                            assembly_id: id,
                            assembly_name: entry.assemblyName ?? '',
                          })
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Mobile: Stats & Settings overlay ─────────────────────────── */}
          <div
            className={`md:hidden absolute inset-0 z-[1100] flex flex-col bg-gray-950 transition-transform duration-300 ease-in-out ${
              mobileTab === 'stats' ? 'translate-y-0' : 'translate-y-full pointer-events-none'
            }`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Stats &amp; Settings
              </p>
              <button
                onClick={() => setMobileTab('map')}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Predictor + Year + View mode (mobile controls hidden in header) */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Settings</p>
                <select
                  value={selectedPredictorId}
                  onChange={(e) => {
                    const id = e.target.value
                    setSelectedPredictorId(id)
                    void loadDataset(id, selectedYear)
                    trackClicked({
                      name: 'prediction_predictor_changed',
                      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                      predictor_id: id,
                      predictor_name: dataset.predictors.find((p) => p.id === id)?.name ?? '',
                      location: 'mobile_stats',
                    })
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 focus:border-red-600 focus:outline-none"
                >
                  {dataset.predictors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value)
                    setSelectedYear(y)
                    void loadDataset(selectedPredictorId, y)
                    trackClicked({
                      name: 'prediction_year_changed',
                      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                      election_year: y,
                      location: 'mobile_stats',
                    })
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 focus:border-red-600 focus:outline-none"
                >
                  {dataset.availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg bg-gray-800 p-0.5">
                  {(
                    [
                      ['winner', 'Party'],
                      ['heat', 'Heat'],
                      ['type', 'Type'],
                    ] as const
                  ).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => {
                        setViewMode(v)
                        updateUrl({ view: v })
                        trackClicked({
                          name: 'prediction_view_mode_changed',
                          page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                          view_mode: v,
                          location: 'mobile_stats',
                        })
                      }}
                      className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                        viewMode === v ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forecast progress */}
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-widest text-gray-500">
                  Forecast Progress
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <DonutProgress pct={calledPct} color="#10b981" size={64} />
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-emerald-400">
                      {calledPct}%
                    </span>
                  </div>
                  <div className="grid flex-1 grid-cols-3 gap-2">
                    {[
                      { label: 'Called', value: calledCount, color: 'text-emerald-400' },
                      { label: 'Close', value: closeCount, color: 'text-amber-400' },
                      { label: 'Toss-up', value: tossCount, color: 'text-orange-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg bg-gray-900 p-2 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-gray-600">
                          {label}
                        </p>
                        <p className={`text-lg font-extrabold tabular-nums ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    {
                      label: 'Close contests',
                      count: dataset.summary.closeContests,
                      color: '#f97316',
                    },
                    { label: 'Too close', count: dataset.summary.tooCloseToCall, color: '#d97706' },
                  ].map((item, i) => (
                    <StatusBarRow
                      key={item.label}
                      label={item.label}
                      count={item.count}
                      total={dataset.summary.totalAssemblies}
                      color={item.color}
                      delay={220 + i * 100}
                    />
                  ))}
                </div>
              </div>

              {/* Leading party */}
              {dataset.summary.leadingParty &&
                (() => {
                  const c = getPartyColor(dataset.summary.leadingParty)
                  return (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: `linear-gradient(135deg, ${c}18 0%, transparent 80%)`,
                        border: `1px solid ${c}40`,
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        Front Runner
                      </p>
                      <div className="mt-1 flex items-end justify-between">
                        <p className="text-lg font-extrabold text-white">
                          {dataset.summary.leadingParty}
                        </p>
                        <p className="text-4xl font-extrabold tabular-nums" style={{ color: c }}>
                          {dataset.summary.leadingPartySeats}
                        </p>
                      </div>
                    </div>
                  )
                })()}

              {/* District filter — selecting auto-returns to map */}
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-gray-500">
                  District Filter
                </p>
                <select
                  value={selectedDistrict ?? ''}
                  onChange={(e) => {
                    handleDistrictSelect(e.target.value || null)
                    setMobileTab('map')
                    trackClicked({
                      name: 'prediction_district_filter_changed',
                      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                      district: e.target.value || null,
                      location: 'mobile_stats',
                    })
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="">All districts</option>
                  {Array.from(
                    new Set(map?.features?.map((f: any) => f?.properties?.pc_name).filter(Boolean)),
                  )
                    .sort()
                    .map((d: any) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>

              {/* Type mix */}
              {dataset.predictionTypeCounts.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-red-600" />
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Type Mix</p>
                  </div>
                  <div className="space-y-1">
                    {dataset.predictionTypeCounts.slice(0, 5).map((item) => {
                      const pct = (item.count / Math.max(dataset.summary.totalAssemblies, 1)) * 100
                      const isActive =
                        highlightFilter?.type === 'predictionType' &&
                        highlightFilter.value === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            toggleHighlight({ type: 'predictionType', value: item.key })
                            setMobileTab('map')
                          }}
                          className={`w-full text-left rounded px-1.5 py-1 transition-colors ${
                            isActive ? 'bg-white/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="mb-0.5 flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">{item.key}</span>
                            <span
                              className={isActive ? 'text-red-400 font-semibold' : 'text-gray-600'}
                            >
                              {item.count}
                            </span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-gray-800">
                            <div
                              className="h-1 rounded-full"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                backgroundColor: typeColorMap[item.key] || '#475569',
                                transition: 'width 0.8s ease',
                              }}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right: stats panel — desktop only; mobile shows Stats overlay tab */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col overflow-y-auto border-l border-gray-800 bg-gray-950">
          <div className="px-4 pt-4">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-gray-500">
              Forecast Progress
            </p>

            {/* Donut + called count */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative">
                <DonutProgress pct={calledPct} color="#10b981" size={56} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-emerald-400">
                  {calledPct}%
                </span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Called</p>
                <p className="text-2xl font-extrabold text-white">{dataset.summary.calledSeats}</p>
                <p className="text-[10px] text-gray-600">of {dataset.summary.totalAssemblies}</p>
              </div>
            </div>

            {[
              { label: 'Close contests', count: dataset.summary.closeContests, color: '#f97316' },
              { label: 'Too close', count: dataset.summary.tooCloseToCall, color: '#d97706' },
            ].map((item, i) => (
              <StatusBarRow
                key={item.label}
                label={item.label}
                count={item.count}
                total={dataset.summary.totalAssemblies}
                color={item.color}
                delay={220 + i * 100}
              />
            ))}

            {/* Leading party callout */}
            {dataset.summary.leadingParty &&
              (() => {
                const color = getPartyColor(dataset.summary.leadingParty)
                return (
                  <div
                    className="mt-2 mb-4 rounded-xl p-3"
                    style={{
                      background: `linear-gradient(135deg, ${color}18 0%, transparent 80%)`,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">
                      Front Runner
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-white">
                      {dataset.summary.leadingParty}
                    </p>
                    <p className="text-3xl font-extrabold tabular-nums" style={{ color }}>
                      {dataset.summary.leadingPartySeats}
                    </p>
                  </div>
                )
              })()}

            {/* Prediction type distribution */}
            {dataset.predictionTypeCounts.length > 0 && (
              <div className="mb-4 rounded-xl border border-red-600/30 bg-red-950/20 px-3 py-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">
                      Type Mix
                    </p>
                  </div>
                  <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                    {dataset.predictionTypeCounts.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dataset.predictionTypeCounts.slice(0, 5).map((item) => {
                    const pct = (item.count / Math.max(dataset.summary.totalAssemblies, 1)) * 100
                    const isActive =
                      highlightFilter?.type === 'predictionType' &&
                      highlightFilter.value === item.key
                    return (
                      <button
                        key={item.key}
                        onClick={() => toggleHighlight({ type: 'predictionType', value: item.key })}
                        className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
                          isActive ? 'bg-red-600/20 ring-1 ring-red-500/40' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ backgroundColor: typeColorMap[item.key] || '#475569' }}
                            />
                            <span
                              className={`text-xs font-medium ${
                                isActive ? 'text-red-300' : 'text-gray-300'
                              }`}
                            >
                              {item.key}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              isActive ? 'text-red-400' : 'text-gray-400'
                            }`}
                          >
                            {item.count}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: typeColorMap[item.key] || '#475569',
                              transition: 'width 0.8s ease',
                            }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* District filter */}
            <div className="mb-4">
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-gray-500">District</p>
              <div className="relative">
                <select
                  value={selectedDistrict ?? ''}
                  onChange={(e) => {
                    handleDistrictSelect(e.target.value || null)
                    trackClicked({
                      name: 'prediction_district_filter_changed',
                      page_name: PAGE_NAMES.ELECTION_PREDICTIONS,
                      district: e.target.value || null,
                      location: 'sidebar',
                    })
                  }}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="">All districts</option>
                  {Array.from(
                    new Set(map?.features?.map((f: any) => f?.properties?.pc_name).filter(Boolean)),
                  )
                    .sort()
                    .map((d: any) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* View mode (mobile fallback) */}
            <div className="mb-4">
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-gray-500">
                View Mode
              </p>
              <div className="flex rounded-lg bg-gray-800 p-0.5">
                {(
                  [
                    ['winner', 'Party'],
                    ['heat', 'Heat'],
                    ['type', 'Type'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => {
                      setViewMode(v)
                      updateUrl({ view: v })
                    }}
                    className={`flex-1 rounded-md py-1 text-[10px] font-medium transition-all ${viewMode === v ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Ticker (desktop only) ──────────────────────────────────────────── */}
      <div className="hidden md:block">
        <Ticker items={tickerItems} />
      </div>
    </div>
  )
}

export default ElectionPredictionMap
