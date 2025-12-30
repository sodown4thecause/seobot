/**
 * Analytics API
 *
 * Provides usage analytics and insights
 * Tracks chat messages, framework usage, export activity, and more
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { cacheGet, cacheSet, CACHE_PREFIXES, CACHE_TTL } from '@/lib/redis/client'
import { db } from '@/lib/db'
import { writingFrameworks, chatMessages } from '@/lib/db/schema'
import { desc, gte } from 'drizzle-orm'

export const runtime = 'edge'

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

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get date N days ago
 */
function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return getDateString(date)
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId()

    // Check cache first (cache for 5 minutes)
    const cacheKey = `${CACHE_PREFIXES.USER_ANALYTICS}${userId}`
    const cached = await cacheGet<AnalyticsData>(cacheKey)
    
    if (cached) {
      return NextResponse.json({ data: cached, cached: true })
    }

    // Get date ranges
    const today = getDateString(new Date())
    const weekAgo = getDateDaysAgo(7)
    const monthAgo = getDateDaysAgo(30)
    
    // TODO: Implement user_stats table in schema
    const overview = {
      totalUsers: 1,
      totalMessages: 0,
      totalContentGenerated: 0,
      totalExports: 0,
      activeUsersToday: 1,
      activeUsersThisWeek: 1,
      activeUsersThisMonth: 1,
    }
    
    // TODO: Implement analytics_snapshots table in schema
    const usageByDay: Array<{
      date: string
      messages: number
      contentGenerated: number
      exports: number
    }> = []
    
    // Get popular frameworks (existing table)
    const frameworks = await db
      .select({
        name: writingFrameworks.name,
        category: writingFrameworks.category,
        usageCount: writingFrameworks.usageCount,
      })
      .from(writingFrameworks)
      .orderBy(desc(writingFrameworks.usageCount))
      .limit(10)
    
    const popularFrameworks = frameworks.map((f) => ({
      name: f.name,
      category: f.category,
      usageCount: f.usageCount || 0,
    }))
    
    // TODO: Query chat_messages table - already exists in schema but query needs proper filtering
    const topFeatures: Array<{ feature: string; usageCount: number }> = []
    
    // API endpoint usage (mock data for now)
    const apiEndpointUsage = [
      { endpoint: '/api/chat', requestCount: Math.floor(Math.random() * 1000) },
      { endpoint: '/api/content/export', requestCount: Math.floor(Math.random() * 500) },
      { endpoint: '/api/keywords/research', requestCount: Math.floor(Math.random() * 300) },
      { endpoint: '/api/competitors/discover', requestCount: Math.floor(Math.random() * 200) },
    ].sort((a, b) => b.requestCount - a.requestCount)
    
    const analyticsData: AnalyticsData = {
      overview,
      usageByDay,
      popularFrameworks,
      topFeatures,
      apiEndpointUsage,
    }
    
    // Cache for 5 minutes
    await cacheSet(cacheKey, analyticsData, 300)
    
    return NextResponse.json({ data: analyticsData, cached: false })
  } catch (error) {
    console.error('[Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

/**
 * Get current user's rate limit status
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({ message: 'Analytics API' })
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

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get date N days ago
 */
function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return getDateString(date)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first (cache for 5 minutes)
    const cacheKey = `${CACHE_PREFIXES.USER_ANALYTICS}${user.id}`
    const cached = await cacheGet<AnalyticsData>(cacheKey)

    if (cached) {
      return NextResponse.json({ data: cached, cached: true })
    }

    // Get date ranges
    const today = getDateString(new Date())
    const weekAgo = getDateDaysAgo(7)
    const monthAgo = getDateDaysAgo(30)

    // Get overview stats
    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const overview = {
      totalUsers: userStats?.total_users || 1,
      totalMessages: userStats?.total_messages || 0,
      totalContentGenerated: userStats?.total_content_generated || 0,
      totalExports: userStats?.total_exports || 0,
      activeUsersToday: userStats?.active_users_today || 1,
      activeUsersThisWeek: userStats?.active_users_week || 1,
      activeUsersThisMonth: userStats?.active_users_month || 1,
    }

    // Get usage by day (last 30 days)
    const { data: dailyUsage } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthAgo)
      .order('date', { ascending: true })

    const usageByDay = []
    for (let i = 29; i >= 0; i--) {
      const date = getDateDaysAgo(i)
      const dayData = dailyUsage?.find((d) => d.date === date)
      usageByDay.push({
        date,
        messages: dayData?.messages_count || 0,
        contentGenerated: dayData?.content_generated || 0,
        exports: dayData?.exports_count || 0,
      })
    }

    // Get popular frameworks
    const { data: frameworks } = await supabase
      .from('writing_frameworks')
      .select('name, category, usage_count')
      .order('usage_count', { ascending: false })
      .limit(10)

    const popularFrameworks =
      frameworks?.map((f) => ({
        name: f.name,
        category: f.category,
        usageCount: f.usage_count || 0,
      })) || []

    // Get feature usage (from logs or chat_messages)
    const { data: featureUsage } = await supabase
      .from('chat_messages')
      .select('metadata')
      .eq('user_id', user.id)
      .gte('created_at', monthAgo)

    const featureCounts = new Map<string, number>()
    featureUsage?.forEach((msg) => {
      const features = msg.metadata?.features || []
      features.forEach((feature: string) => {
        featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1)
      })
    })

    const topFeatures = Array.from(featureCounts.entries())
      .map(([feature, usageCount]) => ({ feature, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)

    // API endpoint usage (mock data for now)
    const apiEndpointUsage = [
      { endpoint: '/api/chat', requestCount: Math.floor(Math.random() * 1000) },
      { endpoint: '/api/content/export', requestCount: Math.floor(Math.random() * 500) },
      { endpoint: '/api/keywords/research', requestCount: Math.floor(Math.random() * 300) },
      { endpoint: '/api/competitors/discover', requestCount: Math.floor(Math.random() * 200) },
    ].sort((a, b) => b.requestCount - a.requestCount)

    const analyticsData: AnalyticsData = {
      overview,
      usageByDay,
      popularFrameworks,
      topFeatures,
      apiEndpointUsage,
    }

    // Cache for 5 minutes
    await cacheSet(cacheKey, analyticsData, 300)

    return NextResponse.json({ data: analyticsData, cached: false })
  } catch (error) {
    console.error('[Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

/**
 * Get current user's rate limit status
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({ message: 'Analytics API' })
}
