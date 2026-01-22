import { NextRequest, NextResponse } from 'next/server'
import { subDays } from 'date-fns'
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

    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const _startDate = subDays(new Date(), days)

    // TODO: Implement api_usage_logs table in schema
    // Table needs: user_id, service, cost_usd, created_at
    // const logs = await db
    //   .select({
    //     service: apiUsageLogs.service,
    //     costUsd: apiUsageLogs.costUsd,
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

    // Group by service
    const serviceMap: Record<string, { cost: number; calls: number }> = {}
    logs.forEach(log => {
      if (!serviceMap[log.service]) {
        serviceMap[log.service] = { cost: 0, calls: 0 }
      }
      serviceMap[log.service].cost += Number(log.costUsd) || 0
      serviceMap[log.service].calls += 1
    })

    // Calculate total cost
    const totalCost = Object.values(serviceMap).reduce((sum, s) => sum + s.cost, 0)

    // Convert to array with percentages
    const data = Object.entries(serviceMap)
      .map(([service, stats]) => ({
        service,
        cost: stats.cost,
        calls: stats.calls,
        percentage: totalCost > 0 ? (stats.cost / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.cost - a.cost)

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

