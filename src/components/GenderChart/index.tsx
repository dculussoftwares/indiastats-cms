'use client'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { User, UserCircle2, Users } from 'lucide-react'
import { formatNumber } from '@/utilities/formatNumber'

interface GenderChartProps {
  voters: {
    male: number
    female: number
    trans: number
    total: number
  }
}

const COLORS = {
  male: 'hsl(220, 70%, 50%)',
  female: 'hsl(340, 75%, 55%)',
  trans: 'hsl(280, 65%, 60%)',
}

export function GenderChart({ voters }: GenderChartProps) {
  const data = [
    {
      name: 'Male',
      value: voters.male,
      color: COLORS.male,
      icon: <User className="h-4 w-4" />,
      percentage: ((voters.male / voters.total) * 100).toFixed(2),
    },
    {
      name: 'Female',
      value: voters.female,
      color: COLORS.female,
      icon: <UserCircle2 className="h-4 w-4" />,
      percentage: ((voters.female / voters.total) * 100).toFixed(2),
    },
    {
      name: 'Transgender',
      value: voters.trans,
      color: COLORS.trans,
      icon: <Users className="h-4 w-4" />,
      percentage: ((voters.trans / voters.total) * 100).toFixed(2),
    },
  ]

  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-foreground"
      >
        <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
          {formatNumber(voters.total)}
        </tspan>
        <tspan x="50%" dy="1.5em" className="text-sm fill-muted-foreground">
          Total
        </tspan>
      </text>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {renderCenterLabel()}
              </PieChart>
            </ResponsiveContainer>

            {voters.male > voters.female ? (
              <Badge className="mt-4 bg-green-600">Males are higher in this district</Badge>
            ) : (
              <Badge variant="secondary" className="mt-4">
                Females are higher in this district
              </Badge>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-col justify-center space-y-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3 pb-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GenderChart
