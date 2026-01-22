/**
 * Analytics API
 *
 * Provides usage analytics and insights
 * Tracks chat messages, framework usage, export activity, and more
 * 
 * Migrated from Supabase to Drizzle ORM with Clerk auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/clerk'
import { db } from '@/lib/db'
import { writingFrameworks, chatMessages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { cacheGet, cacheSet, CACHE_PREFIXES } from '@/lib/redis/client'

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

export async function GET(_req: NextRequest) {
  try {
    // Get current user from Clerk
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first (cache for 5 minutes)
    const cacheKey = `${CACHE_PREFIXES.USER_ANALYTICS}${user.id}`
    const cached = await cacheGet<AnalyticsData>(cacheKey)

    if (cached) {
      return NextResponse.json({ data: cached, cached: true })
    }

    // Get date ranges
    const _monthAgo = getDateDaysAgo(30)

    // Get user stats from database using Drizzle
    let userStats
    try {
      const messageCount = await db
        .select({ count: chatMessages.id })
        .from(chatMessages)
        .where(eq(chatMessages.userId, user.id))
      
      userStats = {
        totalMessages: messageCount?.length || 0,
      }
    } catch (userStatsError) {
      console.error('[Analytics] Failed to fetch user stats:', userStatsError)
      return NextResponse.json(
        { error: 'Failed to fetch user statistics' },
        { status: 500 }
      )
    }

    // Check if userStats query succeeded
    if (!userStats) {
      console.error('[Analytics] User stats query returned no data')
      return NextResponse.json(
        { error: 'Failed to retrieve user statistics' },
        { status: 500 }
      )
    }

    // Overview stats - only construct if userStats is present
    const overview = {
      totalUsers: 1,
      totalMessages: userStats.totalMessages,
      totalContentGenerated: 0,
      totalExports: 0,
      activeUsersToday: 1,
      activeUsersThisWeek: 1,
      activeUsersThisMonth: 1,
    }

    // Usage by day (simplified - analytics_snapshots table may not exist)
    const usageByDay = []
    for (let i = 29; i >= 0; i--) {
      const date = getDateDaysAgo(i)
      usageByDay.push({
        date,
        messages: 0,
        contentGenerated: 0,
        exports: 0,
      })
    }

    // Get popular frameworks using Drizzle
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

    // Get feature usage from chat_messages using Drizzle
    const monthAgoDate = new Date()
    monthAgoDate.setDate(monthAgoDate.getDate() - 30)
    
    const featureUsage = await db
      .select({ metadata: chatMessages.metadata })
      .from(chatMessages)
      .where(eq(chatMessages.userId, user.id))

    const featureCounts = new Map<string, number>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    featureUsage?.forEach((msg: any) => {
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
export async function OPTIONS(_req: NextRequest) {
  return NextResponse.json({ message: 'Analytics API' })
}
