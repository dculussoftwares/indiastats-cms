'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, ExternalLink, X, Layers, Maximize2, Minimize2 } from 'lucide-react'
import { getPartyColor } from '@/lib/partyColors'
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

export type AssemblyMapProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any
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

export function AssemblyMap({ map }: AssemblyMapProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  // Election overlay state
  const [selectedElectionYear, setSelectedElectionYear] = useState<number | null>(null)
  const [electionResults, setElectionResults] = useState<
    Record<string, { party: string; candidateName: string; votes: number }>
  >({})
  const [partyCounts, setPartyCounts] = useState<Record<string, number>>({})
  const [isLoadingElection, setIsLoadingElection] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // Track selected states in refs for use in event handlers
  const selectedAssemblyRef = useRef<string | null>(null)
  const selectedDistrictRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Track election year in ref for event handlers
  const selectedElectionYearRef = useRef<number | null>(null)
  const electionResultsRef = useRef<
    Record<string, { party: string; candidateName: string; votes: number }>
  >({})

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
          electionResultsRef.current = data.results || {}
        }
      } catch (error) {
        console.error('Failed to fetch election results:', error)
      } finally {
        setIsLoadingElection(false)
      }
    }

    fetchElectionResults()
  }, [selectedElectionYear])

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

        // Election overlay mode - restore party color
        if (
          selectedElectionYearRef.current &&
          assemblyId &&
          electionResultsRef.current[assemblyId]
        ) {
          const isSelected = selectedAssemblyRef.current === acName
          const result = electionResultsRef.current[assemblyId]
          const partyColor = getPartyColor(result.party)

          event.target.setStyle({
            color: isSelected ? '#000000' : '#ffffff',
            fillColor: partyColor,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const styleFeature = (feature: any) => {
    const pcName = feature?.properties?.pc_name
    const assemblyId = feature?.properties?.ac
      ? `ac${String(feature.properties.ac).padStart(3, '0')}`
      : null
    const isSelected = selectedAssembly === feature?.properties?.ac_name
    const isInSelectedDistrict = !selectedDistrict || pcName === selectedDistrict
    const dimmed = selectedDistrict && !isInSelectedDistrict

    // Election overlay mode - use party colors
    if (selectedElectionYear && assemblyId && electionResults[assemblyId]) {
      const result = electionResults[assemblyId]
      const partyColor = getPartyColor(result.party)

      return {
        color: isSelected ? '#000000' : '#ffffff',
        fillColor: partyColor,
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
      {/* Search and District Filter - BBC Style */}
      <Card className={isFullscreen ? 'mb-4' : ''}>
        <CardContent className="py-3">
          <div className="flex gap-3 items-center flex-wrap">
            {/* Constituency Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search constituency..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:border-red-600"
              />
              {showDropdown && filteredOptions.length > 0 && (
                <div className="absolute z-[1100] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-56 overflow-y-auto">
                  {filteredOptions.map((name) => (
                    <button
                      key={name}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                      onClick={() => handleAssemblySearch(name)}
                    >
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* District Dropdown - Searchable */}
            <div className="relative min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by district..."
                value={districtSearchQuery}
                onChange={(e) => {
                  setDistrictSearchQuery(e.target.value)
                  setShowDistrictDropdown(true)
                }}
                onFocus={() => setShowDistrictDropdown(true)}
                className="w-full pl-10 pr-8 py-2 text-sm border border-gray-200 rounded bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:border-red-600"
              />
              {selectedDistrict && (
                <button
                  onClick={() => handleDistrictSelect(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              {showDistrictDropdown && filteredDistrictOptions.length > 0 && (
                <div className="absolute z-[1100] w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-56 overflow-y-auto">
                  {!districtSearchQuery && (
                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 font-medium"
                      onClick={() => handleDistrictSelect(null)}
                    >
                      All Districts
                    </button>
                  )}
                  {filteredDistrictOptions.map((district) => (
                    <button
                      key={district}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedDistrict === district ? 'bg-red-50 text-red-600' : ''}`}
                      onClick={() => handleDistrictSelect(district)}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              )}
            </div>

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

              {/* Election Year Selector */}
              <div className="relative">
                <select
                  value={selectedElectionYear || ''}
                  onChange={(e) =>
                    setSelectedElectionYear(e.target.value ? Number(e.target.value) : null)
                  }
                  className="h-9 px-3 text-xs border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-red-600 cursor-pointer"
                >
                  <option value="">Election Year</option>
                  <option value="2021">2021 Results</option>
                  <option value="2016">2016 Results</option>
                  <option value="2011">2011 Results</option>
                </select>
                {isLoadingElection && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
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
                <Button variant="ghost" size="sm" onClick={clearSelection} className="px-2">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container - Clean styling */}
      <div className="relative">
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
              refreshKey={`${selectedAssembly || 'none'}-${selectedDistrict || 'all'}-${showDistrictBoundaries}-${selectedElectionYear || 'no-election'}-${Object.keys(electionResults).length}`}
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
                    '#8b5cf6',
                    '#a855f7',
                    '#d946ef',
                    '#ec4899',
                    '#f43f5e',
                    '#10b981',
                    '#0ea5e9',
                    '#6d28d9',
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
                    '#e11d48',
                    '#059669',
                    '#0891b2',
                    '#2563eb',
                    '#7c3aed',
                    '#9333ea',
                    '#c026d3',
                    '#db2777',
                    '#dc2626',
                    '#d97706',
                    '#65a30d',
                    '#0d9488',
                    '#0284c7',
                  ]
                  const colorIndex = districtOptions.indexOf(pcName)
                  const strokeColor =
                    districtColors[colorIndex % districtColors.length] || '#dc2626'

                  return {
                    color: strokeColor,
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    opacity: 0.9,
                    weight: 4,
                  }
                }}
                refreshKey={`district-boundaries-${showDistrictBoundaries}`}
                interactive={false}
              />
            )}

            {/* Assembly name labels at high zoom */}
            {map.features &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              map.features.map((feature: any, idx: number) => {
                if (!feature.geometry || !feature.properties || !feature.properties.ac_name)
                  return null
                const centroid = getPolygonCentroid(feature.geometry.coordinates)
                const width = getPolygonWidth(feature.geometry.coordinates)
                if (zoomLevel >= 9 && width > 0.08) {
                  return (
                    <Marker
                      key={idx}
                      position={centroid}
                      icon={
                        new DivIcon({
                          className: 'assembly-label-icon',
                          iconSize: undefined,
                          iconAnchor: undefined,
                          html: `<span style="position:relative;display:inline-block;"><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:white;padding:3px 10px;border-radius:3px;font-size:11px;font-weight:600;color:#374151;border:1px solid #d1d5db;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.12);">${feature.properties.ac_name}</span></span>`,
                        })
                      }
                      interactive={false}
                    />
                  )
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
                              {result.candidate}
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

                  <button
                    className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                    onClick={() =>
                      router.push(
                        `/assembly/dt${popupContent.pc}/ac${String(popupContent.ac).padStart(3, '0')}`,
                      )
                    }
                  >
                    View Assembly
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </Popup>
            )}
          </MapContainer>
        </div>

        {/* Legend - Dynamic for election overlay */}
        <div className="absolute bottom-3 right-3 z-[1000]">
          <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 rounded shadow-sm px-3 py-2 max-w-[200px]">
            {selectedElectionYear && Object.keys(partyCounts).length > 0 ? (
              <>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {selectedElectionYear} Results
                </p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {Object.entries(partyCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([party, count]) => (
                      <div key={party} className="flex items-center justify-between gap-2 text-xs">
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
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Legend</p>
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
      </div>

      {/* Info text */}
      <p className="text-xs text-muted-foreground text-center">
        Click on any constituency to view details • Scroll to zoom • Drag to pan
      </p>
    </div>
  )
}

export default AssemblyMap
