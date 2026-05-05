'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, ExternalLink, X, Layers, Maximize2, Minimize2 } from 'lucide-react'
import { getPartyColor } from '@/lib/partyColors'
import { MapStatsDashboard } from '@/components/MapStatsDashboard'
import { ElectionInsightsPanel } from '@/components/ElectionInsightsPanel'
import { ClosestRacesPanel } from '@/components/ClosestRacesPanel'
import { AllianceSummary } from '@/components/AllianceSummary'
import { CasteInsightsPanel } from '@/components/CasteInsightsPanel'
import { trackClicked, getPageContext, setPageContext, PAGE_NAMES } from '@/analytics'
import { buildAssemblyUrl } from '@/lib/assemblyRouting'
import './leaflet-style-import'

// Dynamic imports for react-leaflet (SSR disabled)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })

// Import Leaflet only on client-side to avoid SSR "window is not defined" error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let L: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DivIcon: any = null
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  L = require('leaflet')
  DivIcon = L.DivIcon
}

export type MapStats = {
  totalAssemblies: number
  totalDistricts: number
  reservedSeats: number
  generalSeats: number
  voters: { male: number; female: number; trans: number; total: number }
  quickStats?: {
    largestConstituency: { name: string; voters: number; assemblyId: string }
    smallestConstituency: { name: string; voters: number; assemblyId: string } | null
    highestFemaleRatio: { name: string; ratio: number; assemblyId: string }
    mostBooths: { name: string; booths: number; assemblyId: string }
  }
}

export type CasteDataMap = Record<
  string,
  {
    caste: string | null
    percentage: number
    rank2Caste?: string | null
    rank2Percentage?: number
    rank3Caste?: string | null
    rank3Percentage?: number
    rank4Caste?: string | null
    rank4Percentage?: number
    rank5Caste?: string | null
    rank5Percentage?: number
  }
>

export type AssemblyMapProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any
  // Optional prefetched data to skip API calls
  prefetchedMapStats?: MapStats
  prefetchedCasteData?: CasteDataMap
}

// Alliance colors now come from database via API

// Get color from allianceColors map (passed from API)
function getAllianceColor(allianceName: string, allianceColorsMap: Record<string, string>): string {
  return allianceColorsMap[allianceName] || '#6b7280'
}
// Caste color palette (avoiding orange and green) - all castes from database
const CASTE_COLORS: Record<string, string> = {
  // Major castes with distinct colors
  Vanniars: '#3b82f6', // blue-500
  Muslims: '#8b5cf6', // violet-500
  Paraiyar: '#06b6d4', // cyan-500
  'Adhi dravidar': '#ec4899', // pink-500
  'Nadar (Non Christian)': '#f43f5e', // rose-500
  'Nadar (Christian)': '#f472b6', // pink-400
  Nadar: '#ef4444', // red-500
  'Vellala Gounders': '#6366f1', // indigo-500
  Vellalar: '#818cf8', // indigo-400
  Mudaliyar: '#a855f7', // purple-500
  Mukulathor: '#0ea5e9', // sky-500 (Thevar group)
  Meenavar: '#7c3aed', // violet-600
  Udayar: '#2563eb', // blue-600
  'Nayar/Malayali': '#0891b2', // cyan-600
  Chettiar: '#9333ea', // purple-600
  // Additional castes with vibrant colors
  Arunthathiyar: '#e11d48', // rose-600
  'Devendra kula vellalar': '#1d4ed8', // blue-700
  Mutharaiyar: '#7e22ce', // purple-700
  Naidu: '#0369a1', // sky-700
  Okaligar: '#be185d', // pink-700
  Padugar: '#4338ca', // indigo-700
  Pallar: '#0f766e', // teal-700
  Pillaimar: '#6d28d9', // violet-700
  'Scheduled tribes': '#854d0e', // yellow-800 (brownish)
  Sourashtra: '#9f1239', // rose-800
  Ambalam: '#1e40af', // blue-800
  // Fallback
  _default: '#64748b', // slate-500 for unknown
}

function getCasteColor(casteName: string | null): string {
  if (!casteName) return CASTE_COLORS['_default']
  return CASTE_COLORS[casteName] || CASTE_COLORS['_default']
}

// Get color based on view mode (party, alliance, or caste)
function getDisplayColor(
  party: string,
  viewMode: 'party' | 'alliance' | 'caste',
  partyToAlliance: Record<string, string>,
  allianceColorsMap: Record<string, string>,
  casteData?: { caste: string | null; percentage: number } | null,
): string {
  if (viewMode === 'caste' && casteData?.caste) {
    return getCasteColor(casteData.caste)
  }
  if (viewMode === 'alliance') {
    const alliance = partyToAlliance[party] || 'Others'
    return getAllianceColor(alliance, allianceColorsMap)
  }
  return getPartyColor(party)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPcNameColorMap = (features: any[]) => {
  const pcNames = Array.from(new Set(features.map((f) => f.properties?.pc_name)))
  const colors = [
    '#cbd5e1',
    '#d4d4d8',
    '#d6d3d1',
    '#d1d5db',
    '#d4d4d4',
    '#e2e0db',
    '#cfd8d4',
    '#d1d5d4',
    '#d4d1cc',
    '#dbd8d3',
    '#c7d0d2',
    '#d6d2cc',
    '#d1d7d3',
    '#d4d4d4',
    '#cfcfcf',
    '#d4cfca',
    '#c9d1ce',
    '#d5d5d1',
    '#d1d1d5',
    '#cbcfcf',
    '#ccd4d5',
    '#d3ceca',
    '#cdd3cf',
    '#d2d2d2',
    '#d0d0d0',
    '#d1cdc9',
    '#c8d0cd',
    '#d4d4d0',
    '#d0d0d4',
    '#cacece',
    '#cbd3d4',
    '#d2cdc9',
    '#ccd2ce',
    '#d1d1d1',
    '#cfcfcf',
    '#d0ccc8',
    '#c7cfcc',
    '#d3d3cf',
    '#cfcfd3',
    '#c9cdcd',
  ]
  const pcNameColorMap: Record<string, string> = {}
  pcNames.forEach((name, idx) => {
    pcNameColorMap[name as string] = colors[idx % colors.length]
  })
  return pcNameColorMap
}

// Calculate polygon centroid
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPolygonCentroid(coords: any): [number, number] {
  const defaultCenter: [number, number] = [11.1271, 78.6569]
  try {
    if (!coords || !Array.isArray(coords) || coords.length === 0) return defaultCenter

    let points = coords[0]
    if (Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0])) {
      points = coords[0][0]
    }

    if (!points || !Array.isArray(points) || points.length === 0) return defaultCenter

    let validPoints = 0
    let x = 0,
      y = 0

    for (let i = 0; i < points.length; i++) {
      if (
        Array.isArray(points[i]) &&
        points[i].length >= 2 &&
        !isNaN(points[i][0]) &&
        !isNaN(points[i][1])
      ) {
        x += points[i][0]
        y += points[i][1]
        validPoints++
      }
    }

    if (validPoints === 0) return defaultCenter

    const lng = x / validPoints
    const lat = y / validPoints

    if (isNaN(lat) || isNaN(lng)) return defaultCenter

    return [lat, lng]
  } catch {
    return defaultCenter
  }
}

// Calculate polygon width
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPolygonWidth(coords: any) {
  let points = coords[0]
  if (Array.isArray(coords[0][0][0])) {
    points = coords[0][0]
  }
  let minLng = points[0][0],
    maxLng = points[0][0]
  for (let i = 1; i < points.length; i++) {
    minLng = Math.min(minLng, points[i][0])
    maxLng = Math.max(maxLng, points[i][0])
  }
  return Math.abs(maxLng - minLng)
}

// Zoom listener component
const MapZoomListener = ({ setZoomLevel }: { setZoomLevel: (z: number) => void }) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const map = require('react-leaflet').useMap()
  useEffect(() => {
    const onZoom = () => setZoomLevel(map.getZoom())
    map.on('zoomend', onZoom)
    return () => map.off('zoomend', onZoom)
  }, [map, setZoomLevel])
  return null
}

