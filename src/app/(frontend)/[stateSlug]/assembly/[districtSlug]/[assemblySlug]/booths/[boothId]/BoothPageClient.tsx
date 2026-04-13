'use client'
import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, FileText, Home, Building2 } from 'lucide-react'
import { trackViewed, PAGE_NAMES } from '@/analytics'

interface Booth {
  id: string
  boothId: string
  assemblyId: string
  districtId: string
  wardAddress: string
  streetName: string
  pdfLink: string
}

interface BoothPageClientProps {
  districtSlug: string
  assemblySlug: string
  boothId: string
  assemblyName: string
  isReservedAc: boolean
  stateSlug: string
}

export function BoothPageClient({
  districtSlug,
  assemblySlug,
  boothId,
  assemblyName,
  isReservedAc,
  stateSlug,
}: BoothPageClientProps) {
  const [booth, setBooth] = React.useState<Booth | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    trackViewed({ name: 'booth_detail_page',
      booth_id: boothId,
      page_name: PAGE_NAMES.BOOTH_DETAIL,
      page_type: 'other',
      page_url: window.location.href,
      page_path: window.location.pathname,
    })
  }, [boothId])

  React.useEffect(() => {
    async function fetchBooth() {
      setLoading(true)
      try {
        const response = await fetch(`/api/booths/${boothId}`)
        const data = await response.json()
        setBooth(data.booth)
      } catch (error) {
        console.error('Failed to fetch booth:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooth()
  }, [boothId])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!booth) {
    return (
      <div className="container py-8">
        <div className="text-center py-16">
          <p className="text-muted-foreground">Booth not found</p>
          <Link href={`/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths`}>
            <Button variant="outline" className="mt-4">
              Back to Booths List
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href={`/${stateSlug}/assembly/${districtSlug}/${assemblySlug}/booths`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Booths
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-foreground">Booth {booth.boothId}</h1>
            <Badge variant={isReservedAc ? 'default' : 'secondary'}>
              {isReservedAc ? 'Reserved AC' : 'General AC'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{assemblyName} Assembly</p>
        </div>
      </div>

      {/* Booth Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            Booth Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Street Name */}
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Street Name</p>
                <p className="font-medium">{booth.streetName || 'Not available'}</p>
              </div>
            </div>

            {/* Ward Address */}
            <div className="flex items-start gap-3">
              <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ward Address</p>
                <p className="font-medium">{booth.wardAddress || 'Not available'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            Voter List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booth.pdfLink ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Download the official voter list for this booth
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF format • Official Election Commission data
                </p>
              </div>
              <a href={booth.pdfLink} target="_blank" rel="noopener noreferrer">
                <Button className="bg-red-600 hover:bg-red-700">
                  <FileText className="h-4 w-4 mr-2" />
                  View Voter List PDF
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-muted-foreground">Voter list PDF not available for this booth</p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-6 flex justify-center gap-4">
        <Link href={`/${stateSlug}/assembly/${districtSlug}/${assemblySlug}`}>
          <Button variant="outline">View Assembly Details</Button>
        </Link>
        <Link href={`/${stateSlug}/assembly-map`}>
          <Button variant="outline">View on Map</Button>
        </Link>
      </div>
    </div>
  )
}

export default BoothPageClient
