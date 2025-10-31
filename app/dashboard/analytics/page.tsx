/**
 * Analytics Dashboard Page
 *
 * Displays usage analytics, popular features, and insights
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  MessageSquare,
  FileText,
  Download,
  Users,
  Activity,
  Zap,
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalMessages: number
    totalContentGenerated: number
    totalExports: number
    activeUsersToday: number
    activeUsersThisWeek: number
    activeUsersThisMonth: number
  }
  usageByDay: Array<{
    date: string
    messages: number
    contentGenerated: number
    exports: number
  }>
  popularFrameworks: Array<{
    name: string
    category: string
    usageCount: number
  }>
  topFeatures: Array<{
    feature: string
    usageCount: number
  }>
  apiEndpointUsage: Array<{
    endpoint: string
    requestCount: number
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const { data } = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-red-500 mb-4">{error || 'Failed to load analytics'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Retry
        </button>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Messages',
      value: analytics.overview.totalMessages.toLocaleString(),
      icon: MessageSquare,
      change: '+12%',
      color: 'bg-blue-500',
    },
    {
      title: 'Content Generated',
      value: analytics.overview.totalContentGenerated.toLocaleString(),
      icon: FileText,
      change: '+8%',
      color: 'bg-green-500',
    },
    {
      title: 'Total Exports',
      value: analytics.overview.totalExports.toLocaleString(),
      icon: Download,
      change: '+23%',
      color: 'bg-orange-500',
    },
    {
      title: 'Active Users (30d)',
      value: analytics.overview.activeUsersThisMonth.toLocaleString(),
      icon: Users,
      change: '+5%',
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your SEO chatbot usage and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-green-500 font-medium">{stat.change}</span>
            </div>
            <h3 className="text-sm text-muted-foreground mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Usage Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.usageByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" name="Messages" />
              <Line type="monotone" dataKey="contentGenerated" stroke="#10b981" name="Content Generated" />
              <Line type="monotone" dataKey="exports" stroke="#f59e0b" name="Exports" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Popular Frameworks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Popular Frameworks</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.popularFrameworks.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="usageCount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Features and API Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Top Features Used</h2>
          <div className="space-y-3">
            {analytics.topFeatures.map((feature, index) => (
              <div key={feature.feature} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium capitalize">{feature.feature.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{feature.usageCount}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(feature.usageCount / analytics.topFeatures[0].usageCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* API Endpoint Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold mb-4">API Endpoint Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.apiEndpointUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.endpoint.split('/').pop()}: ${(props.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="requestCount"
              >
                {analytics.apiEndpointUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
