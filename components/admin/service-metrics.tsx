'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface ServiceMetricsProps {
  period: 'day' | 'week' | 'month'
}

interface ServiceMetric {
  service: string
  totalCalls: number
  totalCost: number
  avgDuration: number
  successRate: number
}

export function ServiceMetrics({ period }: ServiceMetricsProps) {
  const [data, setData] = useState<ServiceMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/service-metrics?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch service metrics')
      
      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error('Error fetching service metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#0f0f0f] border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Service Metrics</CardTitle>
        <CardDescription className="text-gray-400">
          Detailed metrics for each API service
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-400">Service</TableHead>
                  <TableHead className="text-gray-400 text-right">Calls</TableHead>
                  <TableHead className="text-gray-400 text-right">Cost</TableHead>
                  <TableHead className="text-gray-400 text-right">Avg Duration</TableHead>
                  <TableHead className="text-gray-400 text-right">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((metric) => (
                  <TableRow key={metric.service} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white capitalize">
                      {metric.service}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {metric.totalCalls.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      ${metric.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {metric.avgDuration.toFixed(0)}ms
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={metric.successRate >= 95 ? 'default' : 'secondary'}
                        className={
                          metric.successRate >= 95
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }
                      >
                        {metric.successRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

