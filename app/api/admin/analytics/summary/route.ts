import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Fetch summary data
    const { data: logs, error } = await supabase
      .from('api_usage_logs')
      .select('service, cost_usd, duration_ms')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('[Admin Analytics] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate summary
    const totalCalls = logs?.length || 0
    const totalCost = logs?.reduce((sum: number, log: { cost_usd: number | null }) => sum + (Number(log.cost_usd) || 0), 0) || 0
    const avgDuration = logs?.length 
      ? logs.reduce((sum: number, log: { duration_ms: number | null }) => sum + (log.duration_ms || 0), 0) / logs.length
      : 0

    // Find top service
    const serviceCounts: Record<string, number> = {}
    logs?.forEach((log: { service: string }) => {
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

