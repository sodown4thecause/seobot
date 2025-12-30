import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { requireUserId } from '@/lib/auth/clerk'
import { isAdmin } from '@/lib/auth/admin-check'
import { db, auditLeads } from '@/lib/db'
import { desc, sql } from 'drizzle-orm'

/**
 * Generate a pseudonymous ID for an email address using HMAC-SHA256.
 * Normalizes email (lowercase, trim) before hashing for consistency.
 */
function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim()
  const secret = process.env.CLERK_SECRET_KEY || 'fallback-secret-key'
  return createHmac('sha256', secret).update(normalized).digest('hex').slice(0, 16)
}

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
    const [data] = await db
      .insert(auditLeads)
      .values({
        email: email.toLowerCase().trim(),
        brandName,
        url,
        score,
        grade,
        report,
        source,
        ipAddress,
        userAgent,
      })
      .onConflictDoUpdate({
        target: [auditLeads.email, auditLeads.url],
        set: {
          brandName: sql`excluded.brand_name`,
          score: sql`excluded.score`,
          grade: sql`excluded.grade`,
          report: sql`excluded.report`,
          source: sql`excluded.source`,
          ipAddress: sql`excluded.ip_address`,
          userAgent: sql`excluded.user_agent`,
          updatedAt: new Date(),
        }
      })
      .returning()

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
    const userId = await requireUserId()

    // Check admin access
    const admin = await isAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const leads = await db
      .select()
      .from(auditLeads)
      .orderBy(desc(auditLeads.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLeads)

    return NextResponse.json({ leads, total: count })
  } catch (error) {
    console.error('[Audit Leads] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