// Map sync handler - syncs this map's view changes to another map
const MapSyncHandler = ({
  targetMapRef,
  isSyncing,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetMapRef: React.RefObject<any>
  isSyncing: React.RefObject<boolean>
}) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const map = require('react-leaflet').useMap()

  useEffect(() => {
    const syncToTarget = () => {
      if (isSyncing.current || !targetMapRef.current) return
      isSyncing.current = true
      const center = map.getCenter()
      const zoom = map.getZoom()
      targetMapRef.current.setView(center, zoom, { animate: false })
      setTimeout(() => {
        isSyncing.current = false
      }, 50)
    }

    map.on('moveend', syncToTarget)
    map.on('zoomend', syncToTarget)

    return () => {
      map.off('moveend', syncToTarget)
      map.off('zoomend', syncToTarget)
    }
  }, [map, targetMapRef, isSyncing])

  return null
}

// Native GeoJSON component that uses Leaflet directly for proper event binding
const NativeGeoJSON = ({
  data,
  style,
  onEachFeature,
  refreshKey,
  interactive = true,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEachFeature: any
  refreshKey?: string
  interactive?: boolean
}) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const map = require('react-leaflet').useMap()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geoJsonLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !L) return

    // Remove existing layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current)
    }

    // Create new GeoJSON layer with native Leaflet
    geoJsonLayerRef.current = L.geoJSON(data, {
      style,
      onEachFeature,
      interactive, // Pass interactive option to disable mouse events
    }).addTo(map)

    return () => {
      if (geoJsonLayerRef.current && map) {
        map.removeLayer(geoJsonLayerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, refreshKey]) // Only re-render on refreshKey change, not style/onEachFeature

  return null
}

