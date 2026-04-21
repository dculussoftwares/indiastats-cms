'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BarChart3, ExternalLink, Flame, MapPin, Search, User, X } from 'lucide-react'

import '@/components/AssemblyMap/leaflet-style-import'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ElectionPredictionDataset, PredictionMapEntry } from '@/lib/electionPredictions'
import { buildAssemblyUrl } from '@/lib/assemblyRouting'
import { getPartyColor } from '@/lib/partyColors'

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

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
      if (highlight.value === 'close') return entry.isCloseContest && entry.predictedWinningParty !== null
      return !entry.isCloseContest && entry.predictedWinningParty !== null
  }
}

const getFeatureAssemblyId = (feature: any): string | null =>
  feature?.properties?.ac ? `ac${String(feature.properties.ac).padStart(3, '0')}` : null

const getPolygonCentroid = (coords: any): [number, number] => {
  const fallback: [number, number] = [11.1271, 78.6569]

  try {
    if (!Array.isArray(coords) || coords.length === 0) return fallback

    let points = coords[0]
    if (Array.isArray(coords[0]?.[0]?.[0])) {
      points = coords[0][0]
    }

    if (!Array.isArray(points) || points.length === 0) return fallback

    let lng = 0
    let lat = 0
    let validPoints = 0

    for (const point of points) {
      if (Array.isArray(point) && point.length >= 2 && !Number.isNaN(point[0]) && !Number.isNaN(point[1])) {
        lng += point[0]
        lat += point[1]
        validPoints++
      }
    }

    if (validPoints === 0) return fallback
    return [lat / validPoints, lng / validPoints]
  } catch {
    return fallback
  }
}

const getDisplayText = (value: string | null | undefined): string => {
  if (!value) return ''

  const parts = value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)

  return parts[parts.length - 1] ?? value
}

const NativeGeoJSON = ({
  data,
  style,
  onEachFeature,
  refreshKey,
}: {
  data: any
  style: any
  onEachFeature: any
  refreshKey?: string
}) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const map = require('react-leaflet').useMap()
  const geoJsonLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !L) return

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current)
    }

    geoJsonLayerRef.current = L.geoJSON(data, {
      style,
      onEachFeature,
    }).addTo(map)

    return () => {
      if (geoJsonLayerRef.current && map) {
        map.removeLayer(geoJsonLayerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, refreshKey])

  return null
}

