import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'

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
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('[Admin Analytics] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by date
    const dateMap: Record<string, number> = {}
    logs?.forEach((log: { created_at: string }) => {
      const date = format(new Date(log.created_at), 'MMM dd')
      dateMap[date] = (dateMap[date] || 0) + 1
    })

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

