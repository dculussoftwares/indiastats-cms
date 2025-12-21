import * as React from 'react'
import { Metadata } from 'next'
import AssemblyMap from '@/components/AssemblyMap'
import { TamilNaduGeoJson } from '@/components/AssemblyMap/staticData'

export const metadata: Metadata = {
  title: 'Tamil Nadu Assembly Map - Interactive Constituency Visualization | IndiaStats',
  description:
    'Interactive map of Tamil Nadu assembly constituencies with detailed electoral data, geographical boundaries, and constituency information.',
  keywords:
    'Tamil Nadu assembly map, constituency map, electoral boundaries, assembly seats, district map',
}

export default function AssemblyMapPage() {
  return (
    <div className="container mx-auto py-6">
      {/* BBC Style Header */}
      <div className="mb-6">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <h1 className="text-2xl font-bold">Tamil Nadu Assembly Map</h1>
          <p className="text-sm text-muted-foreground">
            Interactive map showing all 234 assembly constituencies
          </p>
        </div>
      </div>
      <AssemblyMap map={TamilNaduGeoJson} />
    </div>
  )
}
