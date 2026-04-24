'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Activity, ChevronRight, RefreshCw, TrendingUp, X, Zap } from 'lucide-react'

import '@/components/AssemblyMap/leaflet-style-import'
import { getPartyColor } from '@/lib/partyColors'
import { trackClicked, setPageContext, PAGE_NAMES } from '@/analytics'
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
  geoJson: any
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getFeatureAssemblyId = (f: any): string | null =>
  f?.properties?.ac ? `ac${String(f.properties.ac).padStart(3, '0')}` : null

const getPolygonCentroid = (coords: any): [number, number] => {
  const fallback: [number, number] = [11.1271, 78.6569]
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

const STATUS_COLOR: Record<SeatResult['status'], string> = {
  declared: 'bg-emerald-500',
  leading: 'bg-blue-500',
  counting: 'bg-amber-500',
  pending: 'bg-gray-600',
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

// ── Ticker component ─────────────────────────────────────────────────────────
function Ticker({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length)
        setVisible(true)
      }, 350)
    }, 4500)
    return () => clearInterval(id)
  }, [items.length])

  return (
    <div className="flex items-center gap-3 overflow-hidden bg-gray-950 px-4 py-2 border-t border-gray-800">
      <span className="shrink-0 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white animate-pulse">
        LIVE
      </span>
      <p
        className="text-sm font-medium text-gray-200 truncate transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {items[idx]}
      </p>
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
}: {
  party: string
  seats: number
  leading: number
  total: number
  maxSeats: number
  isActive: boolean
  onClick: () => void
}) {
  const countedSeats = useCountUp(seats, 900)
  const countedTotal = useCountUp(total, 900)
  const barPct = (total / Math.max(maxSeats, 1)) * 100
  const color = getPartyColor(party)

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-lg px-3 py-2 text-left transition-all ${
        isActive ? 'bg-white/10 ring-1 ring-white/30' : 'hover:bg-white/5'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-white">{party}</span>
        </div>
        <div className="flex items-center gap-1.5 text-right">
          <span className="text-xl font-extrabold tabular-nums text-white">{countedTotal}</span>
          {leading > 0 && <span className="text-xs text-blue-400">(+{leading})</span>}
          <span className="hidden text-[10px] text-gray-500 group-hover:inline">
            {countedSeats} dec
          </span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${Math.max(barPct, 1)}%`, backgroundColor: color }}
        />
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
  const margin = seat.margin.toLocaleString()
  const color = getPartyColor(seat.winnerParty)
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 shadow-2xl overflow-hidden w-72">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {seat.districtName}
          </p>
          <p className="text-base font-extrabold text-white">{seat.assemblyName}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <span
            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white mb-2 ${STATUS_COLOR[seat.status]}`}
          >
            {STATUS_LABEL[seat.status]}
          </span>
          <p className="text-lg font-bold text-white">{seat.winnerName}</p>
          <div className="flex items-center gap-2 mt-1">
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

        <div className="rounded-lg bg-gray-800 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Runner-up</p>
          <p className="text-sm font-semibold text-white">{seat.runnerUpName}</p>
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: getPartyColor(seat.runnerUpParty) }}
            >
              {seat.runnerUpParty}
            </span>
            <span className="text-xs text-gray-300">{seat.runnerUpVotes.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-between text-xs">
          <div>
            <p className="text-gray-400 uppercase tracking-widest text-[10px]">Margin</p>
            <p className="font-bold text-white">{margin}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 uppercase tracking-widest text-[10px]">Turnout</p>
            <p className="font-bold text-white">{((seat.totalVotes / 120000) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function ElectionResultsMap({ data, geoJson }: ElectionResultsMapProps) {
  const mapRef = useRef<any>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [popupPos, setPopupPos] = useState<[number, number] | null>(null)
  const [activeParty, setActiveParty] = useState<string | null>(null)

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

  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ELECTION_RESULTS,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }, [])

  const topParty = data.partyTallies[0]
  const totalDeclared = useCountUp(data.declared, 1200)
  const totalLeading = useCountUp(
    data.partyTallies.reduce((s, t) => s + t.leading, 0),
    1200,
  )
  const maxSeats = data.partyTallies[0]?.total ?? 1

  // majority bar width
  const majorityPct = (data.majorityMark / data.totalSeats) * 100

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
      const aid = getFeatureAssemblyId(feature)
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
    [data.results, selectedId, activeParty],
  )

  const onEachFeature = useCallback(
    (feature: any, layer: any) => {
      layer.on({
        click: (e: any) => {
          e.originalEvent?.stopPropagation()
          const aid = getFeatureAssemblyId(feature)
          if (!aid) return
          const centroid = feature.geometry
            ? getPolygonCentroid(feature.geometry.coordinates)
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
    [styleFeature],
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

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white animate-pulse">
            <Activity className="h-3.5 w-3.5" />
            LIVE
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            {data.stateName} Election Results {data.electionYear}
          </h1>
        </div>

        <div className="flex items-center gap-6 text-sm">
          {/* Declared/leading counts */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Declared</p>
            <p className="text-2xl font-extrabold tabular-nums text-emerald-400">{totalDeclared}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Leading</p>
            <p className="text-2xl font-extrabold tabular-nums text-blue-400">{totalLeading}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Counting</p>
            <p className="text-2xl font-extrabold tabular-nums text-amber-400">{data.counting}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Pending</p>
            <p className="text-2xl font-extrabold tabular-nums text-gray-500">{data.pending}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Updated</p>
            <p className="font-mono text-sm text-gray-300">{timeStr}</p>
          </div>
        </div>
      </header>

      {/* ── Majority progress bar ────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-6 py-2">
        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-semibold text-white">
            {topParty?.party ?? '—'} leading with {topParty?.total ?? 0} seats
          </span>
          <span>
            Majority: {data.majorityMark} / {data.totalSeats}
          </span>
        </div>

        {/* stacked party bar */}
        <div className="relative h-5 overflow-hidden rounded-full bg-gray-800">
          {
            data.partyTallies.slice(0, 8).reduce<{ bars: React.ReactNode[]; offset: number }>(
              ({ bars, offset }, t) => {
                const w = (t.total / data.totalSeats) * 100
                bars.push(
                  <div
                    key={t.party}
                    className="absolute top-0 h-full transition-all duration-700"
                    title={`${t.party}: ${t.total}`}
                    style={{
                      left: `${offset}%`,
                      width: `${w}%`,
                      backgroundColor: getPartyColor(t.party),
                    }}
                  />,
                )
                return { bars, offset: offset + w }
              },
              { bars: [], offset: 0 },
            ).bars
          }

          {/* majority line */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white/80 z-10"
            style={{ left: `${majorityPct}%` }}
          >
            <span className="absolute -top-5 left-1 text-[9px] text-white/60 whitespace-nowrap">
              ½ way
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: scoreboard */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-gray-800 overflow-y-auto bg-gray-950">
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Party Tally</p>
            <div className="space-y-1">
              {data.partyTallies.slice(0, 10).map((t) => (
                <PartyRow
                  key={t.party}
                  party={t.party}
                  seats={t.seats}
                  leading={t.leading}
                  total={t.total}
                  maxSeats={maxSeats}
                  isActive={activeParty === t.party}
                  onClick={() => handlePartyFilter(t.party)}
                />
              ))}
            </div>
          </div>

          {activeParty && (
            <button
              onClick={() => setActiveParty(null)}
              className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/15"
            >
              <X className="h-3 w-3" />
              Clear filter
            </button>
          )}

          {/* Trending seats */}
          {trendingSeats.length > 0 && (
            <div className="border-t border-gray-800 px-3 pt-3 pb-2">
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] uppercase tracking-widest text-gray-400">
                  Trending Seats
                </p>
              </div>
              <div className="space-y-1">
                {trendingSeats.map((seat) => (
                  <button
                    key={seat.assemblyId}
                    onClick={() => {
                      const feature = geoJson?.features?.find(
                        (f: any) => getFeatureAssemblyId(f) === seat.assemblyId,
                      )
                      if (!feature) return
                      const centroid = getPolygonCentroid(feature.geometry.coordinates)
                      setSelectedId(seat.assemblyId)
                      setPopupPos(centroid)
                      if (mapRef.current) mapRef.current.flyTo(centroid, 9, { duration: 0.8 })
                      trackClicked({
                        name: 'election_results_map',
                        page_name: PAGE_NAMES.ELECTION_RESULTS,
                        assembly_id: seat.assemblyId,
                        source: 'trending_panel',
                      })
                    }}
                    className="group flex w-full items-center justify-between rounded-lg bg-gray-900 px-2 py-1.5 hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-xs font-semibold text-white">{seat.assemblyName}</p>
                      <p className="text-[10px] text-gray-400">{seat.districtName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: getPartyColor(seat.winnerParty) }}
                      >
                        {seat.winnerParty}
                      </span>
                      <Zap className="h-3 w-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Centre: map */}
        <main className="relative flex-1 overflow-hidden">
          <MapContainer
            style={{ height: '100%', width: '100%', background: '#111827' }}
            center={[11.1271, 78.6569]}
            zoom={7}
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

          {/* map legend */}
          <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-white/10 bg-gray-950/90 px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="mb-1.5 text-[10px] uppercase tracking-widest text-gray-400">Legend</p>
            <div className="space-y-1">
              {[
                { color: '#10b981', label: 'Declared' },
                { color: '#3b82f6', label: 'Leading' },
                { color: '#f59e0b', label: 'Counting' },
                { color: '#374151', label: 'Pending' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
                  <span className="text-xs text-gray-300">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* refresh hint */}
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 rounded-full bg-gray-950/80 px-3 py-1 text-[11px] text-gray-400 backdrop-blur-sm">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            Live count in progress
          </div>
        </main>

        {/* Right: status breakdown */}
        <aside className="flex w-48 shrink-0 flex-col border-l border-gray-800 bg-gray-950 overflow-y-auto">
          <div className="px-3 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Seat Status</p>

            {[
              { label: 'Declared', count: data.declared, color: 'bg-emerald-500' },
              {
                label: 'Leading',
                count: data.partyTallies.reduce((s, t) => s + t.leading, 0),
                color: 'bg-blue-500',
              },
              { label: 'Counting', count: data.counting, color: 'bg-amber-500' },
              { label: 'Pending', count: data.pending, color: 'bg-gray-600' },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className="text-sm font-bold text-white">{item.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-1.5 rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${(item.count / data.totalSeats) * 100}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-4 rounded-lg bg-gray-900 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">Total Seats</p>
              <p className="text-3xl font-extrabold text-white">{data.totalSeats}</p>
              <p className="text-[11px] text-gray-400">Majority: {data.majorityMark}</p>
            </div>

            {topParty && (
              <div
                className="mt-3 rounded-lg p-3"
                style={{
                  backgroundColor: `${getPartyColor(topParty.party)}22`,
                  borderLeft: `3px solid ${getPartyColor(topParty.party)}`,
                }}
              >
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Leading Party</p>
                <p className="text-lg font-extrabold text-white">{topParty.party}</p>
                <p
                  className="text-2xl font-extrabold"
                  style={{ color: getPartyColor(topParty.party) }}
                >
                  {topParty.total}
                </p>
                {topParty.swing !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <ChevronRight
                      className={`h-3 w-3 ${topParty.swing > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      style={{ transform: topParty.swing < 0 ? 'rotate(90deg)' : 'rotate(-90deg)' }}
                    />
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
