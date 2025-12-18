'use client'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, User, UserCircle2, UsersRound } from 'lucide-react'

export interface DistrictVoters {
  male: number
  female: number
  trans: number
  total: number
}

export interface DistrictDetailsData {
  districtId: string
  districtName: string
  noOfAssemblies: number
  voters: DistrictVoters
}

interface DistrictDetailsCardProps {
  data: DistrictDetailsData
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

interface DetailItemProps {
  title: string
  value: number
  icon: React.ReactNode
}

const DetailItem: React.FC<DetailItemProps> = ({ title, value, icon }) => (
  <Card>
    <CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 text-gray-500">{icon}</div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-xl font-bold">{formatNumber(value)}</p>
          <p className="text-xs text-muted-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const DistrictDetailsCard: React.FC<DistrictDetailsCardProps> = ({ data }) => {
  const { districtName, noOfAssemblies, voters } = data

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">District Details</CardTitle>
          <Badge variant="secondary">{districtName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DetailItem
            title="Assemblies"
            value={noOfAssemblies}
            icon={<Building2 className="h-6 w-6" />}
          />
          <DetailItem title="Male Voters" value={voters.male} icon={<User className="h-6 w-6" />} />
          <DetailItem
            title="Female Voters"
            value={voters.female}
            icon={<UserCircle2 className="h-6 w-6" />}
          />
          <DetailItem
            title="Transgender"
            value={voters.trans}
            icon={<Users className="h-6 w-6" />}
          />
          <DetailItem
            title="Total Voters"
            value={voters.total}
            icon={<UsersRound className="h-6 w-6" />}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default DistrictDetailsCard
