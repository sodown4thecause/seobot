import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { requireUserId } from '@/lib/auth/clerk'
import { isAdmin } from '@/lib/auth/admin-check'
import { db, redditGapAudits } from '@/lib/db'
import { desc, sql } from 'drizzle-orm'

function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim()
  const secret = process.env.CLERK_SECRET_KEY || 'fallback-secret-key'
  return createHmac('sha256', secret).update(normalized).digest('hex').slice(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, topic, url, overallGapScore, source = 'reddit_gap_landing' } = body

    if (!email || !topic) {
      return NextResponse.json({ error: 'Missing required fields: email, topic' }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const [data] = await db
      .insert(redditGapAudits)
      .values({
        email: email.toLowerCase().trim(),
        topic,
        url: url || null,
        overallGapScore: overallGapScore || null,
        source,
        ipAddress,
        userAgent,
      })
      .onConflictDoUpdate({
        target: [redditGapAudits.email, redditGapAudits.topic],
        set: {
          overallGapScore: sql`excluded.overall_gap_score`,
          source: sql`excluded.source`,
          ipAddress: sql`excluded.ip_address`,
          updatedAt: new Date(),
        },
      })
      .returning()

    console.log('[Reddit Gap Leads] Lead captured:', {
      leadHash: hashEmail(email),
      topic,
      overallGapScore,
      source,
    })

    return NextResponse.json({ success: true, leadId: data?.id })
  } catch (error) {
    console.error('[Reddit Gap Leads] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const admin = await isAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const leads = await db
      .select()
      .from(redditGapAudits)
      .orderBy(desc(redditGapAudits.createdAt))
      .limit(limit)
      .offset(offset)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(redditGapAudits)

    return NextResponse.json({ leads, total: count })
  } catch (error) {
    console.error('[Reddit Gap Leads] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}