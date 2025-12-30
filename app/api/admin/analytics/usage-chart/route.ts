import { NextRequest, NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'
import { requireUserId } from '@/lib/auth/clerk'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const startDate = subDays(new Date(), days)

    // TODO: Implement api_usage_logs table in schema
    // const logs = await db
    //   .select({ createdAt: apiUsageLogs.createdAt })
    //   .from(apiUsageLogs)
    //   .where(
    //     eq(apiUsageLogs.userId, userId),
    //     gte(apiUsageLogs.createdAt, startDate)
    //   )

    // Group by date
    const dateMap: Record<string, number> = {}
    // logs.forEach(log => {
    //   const date = format(new Date(log.createdAt), 'MMM dd')
    //   dateMap[date] = (dateMap[date] || 0) + 1
    // })

    // Convert to array
    const data = Object.entries(dateMap).map(([date, calls]) => ({
      date,
      calls,
    }))

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

