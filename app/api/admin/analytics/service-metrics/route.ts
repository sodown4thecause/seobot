import { NextRequest, NextResponse } from 'next/server'
import { subDays } from 'date-fns'
import { requireUserId } from '@/lib/auth/clerk'
// import { db } from '@/lib/db'
// import { apiUsageLogs } from '@/lib/db/schema'
// import { eq, gte, and } from 'drizzle-orm'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const startDate = subDays(new Date(), days)

    // TODO: Implement api_usage_logs table in schema
    // Table needs: user_id, service, cost_usd, duration_ms, status_code, created_at
    // const logs = await db
    //   .select({
    //     service: apiUsageLogs.service,
    //     costUsd: apiUsageLogs.costUsd,
    //     durationMs: apiUsageLogs.durationMs,
    //     statusCode: apiUsageLogs.statusCode,
    //   })
    //   .from(apiUsageLogs)
    //   .where(
    //     and(
    //       eq(apiUsageLogs.userId, userId),
    //       gte(apiUsageLogs.createdAt, startDate)
    //     )
    //   )

    const logs: any[] = []

    // Group by service
    const serviceMap: Record<string, {
      totalCalls: number
      totalCost: number
      totalDuration: number
      successCount: number
    }> = {}

    logs.forEach(log => {
      if (!serviceMap[log.service]) {
        serviceMap[log.service] = {
          totalCalls: 0,
          totalCost: 0,
          totalDuration: 0,
          successCount: 0,
        }
      }
      serviceMap[log.service].totalCalls += 1
      serviceMap[log.service].totalCost += Number(log.costUsd) || 0
      serviceMap[log.service].totalDuration += log.durationMs || 0
      if (log.statusCode && log.statusCode >= 200 && log.statusCode < 300) {
        serviceMap[log.service].successCount += 1
      }
    })

    // Convert to array with calculated metrics
    const data = Object.entries(serviceMap)
      .map(([service, stats]) => ({
        service,
        totalCalls: stats.totalCalls,
        totalCost: stats.totalCost,
        avgDuration: stats.totalCalls > 0 ? stats.totalDuration / stats.totalCalls : 0,
        successRate: stats.totalCalls > 0 ? (stats.successCount / stats.totalCalls) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[Admin Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