export function AssemblyMap({ map, prefetchedMapStats, prefetchedCasteData }: AssemblyMapProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ASSEMBLY_MAP,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    })
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [popupContent, setPopupContent] = useState<any | null>(null)
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null)
  const [zoomLevel, setZoomLevel] = useState(7)
  const [selectedAssembly, setSelectedAssembly] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  // New state for visual enhancements
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [districtSearchQuery, setDistrictSearchQuery] = useState('')
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showDistrictBoundaries, setShowDistrictBoundaries] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hideElectionYearHint, setHideElectionYearHint] = useState(false)
  // Election overlay state
  const [selectedElectionYear, setSelectedElectionYear] = useState<number | null>(null)
  const [electionResults, setElectionResults] = useState<
    Record<string, { party: string; candidateName: string; votes: number }>
  >({})
  const [partyCounts, setPartyCounts] = useState<Record<string, number>>({})
  const [closestRaces, setClosestRaces] = useState<
    Array<{
      assemblyId: string
      assemblyName: string
      winner: { name: string; party: string; votes: number }
      runnerUp: { name: string; party: string; votes: number }
      margin: number
    }>
  >([])
  const [topTwoParties, setTopTwoParties] = useState<string[]>([])
  const [allianceSeats, setAllianceSeats] = useState<
    Array<{
      allianceName: string
      seats: number
      parties: string[]
      color?: string
    }>
  >([])
  const [partyToAlliance, setPartyToAlliance] = useState<Record<string, string>>({})
  const [allianceColorsMap, setAllianceColorsMap] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'party' | 'alliance' | 'caste'>('party')
  const [casteDataMap, setCasteDataMap] = useState<
    Record<
      string,
      {
        caste: string | null
        percentage: number
        rank2Caste?: string | null
        rank2Percentage?: number
        rank3Caste?: string | null
        rank3Percentage?: number
        rank4Caste?: string | null
        rank4Percentage?: number
        rank5Caste?: string | null
        rank5Percentage?: number
      }
    >
  >({})
  const [isLoadingElection, setIsLoadingElection] = useState(false)
  // Compare mode state
  const [compareMode, setCompareMode] = useState(false)
  const [compareYear, setCompareYear] = useState<number | null>(null)
  const [compareElectionResults, setCompareElectionResults] = useState<
    Record<string, { party: string; candidateName: string; votes: number }>
  >({})
  const [comparePartyCounts, setComparePartyCounts] = useState<Record<string, number>>({})
  const [isLoadingCompare, setIsLoadingCompare] = useState(false)
  // Map stats state
  const [mapStats, setMapStats] = useState<{
    totalAssemblies: number
    totalDistricts: number
    reservedSeats: number
    generalSeats: number
    voters: { male: number; female: number; trans: number; total: number }
  } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // Compare mode map refs for sync
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leftMapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rightMapRef = useRef<any>(null)
  const isSyncing = useRef(false)
  // Track selected states in refs for use in event handlers
  const selectedAssemblyRef = useRef<string | null>(null)
  const selectedDistrictRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Track election year in ref for event handlers
  const selectedElectionYearRef = useRef<number | null>(null)
  const electionResultsRef = useRef<
    Record<string, { party: string; candidateName: string; votes: number }>
  >({})
  const viewModeRef = useRef<'party' | 'alliance' | 'caste'>('party')
  const partyToAllianceRef = useRef<Record<string, string>>({})
  const allianceColorsRef = useRef<Record<string, string>>({})
  const casteDataMapRef = useRef<Record<string, { caste: string | null; percentage: number }>>({})

  // Sync viewMode to ref for use in event handlers
  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  // Sync casteDataMap to ref for use in event handlers
  useEffect(() => {
    casteDataMapRef.current = casteDataMap
  }, [casteDataMap])

  // Auto-swap years in compare mode: ensure Year 1 (left) is older, Year 2 (right) is newer
  useEffect(() => {
    if (compareMode && selectedElectionYear && compareYear && selectedElectionYear > compareYear) {
      // Swap the years
      const olderYear = compareYear
      const newerYear = selectedElectionYear
      setSelectedElectionYear(olderYear)
      setCompareYear(newerYear)
    }
  }, [compareMode, selectedElectionYear, compareYear])

  // Fetch map stats on mount (or use prefetched data)
  useEffect(() => {
    // If prefetched data is provided, use it instead of making an API call
    if (prefetchedMapStats) {
      setMapStats(prefetchedMapStats)
      setIsLoadingStats(false)
      return
    }

    const fetchMapStats = async () => {
      try {
        const response = await fetch('/api/map-stats')
        if (response.ok) {
          const data = await response.json()
          setMapStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch map stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }
    fetchMapStats()
  }, [prefetchedMapStats])

  // Fetch caste data on mount (or use prefetched data)
  useEffect(() => {
    // If prefetched data is provided, use it instead of making an API call
    if (prefetchedCasteData) {
      setCasteDataMap(prefetchedCasteData)
      return
    }

    const fetchCasteData = async () => {
      try {
        const response = await fetch('/api/caste-data?all=true')
        if (response.ok) {
          const data = await response.json()
          const casteMap: Record<
            string,
            {
              caste: string | null
              percentage: number
              rank2Caste?: string | null
              rank2Percentage?: number
              rank3Caste?: string | null
              rank3Percentage?: number
              rank4Caste?: string | null
              rank4Percentage?: number
              rank5Caste?: string | null
              rank5Percentage?: number
            }
          > = {}
          data.assemblies?.forEach(
            (a: {
              assemblyId: string
              rank1Caste: string | null
              rank1Percentage: number
              rank2Caste: string | null
              rank2Percentage: number
              rank3Caste: string | null
              rank3Percentage: number
              rank4Caste: string | null
              rank4Percentage: number
              rank5Caste: string | null
              rank5Percentage: number
            }) => {
              casteMap[a.assemblyId] = {
                caste: a.rank1Caste,
                percentage: a.rank1Percentage || 0,
                rank2Caste: a.rank2Caste,
                rank2Percentage: a.rank2Percentage || 0,
                rank3Caste: a.rank3Caste,
                rank3Percentage: a.rank3Percentage || 0,
                rank4Caste: a.rank4Caste,
                rank4Percentage: a.rank4Percentage || 0,
                rank5Caste: a.rank5Caste,
                rank5Percentage: a.rank5Percentage || 0,
              }
            },
          )
          setCasteDataMap(casteMap)
        }
      } catch (error) {
        console.error('Failed to fetch caste data:', error)
      }
    }
    fetchCasteData()
  }, [prefetchedCasteData])

  // Fetch election results when year changes
  useEffect(() => {
    selectedElectionYearRef.current = selectedElectionYear

    if (!selectedElectionYear) {
      setElectionResults({})
      setPartyCounts({})
      electionResultsRef.current = {}
      return
    }

    const fetchElectionResults = async () => {
      setIsLoadingElection(true)
      try {
        const response = await fetch(`/api/election-results?year=${selectedElectionYear}`)
        if (response.ok) {
          const data = await response.json()
          setElectionResults(data.results || {})
          setPartyCounts(data.partyCounts || {})
          setClosestRaces(data.closestRaces || [])
          setTopTwoParties(data.topTwoParties || [])
          setAllianceSeats(data.allianceSeats || [])
          setPartyToAlliance(data.partyToAlliance || {})
          setAllianceColorsMap(data.allianceColors || {})
          electionResultsRef.current = data.results || {}
          partyToAllianceRef.current = data.partyToAlliance || {}
          allianceColorsRef.current = data.allianceColors || {}
        }
      } catch (error) {
        console.error('Failed to fetch election results:', error)
      } finally {
        setIsLoadingElection(false)
      }
    }

    fetchElectionResults()
  }, [selectedElectionYear])

  // Fetch compare year election results when in compare mode
  useEffect(() => {
    if (!compareMode || !compareYear) {
      setCompareElectionResults({})
      setComparePartyCounts({})
      return
    }

    const fetchCompareResults = async () => {
      setIsLoadingCompare(true)
      try {
        const response = await fetch(`/api/election-results?year=${compareYear}`)
        if (response.ok) {
          const data = await response.json()
          setCompareElectionResults(data.results || {})
          setComparePartyCounts(data.partyCounts || {})
        }
      } catch (error) {
        console.error('Failed to fetch compare election results:', error)
      } finally {
        setIsLoadingCompare(false)
      }
    }

    fetchCompareResults()
  }, [compareMode, compareYear])

  // Ref-based callback to clear district selection (for use in event handlers with stale closures)
  const clearDistrictSelectionRef = useRef<() => void>(() => {})
  clearDistrictSelectionRef.current = () => {
    console.log('Inside clearDistrictSelectionRef callback - calling setters')
    setSelectedDistrict(null)
    setDistrictSearchQuery('')
    selectedDistrictRef.current = null
    console.log('Setters called successfully')
  }

  const pcNameColorMap = useMemo(() => getPcNameColorMap(map.features || []), [map])

  // Compute district boundaries GeoJSON by grouping assemblies by pc_name
  const districtBoundariesGeoJson = useMemo(() => {
    if (!map.features) return null

    // Group features by pc_name (district)
    const featuresByDistrict: Record<string, any[]> = {}
    map.features.forEach((f: any) => {
      const pcName = f.properties?.pc_name
      if (pcName) {
        if (!featuresByDistrict[pcName]) {
          featuresByDistrict[pcName] = []
        }
        featuresByDistrict[pcName].push(f)
      }
    })

    // Create a feature collection with just the outer boundaries
    const districtFeatures = Object.entries(featuresByDistrict).map(([pcName, features]) => {
      // Collect all coordinates from all features in this district
      const allCoordinates = features
        .map((f: any) => {
          if (f.geometry.type === 'Polygon') {
            return f.geometry.coordinates
          } else if (f.geometry.type === 'MultiPolygon') {
            return f.geometry.coordinates.flat()
          }
          return []
        })
        .flat()

      return {
        type: 'Feature',
        properties: { pc_name: pcName },
        geometry: {
          type: 'MultiPolygon',
          coordinates: allCoordinates.map((coords: any) => [coords]),
        },
      }
    })

    return {
      type: 'FeatureCollection',
      features: districtFeatures,
    }
  }, [map])

  // Get unique district (PC) names
  const districtOptions = useMemo(() => {
    if (!map.features) return []
    return Array.from(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Set(map.features.map((f: any) => f.properties?.pc_name).filter(Boolean)),
    ).sort() as string[]
  }, [map])

  const assemblyOptions = useMemo(() => {
    if (!map.features) return []
    return Array.from(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Set(map.features.map((f: any) => f.properties?.ac_name).filter(Boolean)),
    ) as string[]
  }, [map])

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return assemblyOptions.slice(0, 8)
    return assemblyOptions
      .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8)
  }, [searchQuery, assemblyOptions])

  // Filtered district options for searchable dropdown
  const filteredDistrictOptions = useMemo(() => {
    if (!districtSearchQuery) return districtOptions
    return districtOptions.filter((name) =>
      name.toLowerCase().includes(districtSearchQuery.toLowerCase()),
    )
  }, [districtSearchQuery, districtOptions])

  // Handle feature interactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    console.log('[DEBUG] onEachFeature called for:', feature?.properties?.ac_name)
    layer.on({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseover: (event: any) => {
        event.target.bringToFront()

        // In election overlay mode, only highlight border, keep party fill color
        if (selectedElectionYearRef.current) {
          event.target.setStyle({
            color: '#000000', // Black border on hover
            weight: 3,
          })
        } else {
          event.target.setStyle({
            color: '#dc2626', // BBC red on hover
            weight: 2,
            fillOpacity: 0.8,
          })
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseout: (event: any) => {
        const acName = feature?.properties?.ac_name
        const pcName = feature?.properties?.pc_name
        const assemblyId = feature?.properties?.ac
          ? `ac${String(feature.properties.ac).padStart(3, '0')}`
          : null

        // Election overlay mode - restore party/alliance/caste color
        if (
          selectedElectionYearRef.current &&
          assemblyId &&
          electionResultsRef.current[assemblyId]
        ) {
          const isSelected = selectedAssemblyRef.current === acName
          const result = electionResultsRef.current[assemblyId]
          const casteInfo = casteDataMapRef.current[assemblyId] || null
          const displayColor = getDisplayColor(
            result.party,
            viewModeRef.current,
            partyToAllianceRef.current,
            allianceColorsRef.current,
            casteInfo,
          )

          event.target.setStyle({
            color: isSelected ? '#000000' : '#ffffff',
            fillColor: displayColor,
            fillOpacity: isSelected ? 0.95 : 0.8,
            weight: isSelected ? 3 : 1,
          })
          return
        }

        // Keep red style if this is the selected assembly (non-election mode)
        if (selectedAssemblyRef.current === acName) {
          event.target.setStyle({
            color: '#dc2626',
            fillColor: '#fecaca',
            fillOpacity: 0.9,
            weight: 2,
          })
        }
        // Keep highlighted style if this assembly is in the selected district
        else if (selectedDistrictRef.current && pcName === selectedDistrictRef.current) {
          event.target.setStyle({
            color: '#dc2626',
            fillColor: '#fecaca',
            fillOpacity: 0.7,
            weight: 1.5,
          })
        }
        // Dim non-selected districts when a district is selected
        else if (selectedDistrictRef.current && pcName !== selectedDistrictRef.current) {
          event.target.bringToBack()
          event.target.setStyle({
            color: '#d1d5db',
            fillColor: '#f3f4f6',
            fillOpacity: 0.3,
            opacity: 1,
            weight: 0.5,
          })
        }
        // Default style
        else {
          event.target.bringToBack()
          event.target.setStyle({
            color: '#6b7280',
            fillColor: pcNameColorMap[pcName] || '#e5e7eb',
            fillOpacity: 0.6,
            opacity: 1,
            weight: 1,
          })
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      click: (e: any) => {
        e.originalEvent?.stopPropagation()
        e.originalEvent?.preventDefault()
        console.log('=== ASSEMBLY CLICK HANDLER ===')

        const { lat, lng } = e.latlng
        const acName = feature?.properties?.ac_name
        const pcName = feature?.properties?.pc_name
        const assemblyId = feature?.properties?.ac
          ? `ac${String(feature.properties.ac).padStart(3, '0')}`
          : null

        // Track the assembly click
        const pageContext = getPageContext()
        trackClicked({
          name: 'link',
          page_name: pageContext.page_name || 'Assembly Map',
          link_name: 'view_assembly_from_map',
          link_location: 'interactive_map',
        })

        // Check if clicking within the currently selected district
        const isWithinSelectedDistrict =
          selectedDistrictRef.current && pcName === selectedDistrictRef.current

        // Only clear district selection if clicking OUTSIDE the selected district
        if (!isWithinSelectedDistrict) {
          clearDistrictSelectionRef.current()
        }

        // Update both state and ref for assembly selection
        selectedAssemblyRef.current = acName || null
        setSelectedAssembly(acName || null)
        setSearchQuery(acName || '')
        setPopupContent(feature.properties || 'No data available')
        setPopupPosition([lat, lng])

        // Keep the red style on click
        e.target.setStyle({
          color: '#dc2626',
          fillColor: '#fecaca',
          fillOpacity: 0.9,
          weight: 2,
        })
      },
    })
  }

  // Handle search selection - clears district selection (dropdown = select only that assembly)
  const handleAssemblySearch = (value: string) => {
    // Track the search selection
    const pageContext = getPageContext()
    trackClicked({
      name: 'search_result',
      page_name: pageContext.page_name || 'Assembly Map',
      search_query: value,
      result_id: value,
      result_name: value,
      result_type: 'assembly',
      result_position: 1,
      search_type: 'map',
    })

    // Clear district selection when selecting from assembly dropdown
    selectedDistrictRef.current = null
    setSelectedDistrict(null)
    setDistrictSearchQuery('')

    // Update assembly selection
    selectedAssemblyRef.current = value || null
    setSelectedAssembly(value)
    setSearchQuery(value)
    setShowDropdown(false)

    if (value && map.features) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feature = map.features.find((f: any) => f.properties && f.properties.ac_name === value)

      if (feature && feature.geometry) {
        const centroid = getPolygonCentroid(feature.geometry.coordinates)
        setPopupContent(feature.properties)
        setPopupPosition(centroid)

        if (mapRef.current) {
          mapRef.current.flyTo(centroid, 10, { duration: 1 })
        }
      }
    } else {
      setPopupPosition(null)
      setPopupContent(null)
    }
  }

  // Handle URL parameter for direct assembly highlight
  useEffect(() => {
    const acParam = searchParams.get('ac')
    if (acParam && map.features) {
      const acNum = String(Number(acParam))
      const feature = map.features.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => f.properties && String(Number(f.properties.ac)) === acNum,
      )
      if (feature && feature.geometry) {
        const centroid = getPolygonCentroid(feature.geometry.coordinates)
        setPopupContent(feature.properties)
        setPopupPosition(centroid)
      }
    }
  }, [searchParams, map])

  // Handle URL parameter for direct district filter
  useEffect(() => {
    const districtParam = searchParams.get('district')

    if (districtParam && districtOptions.length > 0) {
      // Decode the district name
      const districtName = decodeURIComponent(districtParam)

      // Find matching district (case-insensitive)
      // Support both exact match and partial match (for bilingual names like "திண்டுக்கல் / DINDIGUL")
      const matchingDistrict = districtOptions.find((d) => {
        const lower = d.toLowerCase()
        const paramLower = districtName.toLowerCase()

        // Exact match
        if (lower === paramLower) return true

        // Check if district option contains the parameter (for bilingual names)
        if (lower.includes(paramLower)) return true

        // Check if parameter contains the district option (reverse check)
        if (paramLower.includes(lower)) return true

        // Check against English part after "/" for bilingual formats
        const parts = districtName.split('/').map((p) => p.trim().toLowerCase())
        if (parts.some((part) => part === lower || lower.includes(part) || part.includes(lower))) {
          return true
        }

        return false
      })

      if (matchingDistrict) {
        // Apply district filter using existing handler
        handleDistrictSelect(matchingDistrict)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, districtOptions])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styleFeature = (feature: any) => {
    const pcName = feature?.properties?.pc_name
    const assemblyId = feature?.properties?.ac
      ? `ac${String(feature.properties.ac).padStart(3, '0')}`
      : null
    const isSelected = selectedAssembly === feature?.properties?.ac_name
    const isInSelectedDistrict = !selectedDistrict || pcName === selectedDistrict
    const dimmed = selectedDistrict && !isInSelectedDistrict

    // Election overlay mode - use party/alliance/caste colors
    if (selectedElectionYear && assemblyId && electionResults[assemblyId]) {
      const result = electionResults[assemblyId]
      const casteInfo = assemblyId ? casteDataMap[assemblyId] : null
      const displayColor = getDisplayColor(
        result.party,
        viewMode,
        partyToAlliance,
        allianceColorsMap,
        casteInfo,
      )

      return {
        color: isSelected ? '#000000' : '#ffffff',
        fillColor: displayColor,
        fillOpacity: isSelected ? 0.95 : 0.8,
        opacity: 1,
        weight: isSelected ? 3 : 1,
      }
    }

    // No election data for this assembly in selected year
    if (selectedElectionYear && assemblyId) {
      return {
        color: '#9ca3af',
        fillColor: '#e5e7eb',
        fillOpacity: 0.4,
        opacity: 1,
        weight: 0.5,
      }
    }

    // Default mode (no election overlay) - existing behavior
    const isHighlighted = isSelected || (selectedDistrict && !dimmed)

    return {
      color: isHighlighted ? '#dc2626' : dimmed ? '#d1d5db' : '#6b7280',
      fillColor: isSelected
        ? '#fecaca'
        : isHighlighted
          ? '#fee2e2'
          : dimmed
            ? '#f3f4f6'
            : pcNameColorMap[pcName] || '#e5e7eb',
      fillOpacity: isSelected ? 0.9 : isHighlighted ? 0.7 : dimmed ? 0.3 : 0.6,
      opacity: 1,
      weight: isSelected ? 2 : isHighlighted ? 1.5 : dimmed ? 0.5 : 1,
    }
  }

  // Handle district selection
  const handleDistrictSelect = (district: string | null) => {
    // Track the district filter
    if (district) {
      const pageContext = getPageContext()
      trackClicked({
        name: 'search_filter',
        page_name: pageContext.page_name || 'Assembly Map',
        filter_name: 'district',
        filter_value: district,
      })
    }

    // Clear assembly selection when selecting a district (keep only last selection)
    selectedAssemblyRef.current = null
    setSelectedAssembly(null)
    setSearchQuery('')
    setPopupPosition(null)
    setPopupContent(null)

    // Update district selection
    selectedDistrictRef.current = district
    setSelectedDistrict(district)
    setDistrictSearchQuery(district || '')
    setShowDistrictDropdown(false)

    if (district && mapRef.current) {
      // Find all features in this district and fit bounds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const districtFeatures = map.features?.filter((f: any) => f.properties?.pc_name === district)
      if (districtFeatures && districtFeatures.length > 0) {
        const allCoords: [number, number][] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        districtFeatures.forEach((f: any) => {
          if (f.geometry?.coordinates) {
            let coords = f.geometry.coordinates[0]
            if (Array.isArray(coords[0][0])) coords = coords[0]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            coords.forEach((c: any) => {
              if (Array.isArray(c) && c.length >= 2) allCoords.push([c[1], c[0]])
            })
          }
        })
        if (allCoords.length > 0) {
          const bounds = L.latLngBounds(allCoords)
          mapRef.current.fitBounds(bounds, { padding: [20, 20] })
        }
      }
    } else if (!district && mapRef.current) {
      // Reset to default view
      mapRef.current.setView([11.1271, 78.6569], 7)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Invalidate map size after transition
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 300)
  }

  const clearSelection = () => {
    setSelectedAssembly(null)
    setSearchQuery('')
    setPopupPosition(null)
    setPopupContent(null)
  }

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-[2000] bg-white dark:bg-gray-950 p-4' : 'space-y-4'}`}
    >
      {/* Map Stats Dashboard - only show when not fullscreen */}
      {!isFullscreen && <MapStatsDashboard stats={mapStats} isLoading={isLoadingStats} />}

      {/* Search and District Filter - BBC Style */}
      <Card className={`border-l-4 border-l-red-600 ${isFullscreen ? 'mb-4' : ''}`}>
        <CardContent className="py-4 px-4">
          <div className="flex gap-3 items-end flex-wrap">
            {/* Constituency Search */}
            <div className="relative flex-1 min-w-[220px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Constituency
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                <input
                  type="text"
                  placeholder="Search constituency…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-9 h-11 text-sm border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:border-red-600 dark:focus:border-red-500 placeholder:text-gray-400 font-medium shadow-sm transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setShowDropdown(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showDropdown && filteredOptions.length > 0 && (
                <div className="absolute z-[1100] w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {filteredOptions.map((name) => (
                    <button
                      key={name}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-red-50 dark:hover:bg-gray-800 flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                      onClick={() => handleAssemblySearch(name)}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* District Dropdown - Searchable */}
            <div className="relative min-w-[200px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                District
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                <input
                  type="text"
                  placeholder="Filter by district…"
                  value={districtSearchQuery}
                  onChange={(e) => {
                    setDistrictSearchQuery(e.target.value)
                    setShowDistrictDropdown(true)
                  }}
                  onFocus={() => setShowDistrictDropdown(true)}
                  className="w-full pl-10 pr-9 h-11 text-sm border-2 border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:border-red-600 dark:focus:border-red-500 placeholder:text-gray-400 font-medium shadow-sm transition-colors"
                />
                {selectedDistrict && (
                  <button
                    onClick={() => handleDistrictSelect(null)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Clear district filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showDistrictDropdown && filteredDistrictOptions.length > 0 && (
                <div className="absolute z-[1100] w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {!districtSearchQuery && (
                    <button
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-red-50 dark:hover:bg-gray-800 text-red-600 font-semibold border-b border-gray-100 dark:border-gray-800 transition-colors"
                      onClick={() => handleDistrictSelect(null)}
                    >
                      All Districts
                    </button>
                  )}
                  {filteredDistrictOptions.map((district) => (
                    <button
                      key={district}
                      className={`w-full px-4 py-2.5 text-sm text-left border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors ${
                        selectedDistrict === district
                          ? 'bg-red-50 text-red-700 font-semibold dark:bg-red-950/40 dark:text-red-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => handleDistrictSelect(district)}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active filter pills */}
            {(searchQuery || selectedDistrict) && (
              <div className="flex items-center gap-2 pb-0.5">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                    <MapPin className="h-3 w-3" />
                    {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-0.5 hover:text-red-900 dark:hover:text-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedDistrict && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
                    {selectedDistrict}
                    <button
                      onClick={() => handleDistrictSelect(null)}
                      className="ml-0.5 hover:text-red-900 dark:hover:text-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={showDistrictBoundaries ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDistrictBoundaries(!showDistrictBoundaries)}
                className="px-3 gap-1.5"
                title="Toggle district boundaries"
              >
                <Layers className="h-4 w-4" />
                <span className="text-xs">
                  {showDistrictBoundaries ? 'Hide District' : 'Show District'}
                </span>
              </Button>

              {/* View Mode Selector - Solo vs Compare */}
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  onClick={() => {
                    setCompareMode(false)
                    setCompareYear(null)
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    !compareMode
                      ? 'bg-white dark:bg-gray-900 text-red-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Solo View
                </button>
                <button
                  onClick={() => setCompareMode(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    compareMode
                      ? 'bg-white dark:bg-gray-900 text-red-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Compare
                </button>
              </div>

              {/* Year Selectors based on mode */}
              {!compareMode ? (
                // Solo View - Single Year Selector + View Mode Toggle
                <>
                  <div className="relative">
                    <select
                      value={selectedElectionYear || ''}
                      onChange={(e) =>
                        setSelectedElectionYear(e.target.value ? Number(e.target.value) : null)
                      }
                      className="h-9 px-3 text-xs border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      <option value="">Election Year</option>
                      {[
                        2026, 2021, 2016, 2011, 2006, 2001, 1996, 1991, 1989, 1984, 1980, 1977,
                        1971, 1967, 1962, 1957, 1952,
                      ].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {isLoadingElection && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Party/Alliance/Caste View Toggle - only show when election year is selected */}
                  {selectedElectionYear && allianceSeats.length > 0 && (
                    <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <button
                        onClick={() => setViewMode('party')}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                          viewMode === 'party'
                            ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Party
                      </button>
                      <button
                        onClick={() => setViewMode('alliance')}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                          viewMode === 'alliance'
                            ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Alliance
                      </button>
                      <button
                        onClick={() => setViewMode('caste')}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                          viewMode === 'caste'
                            ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Caste
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Compare View - Two Year Selectors with VS indicator
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute -top-2 left-2 px-1 text-[10px] font-bold text-red-600 bg-white dark:bg-gray-900">
                      FROM
                    </div>
                    <select
                      value={selectedElectionYear || ''}
                      onChange={(e) =>
                        setSelectedElectionYear(e.target.value ? Number(e.target.value) : null)
                      }
                      className="h-9 px-3 pt-1 text-xs border-2 border-red-200 rounded bg-white dark:bg-gray-900 focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      <option value="">Select</option>
                      {[
                        2026, 2021, 2016, 2011, 2006, 2001, 1996, 1991, 1989, 1984, 1980, 1977,
                        1971, 1967, 1962, 1957, 1952,
                      ]
                        .filter((year) => year !== compareYear)
                        .map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                    </select>
                    {isLoadingElection && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-bold text-gray-500 px-1">VS</span>

                  <div className="relative">
                    <div className="absolute -top-2 left-2 px-1 text-[10px] font-bold text-blue-600 bg-white dark:bg-gray-900">
                      TO
                    </div>
                    <select
                      value={compareYear || ''}
                      onChange={(e) =>
                        setCompareYear(e.target.value ? Number(e.target.value) : null)
                      }
                      className="h-9 px-3 pt-1 text-xs border-2 border-blue-200 rounded bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">Select</option>
                      {[
                        2026, 2021, 2016, 2011, 2006, 2001, 1996, 1991, 1989, 1984, 1980, 1977,
                        1971, 1967, 1962, 1957, 1952,
                      ]
                        .filter((year) => year !== selectedElectionYear)
                        .map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                    </select>
                    {isLoadingCompare && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="px-2"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              {selectedAssembly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="px-2"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container - Compare Mode or Single Map */}
      <div className="relative">
        {compareMode && compareYear ? (
          // COMPARE MODE: Two maps side by side
          <div className={`flex gap-2 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[550px]'}`}>
            {/* Left Map - Year 1 */}
            <div className="flex-1 relative rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Year Label */}
              <div className="absolute top-2 right-2 z-[1000] bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow flex items-center gap-1.5">
                <span>{selectedElectionYear}</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                  {Object.keys(electionResults).length} seats
                </span>
              </div>
              {isLoadingElection && (
                <div className="absolute inset-0 z-[1500] bg-white/80 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <MapContainer
                style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                center={[11.1271, 78.6569]}
                zoom={7}
                scrollWheelZoom={true}
                ref={leftMapRef}
              >
                <MapSyncHandler targetMapRef={rightMapRef} isSyncing={isSyncing} />
                <NativeGeoJSON
                  data={map as GeoJSON.GeoJsonObject}
                  onEachFeature={(feature: GeoJSON.Feature, layer: L.Layer) => {
                    ;(layer as L.Path).on({
                      click: (e: L.LeafletMouseEvent) => {
                        e.originalEvent?.stopPropagation()
                        const acName = feature?.properties?.ac_name
                        setSelectedAssembly(acName || null)
                        setSearchQuery(acName || '')
                        setPopupContent(feature.properties || null)
                        setPopupPosition([e.latlng.lat, e.latlng.lng])
                      },
                    })
                  }}
                  style={(feature: GeoJSON.Feature) => {
                    const acName = feature?.properties?.ac_name
                    const pcName = feature?.properties?.pc_name
                    const assemblyId = feature?.properties?.ac
                      ? `ac${String(feature.properties.ac).padStart(3, '0')}`
                      : null
                    const isSelected = selectedAssembly === acName
                    const isInSelectedDistrict = selectedDistrict && pcName === selectedDistrict
                    const dimmed = selectedDistrict && pcName !== selectedDistrict

                    // Has election data
                    if (selectedElectionYear && assemblyId && electionResults[assemblyId]) {
                      const result = electionResults[assemblyId]
                      const partyColor = getPartyColor(result.party)
                      return {
                        color: isSelected
                          ? '#000000'
                          : isInSelectedDistrict
                            ? '#dc2626'
                            : '#ffffff',
                        fillColor: dimmed ? '#e5e7eb' : partyColor,
                        fillOpacity: isSelected ? 0.95 : dimmed ? 0.3 : 0.8,
                        weight: isSelected ? 3 : isInSelectedDistrict ? 2 : 1,
                      }
                    }
                    // No election data
                    return {
                      color: isSelected ? '#000000' : '#9ca3af',
                      fillColor: '#e5e7eb',
                      fillOpacity: isSelected ? 0.6 : dimmed ? 0.2 : 0.4,
                      weight: isSelected ? 3 : 0.5,
                    }
                  }}
                  refreshKey={`compare-left-${selectedElectionYear}-${Object.keys(electionResults).length}-${selectedAssembly}-${selectedDistrict}`}
                />
                {/* Dual Winner Popup - shows both years side by side */}
                {popupPosition && popupContent && (
                  <Popup position={popupPosition}>
                    <div className="p-1 min-w-[280px]">
                      <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>
                        {popupContent.ac_name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">PC: {popupContent.pc_name}</p>

                      {/* Side-by-side comparison */}
                      <div className="flex gap-2 mb-3">
                        {/* Year 1 Winner */}
                        {selectedElectionYear &&
                          (() => {
                            const assemblyId = popupContent.ac
                              ? `ac${String(popupContent.ac).padStart(3, '0')}`
                              : null
                            const result = assemblyId ? electionResults[assemblyId] : null
                            if (result) {
                              const partyColor = getPartyColor(result.party)
                              return (
                                <div className="flex-1 p-2 rounded border-2 border-red-200 bg-red-50">
                                  <p className="text-[10px] uppercase tracking-wide text-red-600 font-bold mb-1">
                                    🏆 {selectedElectionYear}
                                  </p>
                                  <p
                                    className="text-xs font-bold text-gray-800 mb-1 truncate"
                                    title={result.candidateName}
                                  >
                                    {result.candidateName}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                      style={{ backgroundColor: partyColor }}
                                    >
                                      {result.party}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 mt-1">
                                    {result.votes?.toLocaleString()} votes
                                  </p>
                                </div>
                              )
                            }
                            return (
                              <div className="flex-1 p-2 rounded border-2 border-red-200 bg-red-50">
                                <p className="text-[10px] uppercase tracking-wide text-red-600 font-bold mb-1">
                                  {selectedElectionYear}
                                </p>
                                <p className="text-xs text-gray-400 italic">No data</p>
                              </div>
                            )
                          })()}

                        {/* Year 2 Winner */}
                        {compareYear &&
                          (() => {
                            const assemblyId = popupContent.ac
                              ? `ac${String(popupContent.ac).padStart(3, '0')}`
                              : null
                            const result = assemblyId ? compareElectionResults[assemblyId] : null
                            if (result) {
                              const partyColor = getPartyColor(result.party)
                              return (
                                <div className="flex-1 p-2 rounded border-2 border-blue-200 bg-blue-50">
                                  <p className="text-[10px] uppercase tracking-wide text-blue-600 font-bold mb-1">
                                    🏆 {compareYear}
                                  </p>
                                  <p
                                    className="text-xs font-bold text-gray-800 mb-1 truncate"
                                    title={result.candidateName}
                                  >
                                    {result.candidateName}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                      style={{ backgroundColor: partyColor }}
                                    >
                                      {result.party}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 mt-1">
                                    {result.votes?.toLocaleString()} votes
                                  </p>
                                </div>
                              )
                            }
                            return (
                              <div className="flex-1 p-2 rounded border-2 border-blue-200 bg-blue-50">
                                <p className="text-[10px] uppercase tracking-wide text-blue-600 font-bold mb-1">
                                  {compareYear}
                                </p>
                                <p className="text-xs text-gray-400 italic">No data</p>
                              </div>
                            )
                          })()}
                      </div>

                      <button
                        className="w-full flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                        onClick={() => {
                          const url = buildAssemblyUrl(popupContent.ac)
                          if (url) router.push(url)
                        }}
                      >
                        View Assembly Details
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </Popup>
                )}
              </MapContainer>
              {/* Left Legend */}
              <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 border rounded shadow-sm px-2 py-1.5 max-w-[150px]">
                <p className="text-[10px] font-bold text-gray-700 mb-1">
                  {selectedElectionYear} Results
                </p>
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {Object.entries(partyCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([party, count]) => (
                      <div
                        key={party}
                        className="flex items-center justify-between gap-1 text-[9px]"
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: getPartyColor(party) }}
                          />
                          <span className="text-gray-700">{party || 'IND'}</span>
                        </div>
                        <span className="text-gray-500">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right Map - Year 2 */}
            <div className="flex-1 relative rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Year Label */}
              <div className="absolute top-2 right-2 z-[1000] bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow flex items-center gap-1.5">
                <span>{compareYear}</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                  {Object.keys(compareElectionResults).length} seats
                </span>
              </div>
              {isLoadingCompare && (
                <div className="absolute inset-0 z-[1500] bg-white/80 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <MapContainer
                style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                center={[11.1271, 78.6569]}
                zoom={7}
                scrollWheelZoom={true}
                ref={rightMapRef}
              >
                <MapSyncHandler targetMapRef={leftMapRef} isSyncing={isSyncing} />
                <NativeGeoJSON
                  data={map as GeoJSON.GeoJsonObject}
                  onEachFeature={(feature: GeoJSON.Feature, layer: L.Layer) => {
                    ;(layer as L.Path).on({
                      click: (e: L.LeafletMouseEvent) => {
                        e.originalEvent?.stopPropagation()
                        const acName = feature?.properties?.ac_name
                        setSelectedAssembly(acName || null)
                        setSearchQuery(acName || '')
                        setPopupContent(feature.properties || null)
                        setPopupPosition([e.latlng.lat, e.latlng.lng])
                      },
                    })
                  }}
                  style={(feature: GeoJSON.Feature) => {
                    const acName = feature?.properties?.ac_name
                    const pcName = feature?.properties?.pc_name
                    const assemblyId = feature?.properties?.ac
                      ? `ac${String(feature.properties.ac).padStart(3, '0')}`
                      : null
                    const isSelected = selectedAssembly === acName
                    const isInSelectedDistrict = selectedDistrict && pcName === selectedDistrict
                    const dimmed = selectedDistrict && pcName !== selectedDistrict

                    // Has election data
                    if (compareYear && assemblyId && compareElectionResults[assemblyId]) {
                      const result = compareElectionResults[assemblyId]
                      const partyColor = getPartyColor(result.party)
                      return {
                        color: isSelected
                          ? '#000000'
                          : isInSelectedDistrict
                            ? '#dc2626'
                            : '#ffffff',
                        fillColor: dimmed ? '#e5e7eb' : partyColor,
                        fillOpacity: isSelected ? 0.95 : dimmed ? 0.3 : 0.8,
                        weight: isSelected ? 3 : isInSelectedDistrict ? 2 : 1,
                      }
                    }
                    // No election data
                    return {
                      color: isSelected ? '#000000' : '#9ca3af',
                      fillColor: '#e5e7eb',
                      fillOpacity: isSelected ? 0.6 : dimmed ? 0.2 : 0.4,
                      weight: isSelected ? 3 : 0.5,
                    }
                  }}
                  refreshKey={`compare-right-${compareYear}-${Object.keys(compareElectionResults).length}-${selectedAssembly}-${selectedDistrict}`}
                />
                {/* Dual Winner Popup - same as left map for consistency */}
                {popupPosition && popupContent && (
                  <Popup position={popupPosition}>
                    <div className="p-1 min-w-[280px]">
                      <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>
                        {popupContent.ac_name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">PC: {popupContent.pc_name}</p>

                      {/* Side-by-side comparison */}
                      <div className="flex gap-2 mb-3">
                        {/* Year 1 Winner */}
                        {selectedElectionYear &&
                          (() => {
                            const assemblyId = popupContent.ac
                              ? `ac${String(popupContent.ac).padStart(3, '0')}`
                              : null
                            const result = assemblyId ? electionResults[assemblyId] : null
                            if (result) {
                              const partyColor = getPartyColor(result.party)
                              return (
                                <div className="flex-1 p-2 rounded border-2 border-red-200 bg-red-50">
                                  <p className="text-[10px] uppercase tracking-wide text-red-600 font-bold mb-1">
                                    🏆 {selectedElectionYear}
                                  </p>
                                  <p
                                    className="text-xs font-bold text-gray-800 mb-1 truncate"
                                    title={result.candidateName}
                                  >
                                    {result.candidateName}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                      style={{ backgroundColor: partyColor }}
                                    >
                                      {result.party}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 mt-1">
                                    {result.votes?.toLocaleString()} votes
                                  </p>
                                </div>
                              )
                            }
                            return (
                              <div className="flex-1 p-2 rounded border-2 border-red-200 bg-red-50">
                                <p className="text-[10px] uppercase tracking-wide text-red-600 font-bold mb-1">
                                  {selectedElectionYear}
                                </p>
                                <p className="text-xs text-gray-400 italic">No data</p>
                              </div>
                            )
                          })()}

                        {/* Year 2 Winner */}
                        {compareYear &&
                          (() => {
                            const assemblyId = popupContent.ac
                              ? `ac${String(popupContent.ac).padStart(3, '0')}`
                              : null
                            const result = assemblyId ? compareElectionResults[assemblyId] : null
                            if (result) {
                              const partyColor = getPartyColor(result.party)
                              return (
                                <div className="flex-1 p-2 rounded border-2 border-blue-200 bg-blue-50">
                                  <p className="text-[10px] uppercase tracking-wide text-blue-600 font-bold mb-1">
                                    🏆 {compareYear}
                                  </p>
                                  <p
                                    className="text-xs font-bold text-gray-800 mb-1 truncate"
                                    title={result.candidateName}
                                  >
                                    {result.candidateName}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                      style={{ backgroundColor: partyColor }}
                                    >
                                      {result.party}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-500 mt-1">
                                    {result.votes?.toLocaleString()} votes
                                  </p>
                                </div>
                              )
                            }
                            return (
                              <div className="flex-1 p-2 rounded border-2 border-blue-200 bg-blue-50">
                                <p className="text-[10px] uppercase tracking-wide text-blue-600 font-bold mb-1">
                                  {compareYear}
                                </p>
                                <p className="text-xs text-gray-400 italic">No data</p>
                              </div>
                            )
                          })()}
                      </div>

                      <button
                        className="w-full flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                        onClick={() => {
                          const url = buildAssemblyUrl(popupContent.ac)
                          if (url) router.push(url)
                        }}
                      >
                        View Assembly Details
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </Popup>
                )}
              </MapContainer>
              {/* Right Legend */}
              <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 border rounded shadow-sm px-2 py-1.5 max-w-[150px]">
                <p className="text-[10px] font-bold text-gray-700 mb-1">{compareYear} Results</p>
                <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                  {Object.entries(comparePartyCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([party, count]) => (
                      <div
                        key={party}
                        className="flex items-center justify-between gap-1 text-[9px]"
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: getPartyColor(party) }}
                          />
                          <span className="text-gray-700">{party || 'IND'}</span>
                        </div>
                        <span className="text-gray-500">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // SINGLE MAP MODE (Original)
          <div
            className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[550px]'} w-full rounded border border-gray-200 dark:border-gray-700 overflow-hidden`}
          >
            {/* Loading overlay while fetching election data */}
            {isLoadingElection && (
              <div className="absolute inset-0 z-[1500] bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full" />
                    <div className="absolute inset-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Loading {selectedElectionYear} Election Results
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Fetching data for 234 assemblies...
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Empty State Hint - shown when no election year is selected */}
            {!selectedElectionYear && !compareMode && !hideElectionYearHint && (
              <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-center">
                <div className="bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-6 py-4 text-center backdrop-blur-sm pointer-events-auto flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">
                        🗳️ Select an election year
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs">
                        to see party-wise results on the map
                      </p>
                    </div>
                    <button
                      onClick={() => setHideElectionYearHint(true)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                      aria-label="Close hint"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <MapContainer
              style={{ height: '100%', width: '100%', background: '#f8fafc' }}
              center={[11.1271, 78.6569]}
              zoom={7}
              scrollWheelZoom={true}
              ref={mapRef}
            >
              <MapZoomListener setZoomLevel={setZoomLevel} />
              <NativeGeoJSON
                data={map as GeoJSON.GeoJsonObject}
                onEachFeature={onEachFeature}
                style={styleFeature}
                refreshKey={`${selectedAssembly || 'none'}-${selectedDistrict || 'all'}-${showDistrictBoundaries}-${selectedElectionYear || 'no-election'}-${Object.keys(electionResults).length}-${isLoadingElection}-${viewMode}`}
              />

              {/* District Boundaries Layer - shows thick colored boundary lines when toggle is enabled */}
              {showDistrictBoundaries && districtBoundariesGeoJson && (
                <NativeGeoJSON
                  data={districtBoundariesGeoJson as GeoJSON.GeoJsonObject}
                  onEachFeature={() => {}} // No interactions for boundary layer
                  style={(feature: any) => {
                    const pcName = feature?.properties?.pc_name
                    // Use a distinct color scheme for district boundaries
                    const districtColors = [
                      '#ef4444',
                      '#f97316',
                      '#eab308',
                      '#22c55e',
                      '#14b8a6',
                      '#06b6d4',
                      '#3b82f6',
                      '#6366f1',
                      '#a855f7',
                      '#ec4899',
                      '#be185d',
                      '#dc2626',
                      '#ea580c',
                      '#ca8a04',
                      '#16a34a',
                      '#0d9488',
                      '#0284c7',
                      '#4f46e5',
                      '#7c3aed',
                      '#c026d3',
                      '#db2777',
                    ]
                    const districtIndex =
                      Object.keys(
                        map.features?.reduce((acc: Record<string, boolean>, f: GeoJSON.Feature) => {
                          const name = f.properties?.pc_name
                          if (name) acc[name] = true
                          return acc
                        }, {}) || {},
                      ).indexOf(pcName) % districtColors.length

                    return {
                      color: districtColors[districtIndex >= 0 ? districtIndex : 0],
                      weight: 4,
                      opacity: 0.9,
                      fill: false,
                    }
                  }}
                  refreshKey={`district-boundaries-${showDistrictBoundaries}`}
                />
              )}

              {/* Assembly Labels - only shown at higher zoom levels */}
              {map.features
                ?.filter((feature: GeoJSON.Feature) => {
                  if (selectedDistrict) {
                    return feature.properties?.pc_name === selectedDistrict
                  }
                  return true
                })
                .map((feature: GeoJSON.Feature, index: number) => {
                  // Only show labels at zoom level 9+
                  if (zoomLevel >= 9) {
                    const center = feature.geometry
                      ? getPolygonCentroid((feature.geometry as any).coordinates)
                      : null
                    if (center) {
                      return (
                        <Marker
                          key={`label-${index}`}
                          position={center}
                          icon={L.divIcon({
                            className: 'assembly-label',
                            html: `<div style="
                            font-size: 8px;
                            font-weight: 600;
                            color: #1f2937;
                            text-shadow: 0 0 3px white, 0 0 3px white, 0 0 3px white;
                            white-space: nowrap;
                            text-align: center;
                            pointer-events: none;
                          ">${feature.properties?.ac_name || ''}</div>`,
                            iconSize: [100, 20],
                            iconAnchor: [50, 10],
                          })}
                        />
                      )
                    }
                  }
                  return null
                })}

              {/* Popup - BBC Style */}
              {popupPosition && popupContent && (
                <Popup position={popupPosition}>
                  <div className="p-1 min-w-[180px]">
                    <p className="font-bold text-sm mb-1" style={{ color: '#111827' }}>
                      {popupContent.ac_name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">PC: {popupContent.pc_name}</p>

                    {/* Election Winner Info - shown when election overlay is active */}
                    {selectedElectionYear &&
                      (() => {
                        const assemblyId = popupContent.ac
                          ? `ac${String(popupContent.ac).padStart(3, '0')}`
                          : null
                        const result = assemblyId ? electionResults[assemblyId] : null
                        if (result) {
                          const partyColor = getPartyColor(result.party)
                          return (
                            <div className="mb-3 p-2 rounded border border-gray-200 bg-gray-50">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">
                                🏆 {selectedElectionYear} Winner
                              </p>
                              <p className="text-xs font-bold text-gray-800 mb-1">
                                {result.candidateName}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                                  style={{ backgroundColor: partyColor }}
                                >
                                  {result.party}
                                </span>
                                <span className="text-[10px] text-gray-600 font-medium">
                                  {result.votes?.toLocaleString()} votes
                                </span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}

                    {/* Caste Breakdown - shown in caste view mode */}
                    {viewMode === 'caste' &&
                      (() => {
                        const assemblyId = popupContent.ac
                          ? `ac${String(popupContent.ac).padStart(3, '0')}`
                          : null
                        const casteInfo = assemblyId ? casteDataMap[assemblyId] : null
                        if (casteInfo) {
                          const castes = [
                            { name: casteInfo.caste, pct: casteInfo.percentage },
                            { name: casteInfo.rank2Caste, pct: casteInfo.rank2Percentage },
                            { name: casteInfo.rank3Caste, pct: casteInfo.rank3Percentage },
                            { name: casteInfo.rank4Caste, pct: casteInfo.rank4Percentage },
                            { name: casteInfo.rank5Caste, pct: casteInfo.rank5Percentage },
                          ].filter((c) => c.name && c.pct)

                          return (
                            <div className="mb-3 p-2 rounded border border-gray-200 bg-gray-50">
                              <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
                                👥 Caste Demographics
                              </p>
                              <div className="space-y-1.5">
                                {castes.map((c, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div className="flex justify-between mb-0.5">
                                      <span className="text-gray-700 font-medium truncate max-w-[120px]">
                                        {c.name}
                                      </span>
                                      <span className="text-gray-500 font-semibold">
                                        {c.pct?.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${Math.min(c.pct || 0, 100)}%`,
                                          backgroundColor: getCasteColor(c.name || ''),
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}

                    <button
                      className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
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
        )}

        {/* Legend - Only shown in single map mode (compare mode has inline legends) */}
        {!compareMode && (
          <div className="absolute bottom-3 right-3 z-[1000]">
            <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 rounded shadow-sm px-3 py-2 max-w-[200px]">
              {selectedElectionYear && Object.keys(partyCounts).length > 0 ? (
                <>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {selectedElectionYear}{' '}
                    {viewMode === 'alliance'
                      ? 'Alliances'
                      : viewMode === 'caste'
                        ? 'Dominant Castes'
                        : 'Results'}
                  </p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {viewMode === 'caste'
                      ? // Caste view legend - show dominant castes
                        (() => {
                          // Calculate caste counts from casteDataMap
                          const casteCounts: Record<string, number> = {}
                          Object.values(casteDataMap).forEach((data) => {
                            if (data.caste) {
                              casteCounts[data.caste] = (casteCounts[data.caste] || 0) + 1
                            }
                          })
                          return Object.entries(casteCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([caste, count]) => (
                              <div
                                key={caste}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-3 h-3 rounded-sm border border-white/50"
                                    style={{ backgroundColor: getCasteColor(caste) }}
                                  />
                                  <span
                                    className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[110px]"
                                    title={caste}
                                  >
                                    {caste.length > 14 ? caste.slice(0, 14) + '...' : caste}
                                  </span>
                                </div>
                                <span className="text-gray-500 dark:text-gray-400">{count}</span>
                              </div>
                            ))
                        })()
                      : viewMode === 'alliance' && allianceSeats.length > 0
                        ? // Alliance view legend
                          allianceSeats.slice(0, 8).map((alliance) => (
                            <div
                              key={alliance.allianceName}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-3 h-3 rounded-sm border border-white/50"
                                  style={{ backgroundColor: alliance.color || '#6b7280' }}
                                />
                                <span
                                  className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]"
                                  title={alliance.allianceName}
                                >
                                  {alliance.allianceName.length > 18
                                    ? alliance.allianceName.slice(0, 18) + '...'
                                    : alliance.allianceName}
                                </span>
                              </div>
                              <span className="text-gray-500 dark:text-gray-400">
                                {alliance.seats}
                              </span>
                            </div>
                          ))
                        : // Party view legend
                          Object.entries(partyCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([party, count]) => (
                              <div
                                key={party}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-3 h-3 rounded-sm border border-white/50"
                                    style={{ backgroundColor: getPartyColor(party) }}
                                  />
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    {party || 'IND'}
                                  </span>
                                </div>
                                <span className="text-gray-500 dark:text-gray-400">{count}</span>
                              </div>
                            ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Legend
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-600" />
                    <span className="text-gray-600 dark:text-gray-400">Selected</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Constituency</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Election Insights Panel - shown in compare mode */}
      <ElectionInsightsPanel
        year1={selectedElectionYear || 0}
        year2={compareYear || 0}
        isVisible={compareMode && !!selectedElectionYear && !!compareYear}
      />

      {/* Closest Races Panel - shown in solo view mode only */}
      <ClosestRacesPanel
        closestRaces={closestRaces}
        topTwoParties={topTwoParties}
        year={selectedElectionYear || 0}
        isVisible={!compareMode && !!selectedElectionYear && closestRaces.length > 0}
        partyToAlliance={partyToAlliance}
        allianceSeats={allianceSeats}
      />

      {/* Alliance Summary - shown in solo view mode only */}
      <AllianceSummary
        allianceSeats={allianceSeats}
        year={selectedElectionYear || 0}
        totalSeats={Object.keys(electionResults).length}
        isVisible={!compareMode && !!selectedElectionYear && allianceSeats.length > 0}
      />

      {/* Caste Insights Panel - shown in caste view mode only */}
      <CasteInsightsPanel
        isVisible={!compareMode && viewMode === 'caste' && Object.keys(casteDataMap).length > 0}
        casteDataMap={casteDataMap}
      />

      {/* Info text */}
      <p className="text-xs text-muted-foreground text-center">
        Click on any constituency to view details • Scroll to zoom • Drag to pan
      </p>
    </div>
  )
}

export default AssemblyMap
