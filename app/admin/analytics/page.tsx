'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { APIUsageChart } from '@/components/admin/api-usage-chart'
import { CostBreakdown } from '@/components/admin/cost-breakdown'
import { ServiceMetrics } from '@/components/admin/service-metrics'
import { DollarSign, TrendingUp, Activity, Clock } from 'lucide-react'

interface AnalyticsSummary {
  totalCalls: number
  totalCost: number
  avgDuration: number
  topService: string
}

export default function APIAnalyticsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics/summary?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      
      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Analytics</h1>
          <p className="text-gray-400 mt-1">
            Monitor API usage and costs across all services
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-auto">
          <TabsList className="bg-white/10">
            <TabsTrigger value="day" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Day
            </TabsTrigger>
            <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : summary?.totalCalls.toLocaleString() ?? '0'}
            </div>
            <p className="text-xs text-gray-500">
              {period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${loading ? '...' : summary?.totalCost.toFixed(2) ?? '0.00'}
            </div>
            <p className="text-xs text-gray-500">
              {period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : `${summary?.avgDuration.toFixed(0) ?? '0'}ms`}
            </div>
            <p className="text-xs text-gray-500">Per API call</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Top Service</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : summary?.topService ?? 'N/A'}
            </div>
            <p className="text-xs text-gray-500">Most used</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid gap-6 md:grid-cols-2">
        <APIUsageChart period={period} />
        <CostBreakdown period={period} />
      </div>

      {/* Service Metrics Table */}
      <ServiceMetrics period={period} />
    </div>
  )
}

