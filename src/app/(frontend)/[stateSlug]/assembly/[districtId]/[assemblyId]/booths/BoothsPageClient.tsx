'use client'
import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Search, MapPin, FileText, ExternalLink, Building2 } from 'lucide-react'
import { track } from '@/utilities/analytics'

interface Booth {
  id: string
  boothId: string
  assemblyId: string
  districtId: string
  wardAddress: string
  streetName: string
  pdfLink: string
}

interface BoothsPageClientProps {
  districtId: string
  assemblyId: string
  assemblyName: string
  districtName: string
  stateSlug: string
}

export function BoothsPageClient({
  districtId,
  assemblyId,
  assemblyName,
  districtName,
  stateSlug,
}: BoothsPageClientProps) {
  const [booths, setBooths] = React.useState<Booth[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    async function fetchBooths() {
      setLoading(true)
      try {
        const response = await fetch(`/api/booths?assemblyId=${assemblyId}`)
        const data = await response.json()
        setBooths(data.booths || [])
      } catch (error) {
        console.error('Failed to fetch booths:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooths()
  }, [assemblyId])

  // Filter booths based on search term
  const filteredBooths = React.useMemo(() => {
    if (!searchTerm) return booths
    const term = searchTerm.toLowerCase()
    return booths.filter(
      (booth) =>
        booth.boothId.toLowerCase().includes(term) ||
        booth.wardAddress?.toLowerCase().includes(term) ||
        booth.streetName?.toLowerCase().includes(term),
    )
  }, [booths, searchTerm])

  return (
    <div className="container py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href={`/${stateSlug}/assembly/${districtId}/${assemblyId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {assemblyName}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="border-l-4 border-red-600 pl-4 py-2">
          <h1 className="text-3xl font-bold text-foreground">Booths in {assemblyName}</h1>
          <p className="text-muted-foreground text-sm">
            {districtName} District • {booths.length} booths
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg">
                <Building2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{booths.length}</p>
                <p className="text-xs text-muted-foreground">Total Booths</p>
              </div>
            </div>
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search booths..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booths Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            All Booths
            {searchTerm && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredBooths.length} results)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredBooths.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No booths match your search' : 'No booths found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Booth ID</TableHead>
                    <TableHead>Street Name</TableHead>
                    <TableHead>Ward Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooths.map((booth) => (
                    <TableRow key={booth.id}>
                      <TableCell className="font-medium">{booth.boothId}</TableCell>
                      <TableCell>{booth.streetName || '-'}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {booth.wardAddress || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {booth.pdfLink && (
                            <a
                              href={booth.pdfLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                              onClick={() =>
                                track('Booth PDF Click', {
                                  booth_id: booth.boothId,
                                  assembly_id: assemblyId,
                                })
                              }
                            >
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </a>
                          )}
                          <Link
                            href={`/${stateSlug}/assembly/${districtId}/${assemblyId}/booths/${booth.boothId}`}
                            onClick={() =>
                              track('View Booth Click', {
                                booth_id: booth.boothId,
                                assembly_id: assemblyId,
                                assembly_name: assemblyName,
                              })
                            }
                          >
                            <Button variant="default" size="sm">
                              View
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info text */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Click on any booth to view details • PDF links open voter list
      </p>
    </div>
  )
}

export default BoothsPageClient
