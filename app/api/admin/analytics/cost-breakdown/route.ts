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
      .select('service, cost_usd')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('[Admin Analytics] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by service
    const serviceMap: Record<string, { cost: number; calls: number }> = {}
    logs?.forEach((log: { service: string; cost_usd: number | null }) => {
      if (!serviceMap[log.service]) {
        serviceMap[log.service] = { cost: 0, calls: 0 }
      }
      serviceMap[log.service].cost += Number(log.cost_usd) || 0
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

