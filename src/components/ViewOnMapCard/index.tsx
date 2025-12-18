'use client'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

interface ViewOnMapCardProps {
  assemblyId: string
  assemblyName: string
}

export function ViewOnMapCard({ assemblyId, assemblyName }: ViewOnMapCardProps) {
  // Extract numeric ID from assemblyId (e.g., "ac092" -> "092")
  const numericId = assemblyId.replace('ac', '')

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg">
              <MapPin className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold">View on Map</p>
              <p className="text-xs text-muted-foreground">
                See {assemblyName} on the interactive map
              </p>
            </div>
          </div>
          <Link href={`/assembly-map?ac=${numericId}`}>
            <Button variant="outline" size="sm" className="text-sm">
              Open Map
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default ViewOnMapCard
