'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ExternalLink, MapPin } from 'lucide-react'

import '@/components/AssemblyMap/leaflet-style-import'
import { getPartyColor } from '@/lib/partyColors'
import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'
import type { ConstituencyResult } from '@/lib/electionAnalysis'
import { PartyLogo } from '@/components/PartyLogo'
import { formatNumber } from '@/utilities/formatNumber'
import { getEnglishName } from '@/utilities/bilingualName'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const L = require('leaflet') as any

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), {
  ssr: false,
})

function acToId(ac: number): string {
  return `ac${String(ac).padStart(3, '0')}`
}

export type ElectionAnalysisMapProps = {
  constituencies: ConstituencyResult[]
  stateSlug: string
  year: number
}

// ── GeoLayer — child of MapContainer, uses useMap() to get the Leaflet instance
function GeoLayer({
  resultMap,
  onClickConstituency,
}: {
  resultMap: Record<string, ConstituencyResult>
  onClickConstituency: (latLng: [number, number], c: ConstituencyResult) => void
}) {
  // useMap() only works inside a MapContainer child
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const map = require('react-leaflet').useMap()
  const layerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !L) return

    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    const geoLayer = L.geoJSON(TamilNaduGeoJson, {
      style: (feature: any) => {
        const ac = feature?.properties?.ac
        if (!ac) return { fillColor: '#e5e7eb', weight: 0.5, color: '#d1d5db', fillOpacity: 0.85 }
        const result = resultMap[acToId(ac)]
        return {
          fillColor: result ? getPartyColor(result.winner.party) : '#e5e7eb',
          weight: 0.8,
          color: '#ffffff',
          fillOpacity: 0.85,
        }
      },
      onEachFeature: (feature: any, layer: any) => {
        const ac = feature?.properties?.ac
        if (!ac) return
        const result = resultMap[acToId(ac)]

        layer.on({
          mouseover: (e: any) => {
            e.target.setStyle({ weight: 2, color: '#1f2937', fillOpacity: 0.95 })
            e.target.bringToFront()
          },
          mouseout: () => geoLayer.resetStyle(layer),
          click: (e: any) => {
            if (!result) return
            onClickConstituency([e.latlng.lat, e.latlng.lng], result)
          },
        })

        const acName = feature?.properties?.ac_name ?? ''
        layer.bindTooltip(result ? `${acName} — ${result.winner.party}` : acName, {
          sticky: true,
          direction: 'top',
          offset: [0, -4],
        })
      },
    })

    geoLayer.addTo(map)
    layerRef.current = geoLayer

    try {
      const bounds = geoLayer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [8, 8] })
    } catch {
      // ignore
    }

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, resultMap])

  return null
}

// ── Zoom control ──────────────────────────────────────────────────────────────
function ZoomControl({ mapRef }: { mapRef: React.RefObject<any> }) {
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow overflow-hidden">
      <button
        aria-label="Zoom in"
        onClick={() => mapRef.current?.zoomIn()}
        className="flex h-7 w-7 items-center justify-center border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-base font-light leading-none"
      >
        +
      </button>
      <button
        aria-label="Zoom out"
        onClick={() => mapRef.current?.zoomOut()}
        className="flex h-7 w-7 items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-base font-light leading-none"
      >
        −
      </button>
    </div>
  )
}

