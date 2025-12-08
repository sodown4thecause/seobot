import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventType,
      sessionId,
      brandName,
      url,
      email,
      score,
      grade,
      properties,
      referrer,
      userAgent,
    } = body

    if (!eventType || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase.from('audit_events').insert({
      event_type: eventType,
      session_id: sessionId,
      brand_name: brandName || null,
      url: url || null,
      email: email?.toLowerCase().trim() || null,
      score: score || null,
      grade: grade || null,
      properties: properties || {},
      referrer: referrer || null,
      user_agent: userAgent || null,
    })

    if (error) {
      console.error('[Audit Analytics] Database error:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Audit Analytics] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get analytics summary (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Get event counts by type
    const { data: events, error } = await supabase
      .from('audit_events')
      .select('event_type')
      .gte('created_at', since.toISOString())

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Count events by type
    const counts = events?.reduce(
      (acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Calculate conversion rates
    const started = counts?.audit_started || 0
    const completed = counts?.audit_completed || 0
    const emailsCaptured = counts?.email_captured || 0
    const ctaClicks = counts?.cta_clicked || 0

    return NextResponse.json({
      period: `${days} days`,
      counts,
      conversionRates: {
        completionRate: started > 0 ? ((completed / started) * 100).toFixed(1) + '%' : '0%',
        emailCaptureRate: completed > 0 ? ((emailsCaptured / completed) * 100).toFixed(1) + '%' : '0%',
        ctaClickRate: emailsCaptured > 0 ? ((ctaClicks / emailsCaptured) * 100).toFixed(1) + '%' : '0%',
      },
    })
  } catch (error) {
    console.error('[Audit Analytics] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

