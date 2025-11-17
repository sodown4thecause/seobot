'use client'

/**
 * Workflow Analytics Dashboard
 * 
 * Displays comprehensive analytics for workflow executions including:
 * - Summary statistics (total executions, success rate, avg duration)
 * - Top performing tools
 * - Slowest tools (bottlenecks)
 * - Best cached tools
 * - Real-time metrics
 */

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, TrendingUp, TrendingDown, Zap, Clock, Database, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface ToolMetrics {
  toolName: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  cacheHits: number
  cacheHitRate: number
  lastExecuted: number
}

interface SummaryStats {
  totalToolExecutions: number
  totalWorkflowExecutions: number
  overallSuccessRate: number
  overallCacheHitRate: number
  averageToolDuration: number
  totalCacheHits: number
  totalCacheMisses: number
}

interface WorkflowAnalyticsDashboardProps {
  refreshInterval?: number // in milliseconds
}

export function WorkflowAnalyticsDashboard({ refreshInterval = 30000 }: WorkflowAnalyticsDashboardProps) {
  const [summary, setSummary] = React.useState<SummaryStats | null>(null)
  const [topPerforming, setTopPerforming] = React.useState<ToolMetrics[]>([])
  const [slowest, setSlowest] = React.useState<ToolMetrics[]>([])
  const [bestCached, setBestCached] = React.useState<ToolMetrics[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch summary stats
      const summaryRes = await fetch('/api/analytics/workflows?type=summary')
      if (!summaryRes.ok) throw new Error('Failed to fetch summary')
      const summaryData = await summaryRes.json()
      setSummary(summaryData.data)

      // Fetch top performing tools
      const topRes = await fetch('/api/analytics/workflows?type=top-performing&limit=5')
      if (!topRes.ok) throw new Error('Failed to fetch top performing')
      const topData = await topRes.json()
      setTopPerforming(topData.data)

      // Fetch slowest tools
      const slowestRes = await fetch('/api/analytics/workflows?type=slowest&limit=5')
      if (!slowestRes.ok) throw new Error('Failed to fetch slowest')
      const slowestData = await slowestRes.json()
      setSlowest(slowestData.data)

      // Fetch best cached tools
      const cachedRes = await fetch('/api/analytics/workflows?type=best-cached&limit=5')
      if (!cachedRes.ok) throw new Error('Failed to fetch cached')
      const cachedData = await cachedRes.json()
      setBestCached(cachedData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('[Workflow Analytics] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh
  React.useEffect(() => {
    if (!refreshInterval) return
    const interval = setInterval(fetchAnalytics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, fetchAnalytics])

  if (loading && !summary) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <Card className="border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            Error Loading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available yet. Start using workflows to see metrics.</p>
      </div>
    )
  }

  const successRate = (summary.overallSuccessRate || 0) * 100
  const cacheHitRate = (summary.overallCacheHitRate || 0) * 100

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Executions"
          value={(summary.totalToolExecutions || 0).toLocaleString()}
          description={`${summary.totalWorkflowExecutions || 0} workflows`}
          icon={Activity}
          trend={null}
        />
        <SummaryCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          description={successRate >= 90 ? 'Excellent' : successRate >= 75 ? 'Good' : 'Needs attention'}
          icon={successRate >= 90 ? CheckCircle2 : successRate >= 75 ? Activity : XCircle}
          trend={successRate >= 90 ? 'up' : successRate >= 75 ? null : 'down'}
        />
        <SummaryCard
          title="Cache Hit Rate"
          value={`${cacheHitRate.toFixed(1)}%`}
          description={`${summary.totalCacheHits || 0} hits, ${summary.totalCacheMisses || 0} misses`}
          icon={Database}
          trend={cacheHitRate >= 60 ? 'up' : null}
        />
        <SummaryCard
          title="Avg Duration"
          value={`${((summary.averageToolDuration || 0) / 1000).toFixed(2)}s`}
          description="Per tool execution"
          icon={Clock}
          trend={null}
        />
      </div>

      {/* Tool Performance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Performing Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Top Performing Tools
            </CardTitle>
            <CardDescription>Highest success rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerforming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                topPerforming.map((tool) => (
                  <ToolMetricRow
                    key={tool.toolName}
                    name={tool.toolName}
                    value={`${((tool.successfulExecutions / tool.totalExecutions) * 100).toFixed(1)}%`}
                    subValue={`${tool.totalExecutions} executions`}
                    progress={(tool.successfulExecutions / tool.totalExecutions) * 100}
                    variant="success"
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slowest Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-orange-500" />
              Slowest Tools
            </CardTitle>
            <CardDescription>Potential bottlenecks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slowest.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                slowest.map((tool) => (
                  <ToolMetricRow
                    key={tool.toolName}
                    name={tool.toolName}
                    value={`${(tool.averageDuration / 1000).toFixed(2)}s`}
                    subValue={`${tool.totalExecutions} executions`}
                    progress={null}
                    variant="warning"
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Best Cached Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-4 w-4 text-blue-500" />
              Best Cached Tools
            </CardTitle>
            <CardDescription>Highest cache hit rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestCached.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                bestCached.map((tool) => (
                  <ToolMetricRow
                    key={tool.toolName}
                    name={tool.toolName}
                    value={`${(tool.cacheHitRate * 100).toFixed(1)}%`}
                    subValue={`${tool.cacheHits} hits`}
                    progress={tool.cacheHitRate * 100}
                    variant="info"
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper Components

interface SummaryCardProps {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend: 'up' | 'down' | null
}

function SummaryCard({ title, value, description, icon: Icon, trend }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

interface ToolMetricRowProps {
  name: string
  value: string
  subValue: string
  progress: number | null
  variant: 'success' | 'warning' | 'info'
}

function ToolMetricRow({ name, value, subValue, progress, variant }: ToolMetricRowProps) {
  const variantColors = {
    success: 'bg-purple-500',
    warning: 'bg-blue-400',
    info: 'bg-primary',
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate max-w-[180px]" title={name}>
          {name}
        </span>
        <Badge variant="outline" className="ml-2">
          {value}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {progress !== null && (
          <Progress value={progress} className="h-1.5 flex-1" indicatorClassName={variantColors[variant]} />
        )}
        <span className="text-xs text-muted-foreground whitespace-nowrap">{subValue}</span>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