function SummaryCard({
  caption,
  helper,
  value,
}: {
  caption: string
  helper: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">{caption}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

export function ElectionPredictionMap({
  initialData,
  map,
  stateCode,
  stateName,
}: ElectionPredictionMapProps) {
  const router = useRouter()

  const [dataset, setDataset] = useState(initialData)
  const [selectedPredictorId, setSelectedPredictorId] = useState(
    initialData.selectedPredictor?.id ?? '',
  )
  const [selectedYear, setSelectedYear] = useState(initialData.electionYear)
  const [viewMode, setViewMode] = useState<ViewMode>('winner')
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [districtSearchQuery, setDistrictSearchQuery] = useState('')
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [popupContent, setPopupContent] = useState<PopupContent | null>(null)
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightFilter, setHighlightFilter] = useState<HighlightFilter>(null)
  const mapRef = useRef<any>(null)

  const assemblyOptions = useMemo(() => {
    if (!Array.isArray(map?.features)) return []

    return map.features
      .map((feature: any) => {
        const assemblyId = getFeatureAssemblyId(feature)
        const name = feature?.properties?.ac_name

        if (!assemblyId || !name) return null

        return { assemblyId, name }
      })
      .filter((entry: { assemblyId: string; name: string } | null): entry is { assemblyId: string; name: string } => entry !== null)
  }, [map])

  const districtOptions = useMemo(() => {
    if (!Array.isArray(map?.features)) return []

    return Array.from(
      new Set(
        map.features
          .map((feature: any) => feature?.properties?.pc_name)
          .filter((name: string | null | undefined): name is string => Boolean(name)),
      ),
    ).sort()
  }, [map])

  const filteredAssemblies = useMemo(() => {
    if (!searchQuery) return assemblyOptions.slice(0, 8)

    return assemblyOptions
      .filter((entry) => entry.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8)
  }, [assemblyOptions, searchQuery])

  const filteredDistricts = useMemo(() => {
    if (!districtSearchQuery) return districtOptions

    return districtOptions.filter((district) =>
      district.toLowerCase().includes(districtSearchQuery.toLowerCase()),
    )
  }, [districtOptions, districtSearchQuery])

  const typeColorMap = useMemo(() => {
    const mapping: Record<string, string> = {}

    dataset.predictionTypeCounts.forEach((item, index) => {
      mapping[item.key] = TYPE_COLORS[index % TYPE_COLORS.length]
    })

    return mapping
  }, [dataset.predictionTypeCounts])

  const toggleHighlight = (next: HighlightFilter) => {
    if (
      highlightFilter &&
      next &&
      highlightFilter.type === next.type &&
      highlightFilter.value === next.value
    ) {
      setHighlightFilter(null)
    } else {
      setHighlightFilter(next)
    }
  }

  const loadDataset = async (nextPredictorId: string, nextYear?: number) => {
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        predictorId: nextPredictorId,
        stateCode,
      })

      if (nextYear) {
        params.set('electionYear', String(nextYear))
      }

      const response = await fetch(`/api/election-predictions?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load prediction dataset')
      }

      const nextData = (await response.json()) as ElectionPredictionDataset
      setDataset(nextData)
      setSelectedPredictorId(nextData.selectedPredictor?.id ?? '')
      setSelectedYear(nextData.electionYear)
      setSelectedAssemblyId(null)
      setSelectedDistrict(null)
      setDistrictSearchQuery('')
      setSearchQuery('')
      setPopupContent(null)
      setPopupPosition(null)
      setHighlightFilter(null)
    } catch (error) {
      console.error('Failed to fetch election predictions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const focusAssemblyById = (assemblyId: string) => {
    const feature = map?.features?.find((item: any) => getFeatureAssemblyId(item) === assemblyId)
    if (!feature) return

    const centroid = feature.geometry
      ? getPolygonCentroid((feature.geometry as { coordinates: unknown }).coordinates)
      : null

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

    if (mapRef.current) {
      mapRef.current.flyTo(centroid, 9, { duration: 0.8 })
    }
  }

  const handleDistrictSelect = (district: string | null) => {
    setSelectedDistrict(district)
    setDistrictSearchQuery(district ?? '')
    setShowDistrictDropdown(false)

    if (!district) {
      if (mapRef.current) {
        mapRef.current.setView([11.1271, 78.6569], 7)
      }
      return
    }

    const districtFeatures = map?.features?.filter(
      (feature: any) => feature?.properties?.pc_name === district,
    )

    if (!districtFeatures || districtFeatures.length === 0 || !L || !mapRef.current) {
      return
    }

    const points: [number, number][] = []

    districtFeatures.forEach((feature: any) => {
      if (!feature.geometry?.coordinates) return

      let coords = feature.geometry.coordinates[0]
      if (Array.isArray(coords?.[0]?.[0])) {
        coords = coords[0]
      }

      coords.forEach((point: any) => {
        if (Array.isArray(point) && point.length >= 2) {
          points.push([point[1], point[0]])
        }
      })
    })

    if (points.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(points), { padding: [18, 18] })
    }
  }

  const getPredictionFill = (entry: PredictionMapEntry | undefined): string => {
    if (!entry) return '#e2e8f0'

    if (viewMode === 'heat') {
      if (entry.predictedWinningParty === null) return '#b45309'
      if (entry.isCloseContest) return '#f97316'
      return '#0f766e'
    }

    if (viewMode === 'type') {
      return typeColorMap[entry.predictionType] || '#475569'
    }

    if (entry.predictedWinningParty) {
      return getPartyColor(entry.predictedWinningParty)
    }

    return '#d97706'
  }

  const styleFeature = (feature: any) => {
    const assemblyId = getFeatureAssemblyId(feature)
    const entry = assemblyId ? dataset.results[assemblyId] : undefined
    const isSelected = assemblyId === selectedAssemblyId
    const isWithinDistrict = !selectedDistrict || feature?.properties?.pc_name === selectedDistrict
    const isHighlighted = highlightFilter ? matchesHighlight(entry, highlightFilter) : true
    const isDimmed = !isWithinDistrict || !isHighlighted

    const borderColor = isSelected
      ? '#111827'
      : !isHighlighted
        ? '#cbd5e1'
        : entry?.predictedWinningParty === null
          ? '#7c2d12'
          : entry?.isCloseContest
            ? '#9a3412'
            : '#ffffff'

    return {
      color: isDimmed ? '#cbd5e1' : borderColor,
      fillColor: getPredictionFill(entry),
      fillOpacity: isSelected ? 0.96 : isDimmed ? 0.15 : 0.88,
      opacity: 1,
      weight: isSelected ? 2.8 : !isHighlighted ? 0.5 : entry?.isCloseContest || entry?.predictedWinningParty === null ? 1.8 : 1,
    }
  }

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: (event: any) => {
        event.originalEvent?.stopPropagation()

        const assemblyId = getFeatureAssemblyId(feature)
        if (!assemblyId) return

        setSelectedAssemblyId(assemblyId)
        setSearchQuery(feature?.properties?.ac_name ?? '')
        setPopupContent({
          ac: feature?.properties?.ac,
          ac_name: feature?.properties?.ac_name,
          assemblyId,
          pc_name: feature?.properties?.pc_name,
        })
        setPopupPosition([event.latlng.lat, event.latlng.lng])
      },
      mouseover: (event: any) => {
        event.target.bringToFront()
        event.target.setStyle({
          color: '#111827',
          fillOpacity: 0.96,
          weight: 2.4,
        })
      },
      mouseout: (event: any) => {
        event.target.setStyle(styleFeature(feature))
      },
    })
  }

  const refreshKey = [
    dataset.selectedPredictor?.id ?? 'none',
    dataset.electionYear,
    viewMode,
    selectedAssemblyId ?? 'none',
    selectedDistrict ?? 'all',
    highlightFilter ? `${highlightFilter.type}:${highlightFilter.value}` : 'nofilter',
  ].join('-')

  const winnerLegendItems = useMemo(() => {
    const items = dataset.topParties.slice(0, 8).map((party) => ({
      color: getPartyColor(party.key),
      count: party.count,
      label: party.key,
    }))

    if (dataset.summary.tooCloseToCall > 0) {
      items.push({
        color: '#d97706',
        count: dataset.summary.tooCloseToCall,
        label: 'Too close to call',
      })
    }

    return items
  }, [dataset.summary.tooCloseToCall, dataset.topParties])

  const popupEntry = popupContent ? dataset.results[popupContent.assemblyId] : null
  const leadingPartyText = dataset.summary.leadingParty
    ? `${dataset.summary.leadingParty} · ${dataset.summary.leadingPartySeats}`
    : 'No clear lead'

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-red-100 bg-gradient-to-r from-white via-red-50/40 to-white">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-red-200 bg-white">
                {dataset.selectedPredictor?.imagePath ? (
                  <Image
                    src={dataset.selectedPredictor.imagePath}
                    alt={dataset.selectedPredictor.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-red-100 text-red-700">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    Prediction Map
                  </span>
                  <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-700">
                    {stateName} {dataset.electionYear}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {dataset.selectedPredictor?.name ?? 'Election Forecast'}
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {dataset.selectedPredictor?.bio ??
                    'Interactive assembly-by-assembly forecast with predictor-led calls, close contests, and dead heats.'}
                </p>
              </div>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2 md:min-w-[280px]">
              <div className="rounded-lg border border-red-100 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                  Visualization
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  Party forecast, contest heat, and prediction type lenses
                </p>
              </div>
              <div className="rounded-lg border border-red-100 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                  Read the map
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                  Strong calls stay crisp, toss-ups surface in amber, and watchlist seats sit below
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          caption="Leading Forecast"
          helper="Called seats only"
          value={leadingPartyText}
        />
        <SummaryCard
          caption="Called Seats"
          helper={`${dataset.summary.totalAssemblies} total constituencies loaded`}
          value={String(dataset.summary.calledSeats)}
        />
        <SummaryCard
          caption="Too Close To Call"
          helper="No explicit winning party forecast"
          value={String(dataset.summary.tooCloseToCall)}
        />
        <SummaryCard
          caption="Close Contests"
          helper="Seats flagged as tight fights"
          value={String(dataset.summary.closeContests)}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                placeholder="Search constituency..."
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-red-600 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
              {showDropdown && filteredAssemblies.length > 0 && (
                <div className="absolute z-[1100] mt-1 max-h-56 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {filteredAssemblies.map((assembly) => (
                    <button
                      key={assembly.assemblyId}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        setShowDropdown(false)
                        focusAssemblyById(assembly.assemblyId)
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {assembly.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={districtSearchQuery}
                placeholder="Filter district..."
                onChange={(event) => {
                  setDistrictSearchQuery(event.target.value)
                  setShowDistrictDropdown(true)
                }}
                onFocus={() => setShowDistrictDropdown(true)}
                className="w-full rounded border border-gray-200 bg-white py-2 pl-10 pr-9 text-sm focus:border-red-600 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              />
              {selectedDistrict && (
                <button
                  onClick={() => handleDistrictSelect(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {showDistrictDropdown && filteredDistricts.length > 0 && (
                <div className="absolute z-[1100] mt-1 max-h-56 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {!districtSearchQuery && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleDistrictSelect(null)}
                    >
                      All districts
                    </button>
                  )}
                  {filteredDistricts.map((district) => (
                    <button
                      key={district}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedDistrict === district ? 'bg-red-50 text-red-700' : ''
                      }`}
                      onClick={() => handleDistrictSelect(district)}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPredictorId}
                onChange={(event) => {
                  const nextPredictorId = event.target.value
                  setSelectedPredictorId(nextPredictorId)
                  void loadDataset(nextPredictorId, selectedYear)
                }}
                className="h-9 rounded border border-gray-200 bg-white px-3 text-sm focus:border-red-600 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              >
                {dataset.predictors.map((predictor) => (
                  <option key={predictor.id} value={predictor.id}>
                    {predictor.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(event) => {
                  const nextYear = Number(event.target.value)
                  setSelectedYear(nextYear)
                  void loadDataset(selectedPredictorId, nextYear)
                }}
                className="h-9 rounded border border-gray-200 bg-white px-3 text-sm focus:border-red-600 focus:outline-none dark:border-gray-700 dark:bg-gray-900"
              >
                {dataset.availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <div className="flex items-center rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
                {[
                  { label: 'Winner', value: 'winner' as const },
                  { label: 'Heat', value: 'heat' as const },
                  { label: 'Type', value: 'type' as const },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      viewMode === mode.value
                        ? 'bg-white text-red-600 shadow-sm dark:bg-gray-900'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {highlightFilter && (
                <button
                  onClick={() => setHighlightFilter(null)}
                  className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                >
                  <X className="h-3 w-3" />
                  {highlightFilter.type === 'party' && highlightFilter.value}
                  {highlightFilter.type === 'predictionType' && highlightFilter.value}
                  {highlightFilter.type === 'heatLevel' &&
                    (highlightFilter.value === 'stable'
                      ? 'Stable calls'
                      : highlightFilter.value === 'close'
                        ? 'Close contests'
                        : 'Too close to call')}
                </button>
              )}

              {selectedAssemblyId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAssemblyId(null)
                    setSearchQuery('')
                    setPopupContent(null)
                    setPopupPosition(null)
                  }}
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-[1200] flex items-center justify-center rounded border bg-white/85 backdrop-blur-sm dark:bg-gray-950/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin dark:border-gray-700" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Updating prediction map
                </p>
                <p className="text-xs text-muted-foreground">
                  Loading {dataset.selectedPredictor?.name} for {selectedYear}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="h-[620px] w-full overflow-hidden rounded border border-gray-200 dark:border-gray-700">
          <MapContainer
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            center={[11.1271, 78.6569]}
            zoom={7}
            scrollWheelZoom={true}
            ref={mapRef}
          >
            <NativeGeoJSON
              data={map as GeoJSON.GeoJsonObject}
              onEachFeature={onEachFeature}
              style={styleFeature}
              refreshKey={refreshKey}
            />

            {popupPosition && popupContent && (
              <Popup position={popupPosition}>
                <div className="min-w-[260px] p-1">
                  <p className="text-sm font-bold text-gray-900">{popupContent.ac_name}</p>
                  <p className="mb-2 text-xs text-gray-500">{popupContent.pc_name}</p>

                  {popupEntry ? (
                    <>
                      <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            {popupEntry.predictedWinningParty ? 'Predicted winner' : 'Too close to call'}
                          </p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 border">
                            {popupEntry.predictionType}
                          </span>
                        </div>

                        {popupEntry.predictedWinningParty ? (
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="rounded px-2 py-1 text-[11px] font-bold text-white"
                              style={{ backgroundColor: getPartyColor(popupEntry.predictedWinningParty) }}
                            >
                              {popupEntry.predictedWinningParty}
                            </span>
                            {popupEntry.isCloseContest && (
                              <span className="rounded bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                                Close fight
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {popupEntry.closeParties.map((party) => (
                              <span
                                key={party}
                                className="rounded px-2 py-1 text-[11px] font-bold text-white"
                                style={{ backgroundColor: getPartyColor(party) }}
                              >
                                {party}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {popupEntry.additionalNotes && (
                        <div className="mb-3 rounded border border-gray-200 bg-white p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                            Note
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-700">
                            {popupEntry.additionalNotes}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="mb-3 text-xs text-gray-500">No prediction data available for this seat.</p>
                  )}

                  <button
                    className="flex w-full items-center justify-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                    onClick={() => {
                      const url = buildAssemblyUrl(popupContent.ac)
                      if (url) router.push(url)
                    }}
                  >
                    View Assembly
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </Popup>
            )}
          </MapContainer>
        </div>

        <div className="absolute bottom-3 right-3 z-[1000] max-w-[220px] rounded border border-gray-200 bg-white/95 px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900/95">
          <p className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-300">
            {viewMode === 'winner'
              ? `${dataset.electionYear} Forecast`
              : viewMode === 'heat'
                ? 'Contest Intensity'
                : 'Prediction Types'}
          </p>

          <div className="space-y-1 max-h-[210px] overflow-y-auto">
            {viewMode === 'winner' &&
              winnerLegendItems.map((item) => {
                const isTooClose = item.label === 'Too close to call'
                const filter: HighlightFilter = isTooClose
                  ? { type: 'heatLevel', value: 'tooClose' }
                  : { type: 'party', value: item.label }
                const isActive = highlightFilter?.type === filter?.type && highlightFilter?.value === filter?.value

                return (
                  <button
                    key={item.label}
                    onClick={() => toggleHighlight(filter)}
                    className={`flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs transition-all ${
                      isActive ? 'bg-red-100 dark:bg-red-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 rounded-sm border border-white/60" style={{ backgroundColor: item.color }} />
                      <span className={`font-medium ${isActive ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>{item.label}</span>
                    </div>
                    <span className={isActive ? 'font-semibold text-red-600' : 'text-gray-500 dark:text-gray-400'}>{item.count}</span>
                  </button>
                )
              })}

            {viewMode === 'heat' && (
              <>
                {([
                  {
                    color: '#0f766e',
                    count: dataset.summary.calledSeats - dataset.summary.closeContests,
                    heatValue: 'stable' as const,
                    label: 'Stable calls',
                  },
                  {
                    color: '#f97316',
                    count: dataset.summary.closeContests,
                    heatValue: 'close' as const,
                    label: 'Close contests',
                  },
                  {
                    color: '#b45309',
                    count: dataset.summary.tooCloseToCall,
                    heatValue: 'tooClose' as const,
                    label: 'Too close to call',
                  },
                ]).map((item) => {
                  const isActive =
                    highlightFilter?.type === 'heatLevel' && highlightFilter.value === item.heatValue

                  return (
                    <button
                      key={item.label}
                      onClick={() => toggleHighlight({ type: 'heatLevel', value: item.heatValue })}
                      className={`flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs transition-all ${
                        isActive ? 'bg-red-100 dark:bg-red-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-sm border border-white/60" style={{ backgroundColor: item.color }} />
                        <span className={`font-medium ${isActive ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>{item.label}</span>
                      </div>
                      <span className={isActive ? 'font-semibold text-red-600' : 'text-gray-500 dark:text-gray-400'}>{item.count}</span>
                    </button>
                  )
                })}
              </>
            )}

            {viewMode === 'type' &&
              dataset.predictionTypeCounts.slice(0, 10).map((item) => {
                const isActive =
                  highlightFilter?.type === 'predictionType' && highlightFilter.value === item.key

                return (
                  <button
                    key={item.key}
                    onClick={() => toggleHighlight({ type: 'predictionType', value: item.key })}
                    className={`flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-xs transition-all ${
                      isActive ? 'bg-red-100 dark:bg-red-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-sm border border-white/60"
                        style={{ backgroundColor: typeColorMap[item.key] || '#475569' }}
                      />
                      <span className={`font-medium ${isActive ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>{item.key}</span>
                    </div>
                    <span className={isActive ? 'font-semibold text-red-600' : 'text-gray-500 dark:text-gray-400'}>{item.count}</span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Seat Forecast</h3>
            </div>

            <div className="space-y-1.5">
              {dataset.topParties.length > 0 ? (
                dataset.topParties.slice(0, 8).map((party) => {
                  const width = (party.count / Math.max(dataset.summary.totalAssemblies, 1)) * 100
                  const isActive =
                    highlightFilter?.type === 'party' && highlightFilter.value === party.key

                  return (
                    <button
                      key={party.key}
                      onClick={() => toggleHighlight({ type: 'party', value: party.key })}
                      className={`w-full rounded-lg p-2 text-left transition-all ${
                        isActive
                          ? 'bg-red-50 ring-2 ring-red-500 dark:bg-red-950'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: getPartyColor(party.key) }}
                          />
                          <span className={`font-medium ${isActive ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'}`}>
                            {party.key}
                          </span>
                        </div>
                        <span className={`text-xs font-semibold ${isActive ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {party.count}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: getPartyColor(party.key),
                            width: `${Math.max(width, 2)}%`,
                          }}
                        />
                      </div>
                    </button>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No called seats in this forecast yet.</p>
              )}

              {dataset.summary.tooCloseToCall > 0 && (
                <button
                  onClick={() => toggleHighlight({ type: 'heatLevel', value: 'tooClose' })}
                  className={`w-full rounded-lg p-2 text-left transition-all ${
                    highlightFilter?.type === 'heatLevel' && highlightFilter.value === 'tooClose'
                      ? 'bg-red-50 ring-2 ring-red-500 dark:bg-red-950'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-amber-600" />
                      <span className={`font-medium ${
                        highlightFilter?.type === 'heatLevel' && highlightFilter.value === 'tooClose'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>Too close to call</span>
                    </div>
                    <span className={`text-xs font-semibold ${
                      highlightFilter?.type === 'heatLevel' && highlightFilter.value === 'tooClose'
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`}>{dataset.summary.tooCloseToCall}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-amber-600 transition-all"
                      style={{
                        width: `${Math.max((dataset.summary.tooCloseToCall / Math.max(dataset.summary.totalAssemblies, 1)) * 100, 2)}%`,
                      }}
                    />
                  </div>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prediction Type Mix</h3>
            </div>

            <div className="space-y-1.5">
              {dataset.predictionTypeCounts.slice(0, 10).map((item) => {
                const width = (item.count / Math.max(dataset.summary.totalAssemblies, 1)) * 100
                const isActive =
                  highlightFilter?.type === 'predictionType' && highlightFilter.value === item.key

                return (
                  <button
                    key={item.key}
                    onClick={() => toggleHighlight({ type: 'predictionType', value: item.key })}
                    className={`w-full rounded-lg p-2 text-left transition-all ${
                      isActive
                        ? 'bg-red-50 ring-2 ring-red-500 dark:bg-red-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: typeColorMap[item.key] || '#475569' }}
                        />
                        <span className={`font-medium ${isActive ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-gray-200'}`}>
                          {item.key}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          backgroundColor: typeColorMap[item.key] || '#475569',
                          width: `${Math.max(width, 2)}%`,
                        }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Watchlist Seats</h3>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {dataset.watchlist.slice(0, 18).map((entry) => (
                <button
                  key={entry.assemblyId}
                  onClick={() => focusAssemblyById(entry.assemblyId)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-red-200 hover:bg-red-50/40 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-red-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {getDisplayText(entry.assemblyName)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getDisplayText(entry.districtName)}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {entry.predictionType}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.predictedWinningParty ? (
                      <span
                        className="rounded px-2 py-1 text-[11px] font-bold text-white"
                        style={{ backgroundColor: getPartyColor(entry.predictedWinningParty) }}
                      >
                        {entry.predictedWinningParty}
                      </span>
                    ) : (
                      entry.closeParties.map((party) => (
                        <span
                          key={party}
                          className="rounded px-2 py-1 text-[11px] font-bold text-white"
                          style={{ backgroundColor: getPartyColor(party) }}
                        >
                          {party}
                        </span>
                      ))
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Click any constituency to inspect • Click parties, types, or legend items to highlight on the map • Click again to clear
      </p>
    </div>
  )
}

export default ElectionPredictionMap