// ── Constituency popup ────────────────────────────────────────────────────────
function ConstituencyPopup({
  constituency: c,
  stateSlug,
  onClose,
}: {
  constituency: ConstituencyResult
  stateSlug: string
  onClose: () => void
}) {
  const winnerColor = getPartyColor(c.winner.party)
  const runnerColor = getPartyColor(c.runnerUp.party)
  const name = getEnglishName(c.assemblyName)
  const district = getEnglishName(c.districtName)
  const href = `/${stateSlug}/assembly/${c.districtSlug}/${c.assemblySlug}`

  return (
    <div className="text-[12px] leading-relaxed min-w-[200px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-bold text-[13px]">{name}</p>
          <p className="text-gray-500 text-[10px]">{district}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0 leading-none mt-0.5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div
        className="rounded px-2 py-1.5 mb-1.5"
        style={{ backgroundColor: winnerColor + '18', borderLeft: `3px solid ${winnerColor}` }}
      >
        <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-0.5">
          Winner
        </p>
        <p className="font-bold" style={{ color: winnerColor }}>
          {c.winner.name}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: winnerColor }}
          >
            {c.winner.party}
          </span>
          <span className="text-[11px] font-semibold tabular-nums">{formatNumber(c.winner.votes)}</span>
        </div>
      </div>

      {c.runnerUp.party && (
        <div className="rounded px-2 py-1.5 mb-2 border border-gray-100">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 mb-0.5">
            Runner-up
          </p>
          <p className="font-semibold text-gray-700">{c.runnerUp.name}</p>
          <div className="flex items-center justify-between mt-0.5">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: runnerColor + '22', color: runnerColor }}
            >
              {c.runnerUp.party}
            </span>
            <span className="text-[11px] tabular-nums text-gray-600">
              {formatNumber(c.runnerUp.votes)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 mb-2 text-center">
        <div className="bg-gray-50 rounded px-1 py-1">
          <p className="text-[11px] font-bold text-gray-800">{formatNumber(c.margin)}</p>
          <p className="text-[9px] text-gray-500">margin</p>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1">
          <p className="text-[11px] font-bold text-gray-800">{c.marginPct}%</p>
          <p className="text-[9px] text-gray-500">margin %</p>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1">
          <p className="text-[11px] font-bold text-gray-800">{c.turnoutPct}%</p>
          <p className="text-[9px] text-gray-500">turnout</p>
        </div>
      </div>

      <Link
        href={href}
        className="flex items-center justify-center gap-1 w-full rounded border border-gray-200 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
      >
        Full constituency details
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ElectionAnalysisMapInner({
  constituencies,
  stateSlug,
  year,
}: ElectionAnalysisMapProps) {
  const mapRef = useRef<any>(null)
  const [popup, setPopup] = useState<{
    latLng: [number, number]
    constituency: ConstituencyResult
  } | null>(null)

  const resultMap = React.useMemo(() => {
    const m: Record<string, ConstituencyResult> = {}
    for (const c of constituencies) m[c.assemblyId] = c
    return m
  }, [constituencies])

  const partySeatMap = React.useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of constituencies) {
      m[c.winner.party] = (m[c.winner.party] ?? 0) + 1
    }
    return Object.entries(m)
      .map(([party, seats]) => ({ party, seats }))
      .sort((a, b) => b.seats - a.seats)
      .slice(0, 8)
  }, [constituencies])

  const handleClickConstituency = React.useCallback(
    (latLng: [number, number], c: ConstituencyResult) => setPopup({ latLng, constituency: c }),
    [],
  )

  return (
    <div className="relative rounded border border-border overflow-hidden bg-white dark:bg-gray-950">
      <div className="relative h-[480px] w-full">
        <MapContainer
          ref={mapRef}
          center={[11.0, 78.5]}
          zoom={7}
          zoomControl={false}
          className="h-full w-full"
          style={{ background: '#f8fafc' }}
        >
          {/* GeoLayer is a child of MapContainer so it can use useMap() */}
          <GeoLayer resultMap={resultMap} onClickConstituency={handleClickConstituency} />

          {popup && (
            <Popup
              position={popup.latLng}
              eventHandlers={{ remove: () => setPopup(null) }}
              maxWidth={260}
              minWidth={220}
            >
              <ConstituencyPopup
                constituency={popup.constituency}
                stateSlug={stateSlug}
                onClose={() => setPopup(null)}
              />
            </Popup>
          )}
        </MapContainer>

        <ZoomControl mapRef={mapRef} />
      </div>

      <div className="border-t border-border px-4 py-3 bg-white dark:bg-gray-950">
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
          {partySeatMap.map(({ party, seats }) => (
            <span key={party} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: getPartyColor(party) }}
              />
              <PartyLogo party={party} size={14} />
              <span className="font-semibold">{party}</span>
              <span className="text-muted-foreground">{seats}</span>
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Click a constituency for details
          </span>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 bg-red-50 dark:bg-red-950/20 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{year} Election Results</span> — view live
          count, constituency-level tally & TV-mode map
        </p>
        <Link
          href={`/${stateSlug}/election-results`}
          className="inline-flex items-center gap-1.5 rounded border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors flex-shrink-0"
        >
          View Election Results
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

export default ElectionAnalysisMapInner
