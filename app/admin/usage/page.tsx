'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UsageSummary {
  totalCalls: number
  activeUsers: number
  totalCost: number
  totalTokens: number
  avgCostPerCall: number
}

interface UserStat {
  user_id: string
  call_count: number
  total_cost: number
  total_tokens: number
  total_tool_calls: number
  provider_breakdown: Record<string, { cost: number; calls: number }>
}

interface ProviderStat {
  provider: string
  call_count: number
  total_cost: number
  total_tokens: number
}

interface ModelStat {
  model: string
  call_count: number
  total_cost: number
  total_prompt_tokens: number
  total_completion_tokens: number
}

interface UsageData {
  summary: UsageSummary
  userStats: UserStat[]
  providerStats: ProviderStat[]
  modelStats: ModelStat[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsagePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UsageData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchUsageData()
  }, [dateRange, selectedUserId, page])

  const fetchUsageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from)
      if (dateRange.to) params.append('to', dateRange.to)
      if (selectedUserId) params.append('user_id', selectedUserId)
      params.append('page', page.toString())
      params.append('limit', '50')

      const response = await fetch(`/api/admin/usage?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch usage data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching usage data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Usage Analytics</h1>
          <p className="text-gray-400 mt-1">
            Monitor AI usage and costs across all users and providers
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#0f0f0f] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="from" className="text-gray-400">From Date</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="bg-[#1a1a1a] border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="to" className="text-gray-400">To Date</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="bg-[#1a1a1a] border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="user_id" className="text-gray-400">User ID (optional)</Label>
              <Input
                id="user_id"
                type="text"
                placeholder="Filter by user ID"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                className="bg-[#1a1a1a] border-white/10 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading usage data...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-[#0f0f0f] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Calls</CardTitle>
                <Activity className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(data.summary.totalCalls)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(data.summary.activeUsers)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(data.summary.totalCost)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Tokens</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(data.summary.totalTokens)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Cost/Call</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(data.summary.avgCostPerCall)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="bg-white/10">
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Users
              </TabsTrigger>
              <TabsTrigger value="providers" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Providers
              </TabsTrigger>
              <TabsTrigger value="models" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Models
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card className="bg-[#0f0f0f] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">User Usage Statistics</CardTitle>
                  <CardDescription className="text-gray-400">
                    Total: {formatNumber(data.pagination.total)} users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-3 text-gray-400 font-medium">User ID</th>
                          <th className="pb-3 text-gray-400 font-medium">Calls</th>
                          <th className="pb-3 text-gray-400 font-medium">Cost</th>
                          <th className="pb-3 text-gray-400 font-medium">Tokens</th>
                          <th className="pb-3 text-gray-400 font-medium">Providers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.userStats.map((user) => (
                          <tr key={user.user_id} className="border-b border-white/5">
                            <td className="py-3 text-white font-mono text-sm">
                              {user.user_id.substring(0, 8)}...
                            </td>
                            <td className="py-3 text-gray-300">{formatNumber(user.call_count)}</td>
                            <td className="py-3 text-white font-semibold">
                              {formatCurrency(user.total_cost)}
                            </td>
                            <td className="py-3 text-gray-300">{formatNumber(user.total_tokens)}</td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(user.provider_breakdown).map(([provider, stats]) => (
                                  <span
                                    key={provider}
                                    className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
                                  >
                                    {provider}: {formatCurrency(stats.cost)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-400">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                          disabled={page === data.pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <Card className="bg-[#0f0f0f] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Provider Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-3 text-gray-400 font-medium">Provider</th>
                          <th className="pb-3 text-gray-400 font-medium">Calls</th>
                          <th className="pb-3 text-gray-400 font-medium">Cost</th>
                          <th className="pb-3 text-gray-400 font-medium">Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.providerStats.map((provider) => (
                          <tr key={provider.provider} className="border-b border-white/5">
                            <td className="py-3 text-white font-semibold">{provider.provider}</td>
                            <td className="py-3 text-gray-300">{formatNumber(provider.call_count)}</td>
                            <td className="py-3 text-white font-semibold">
                              {formatCurrency(provider.total_cost)}
                            </td>
                            <td className="py-3 text-gray-300">{formatNumber(provider.total_tokens)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <Card className="bg-[#0f0f0f] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Model Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="pb-3 text-gray-400 font-medium">Model</th>
                          <th className="pb-3 text-gray-400 font-medium">Calls</th>
                          <th className="pb-3 text-gray-400 font-medium">Cost</th>
                          <th className="pb-3 text-gray-400 font-medium">Prompt Tokens</th>
                          <th className="pb-3 text-gray-400 font-medium">Completion Tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.modelStats.map((model) => (
                          <tr key={model.model} className="border-b border-white/5">
                            <td className="py-3 text-white font-mono text-sm">{model.model}</td>
                            <td className="py-3 text-gray-300">{formatNumber(model.call_count)}</td>
                            <td className="py-3 text-white font-semibold">
                              {formatCurrency(model.total_cost)}
                            </td>
                            <td className="py-3 text-gray-300">
                              {formatNumber(model.total_prompt_tokens)}
                            </td>
                            <td className="py-3 text-gray-300">
                              {formatNumber(model.total_completion_tokens)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

