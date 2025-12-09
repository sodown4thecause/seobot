import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { serverEnv, clientEnv } from '@/lib/config/env'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin-check'

/**
 * Generate a pseudonymous ID for an email address using HMAC-SHA256.
 * Normalizes email (lowercase, trim) before hashing for consistency.
 */
function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim()
  const secret = serverEnv.SUPABASE_SERVICE_ROLE_KEY // Use existing server secret
  return createHmac('sha256', secret).update(normalized).digest('hex').slice(0, 16)
}

const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
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

    // Track conversion event (log pseudonymous ID, not PII)
    console.log('[Audit Leads] Lead captured:', {
      leadHash: hashEmail(email),
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

// Get leads (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

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

