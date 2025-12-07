import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, brandName, url, score, grade, report, source = 'landing_page' } = body

    if (!email || !brandName || !url) {
      return NextResponse.json({ error: 'Missing required fields: email, brandName, url' }, { status: 400 })
    }

    // Get IP and user agent for analytics
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Upsert to handle duplicate email+url combinations
    const { data, error } = await supabase
      .from('audit_leads')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          brand_name: brandName,
          url,
          score,
          grade,
          report,
          source,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        { onConflict: 'email,url' }
      )
      .select()
      .single()

    if (error) {
      console.error('[Audit Leads] Database error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    // Track conversion event
    console.log('[Audit Leads] Lead captured:', {
      email: email.toLowerCase().trim(),
      brandName,
      score,
      grade,
      source,
    })

    return NextResponse.json({ success: true, leadId: data?.id })
  } catch (error) {
    console.error('[Audit Leads] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get leads (admin only - add auth later)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error, count } = await supabase
      .from('audit_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    return NextResponse.json({ leads: data, total: count })
  } catch (error) {
    console.error('[Audit Leads] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

