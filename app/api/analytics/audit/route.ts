import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { isAdmin } from '@/lib/auth/admin-check'
import { db, auditEvents } from '@/lib/db'
import { gte } from 'drizzle-orm'

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

    await db.insert(auditEvents).values({
      eventType,
      sessionId,
      brandName: brandName || null,
      url: url || null,
      email: email?.toLowerCase().trim() || null,
      score: score || null,
      grade: grade || null,
      properties: properties || {},
      referrer: referrer || null,
      userAgent: userAgent || null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Audit Analytics] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get analytics summary (admin only)
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
    const days = parseInt(searchParams.get('days') || '7')

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Get event counts by type
    const events = await db
      .select()
      .from(auditEvents)
      .where(gte(auditEvents.createdAt, since))

    // Count events by type
    const counts = events.reduce(
      (acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
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

