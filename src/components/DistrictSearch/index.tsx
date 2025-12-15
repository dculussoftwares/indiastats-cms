'use client'
import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight, Search } from 'lucide-react'

export interface District {
  districtId: string
  districtName: string
}

export interface Assembly {
  assemblyId: string
  districtId: string
  districtName: string
  name: string
}

interface DistrictSearchProps {
  districts: District[]
  onSearch?: (district: District) => void
}

const LOCAL_STORAGE_DISTRICT_KEY = 'district-search:districtId'

export const DistrictSearch: React.FC<DistrictSearchProps> = ({ districts, onSearch }) => {
  const router = useRouter()
  const hasHydratedRef = useRef(false)
  const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filter districts based on search query
  const filteredDistricts = useMemo(() => {
    if (!searchQuery) return districts
    return districts.filter((d) => d.districtName.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [districts, searchQuery])

  // Hydrate from localStorage
  useEffect(() => {
    if (hasHydratedRef.current || typeof window === 'undefined') return
    if (districts.length === 0) return

    const storedDistrictId = window.localStorage.getItem(LOCAL_STORAGE_DISTRICT_KEY)
    let initialDistrict = storedDistrictId
      ? districts.find((d) => d.districtId === storedDistrictId)
      : undefined

    if (!initialDistrict) {
      initialDistrict = districts[0]
    }

    setSelectedDistrict(initialDistrict)
    hasHydratedRef.current = true
  }, [districts])

  // Persist to localStorage
  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === 'undefined') return

    if (selectedDistrict) {
      window.localStorage.setItem(LOCAL_STORAGE_DISTRICT_KEY, selectedDistrict.districtId)
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_DISTRICT_KEY)
    }
  }, [selectedDistrict?.districtId])

  const handleSelect = (district: District) => {
    setSelectedDistrict(district)
    setSearchQuery(district.districtName)
    setIsOpen(false)
  }

  const handleSearchClick = () => {
    if (selectedDistrict) {
      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(selectedDistrict)
      }
      // Navigate to district page
      router.push(`/district/${selectedDistrict.districtId}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">District Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="district-search">Select District</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="district-search"
              placeholder="Search districts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-9"
            />
            {isOpen && filteredDistricts.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {filteredDistricts.map((district) => (
                  <div
                    key={district.districtId}
                    className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
                      selectedDistrict?.districtId === district.districtId ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleSelect(district)}
                  >
                    {district.districtName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSearchClick}
          disabled={!selectedDistrict}
          className="w-full sm:w-auto"
        >
          View District
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default DistrictSearch
