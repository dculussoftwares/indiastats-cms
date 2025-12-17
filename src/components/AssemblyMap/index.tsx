'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin } from 'lucide-react'
import './leaflet-style-import'
import L from 'leaflet'
import chroma from 'chroma-js'

// Dynamic imports for react-leaflet (SSR disabled)
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })

const DivIcon = L.DivIcon

export type AssemblyMapProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any
}

// Generate distinct colors for each PC
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPcNameColorMap = (features: any[]) => {
  const pcNames = Array.from(new Set(features.map((f) => f.properties?.pc_name)))
  const colorScale = chroma.scale('Set3').colors(pcNames.length)
  const pcNameColorMap: Record<string, string> = {}
  pcNames.forEach((name, idx) => {
    pcNameColorMap[name as string] = colorScale[idx]
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)

  const pcNameColorMap = useMemo(() => getPcNameColorMap(map.features || []), [map])

  const assemblyOptions = useMemo(() => {
    if (!map.features) return []
    return Array.from(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Set(map.features.map((f: any) => f.properties?.ac_name).filter(Boolean)),
    ) as string[]
  }, [map])

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return assemblyOptions.slice(0, 10)
    return assemblyOptions
      .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10)
  }, [searchQuery, assemblyOptions])

  // Handle feature interactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseover: (event: any) => {
        event.target.bringToFront()
        event.target.setStyle({
          color: 'black',
          weight: 3,
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mouseout: (event: any) => {
        event.target.bringToBack()
        const pcName = feature?.properties?.pc_name
        event.target.setStyle({
          color: '#9370DB',
          fillColor: pcNameColorMap[pcName] || 'lightblue',
          fillOpacity: 0.7,
          opacity: 1,
          weight: 1,
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      click: (e: any) => {
        const { lat, lng } = e.latlng
        setPopupContent(feature.properties || 'No data available')
        setPopupPosition([lat, lng])
      },
    })
  }

  // Handle search selection
  const handleAssemblySearch = (value: string) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const isSelected = selectedAssembly === feature?.properties?.ac_name

    return {
      color: isSelected ? '#FF4500' : '#9370DB',
      fillColor: isSelected ? '#FFA07A' : pcNameColorMap[pcName] || 'lightblue',
      fillOpacity: isSelected ? 0.9 : 0.7,
      opacity: 1,
      weight: isSelected ? 3 : 1,
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search constituency..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
            />
          </div>
          {selectedAssembly && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAssembly(null)
                setSearchQuery('')
                setPopupPosition(null)
                setPopupContent(null)
              }}
            >
              Clear
            </Button>
          )}
        </div>
        {showDropdown && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.map((name) => (
              <button
                key={name}
                className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                onClick={() => handleAssemblySearch(name)}
              >
                <MapPin className="h-4 w-4" />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div className="h-[600px] w-full rounded-lg overflow-hidden border">
          <MapContainer
            style={{ height: '100%', width: '100%' }}
            center={[11.1271, 78.6569]}
            zoom={7}
            scrollWheelZoom={true}
            ref={mapRef}
          >
            <MapZoomListener setZoomLevel={setZoomLevel} />
            <GeoJSON
              data={map as GeoJSON.GeoJsonObject}
              onEachFeature={onEachFeature}
              style={styleFeature}
            />

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
                          className: 'polygon-label',
                          html: `<div style="background:${pcNameColorMap[feature.properties.pc_name] || 'rgba(255,255,255,0.7)'};padding:2px 6px;border-radius:4px;font-size:14px;font-weight:bold;color:#222;min-width:60px;text-align:center;">${feature.properties.ac_name}</div>`,
                        })
                      }
                      interactive={false}
                    />
                  )
                }
                return null
              })}

            {/* Popup */}
            {popupPosition && popupContent && (
              <Popup position={popupPosition}>
                <div className="flex flex-col gap-2 p-1">
                  <p className="font-semibold">{popupContent.ac_name}</p>
                  <p className="text-sm text-muted-foreground">PC: {popupContent.pc_name}</p>
                  <Badge
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/assembly/dt${popupContent.pc}/ac${String(popupContent.ac).padStart(3, '0')}`,
                      )
                    }
                  >
                    View Assembly →
                  </Badge>
                </div>
              </Popup>
            )}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Card className="max-h-[150px] overflow-y-auto bg-background/95 backdrop-blur">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">Parliamentary Constituencies</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="flex flex-col gap-1">
                {Object.entries(pcNameColorMap).map(([pcName, color]) => (
                  <div key={pcName} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs whitespace-nowrap">{pcName}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AssemblyMap
