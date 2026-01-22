import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
// import { db } from '@/lib/db'
// import { apiUsageLogs } from '@/lib/db/schema'
// import { eq, gte, and } from 'drizzle-orm'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const _userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    // Calculate date range
    const now = new Date()
    let _startDate: Date
    
    switch (period) {
      case 'day':
        _startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        _startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        _startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        _startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // TODO: Implement api_usage_logs table in schema
    // Table needs: user_id, service, cost_usd, duration_ms, created_at
    // const logs = await db
    //   .select({
    //     service: apiUsageLogs.service,
    //     costUsd: apiUsageLogs.costUsd,
    //     durationMs: apiUsageLogs.durationMs,
    //   })
    //   .from(apiUsageLogs)
    //   .where(
    //     and(
    //       eq(apiUsageLogs.userId, userId),
    //       gte(apiUsageLogs.createdAt, startDate)
    //     )
    //   )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: any[] = []

    // Calculate summary
    const totalCalls = logs.length
    const totalCost = logs.reduce((sum, log) => sum + (Number(log.costUsd) || 0), 0)
    const avgDuration = logs.length 
      ? logs.reduce((sum, log) => sum + (log.durationMs || 0), 0) / logs.length
      : 0

    // Find top service
    const serviceCounts: Record<string, number> = {}
    logs.forEach(log => {
      serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1
    })
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    return NextResponse.json({
      success: true,
      summary: {
        totalCalls,
        totalCost,
        avgDuration,
        topService,
      },
    })
  } catch (error) {
    console.error('[Admin Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

