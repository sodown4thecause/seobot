import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { subDays } from 'date-fns'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const startDate = subDays(new Date(), days)

    // Fetch logs
    const { data: logs, error } = await supabase
      .from('api_usage_logs')
      .select('service, cost_usd, duration_ms, status_code')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('[Admin Analytics] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by service
    const serviceMap: Record<string, {
      totalCalls: number
      totalCost: number
      totalDuration: number
      successCount: number
    }> = {}

    logs?.forEach(log => {
      if (!serviceMap[log.service]) {
        serviceMap[log.service] = {
          totalCalls: 0,
          totalCost: 0,
          totalDuration: 0,
          successCount: 0,
        }
      }
      serviceMap[log.service].totalCalls += 1
      serviceMap[log.service].totalCost += Number(log.cost_usd) || 0
      serviceMap[log.service].totalDuration += log.duration_ms || 0
      if (log.status_code && log.status_code >= 200 && log.status_code < 300) {
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

