import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { isAdmin } from '@/lib/auth/admin-check'
import { db, auditEvents, type Json } from '@/lib/db'
import { gte } from 'drizzle-orm'

const AUDIT_EVENT_TYPES = new Set([
  'audit_started',
  'audit_completed',
  'audit_failed',
  'email_captured',
  'results_viewed',
  'cta_clicked',
])

type NormalizedAuditEvent = {
  eventType: string
  sessionId: string
  brandName: string | null
  url: string | null
  email: string | null
  score: number | null
  grade: string | null
  properties: Json
  referrer: string | null
  userAgent: string | null
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizeOptionalNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return value
}

function normalizeAuditEvent(body: unknown): { ok: true; data: NormalizedAuditEvent } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Malformed payload.' }
  }

  const eventTypeRaw = Reflect.get(body, 'eventType')
  const sessionIdRaw = Reflect.get(body, 'sessionId')
  const propertiesRaw = Reflect.get(body, 'properties')

  const eventType = normalizeOptionalText(eventTypeRaw)
  if (!eventType || !AUDIT_EVENT_TYPES.has(eventType)) {
    return { ok: false, error: 'Invalid eventType.' }
  }

  const sessionId = normalizeOptionalText(sessionIdRaw)
  if (!sessionId) {
    return { ok: false, error: 'Invalid sessionId.' }
  }

  let properties: Json = {}
  if (typeof propertiesRaw !== 'undefined') {
    if (!propertiesRaw || typeof propertiesRaw !== 'object' || Array.isArray(propertiesRaw)) {
      return { ok: false, error: 'Invalid properties object.' }
    }

    properties = propertiesRaw as Json
  }

  return {
    ok: true,
    data: {
      eventType,
      sessionId,
      brandName: normalizeOptionalText(Reflect.get(body, 'brandName')),
      url: normalizeOptionalText(Reflect.get(body, 'url')),
      email: normalizeOptionalText(Reflect.get(body, 'email'))?.toLowerCase() || null,
      score: normalizeOptionalNumber(Reflect.get(body, 'score')),
      grade: normalizeOptionalText(Reflect.get(body, 'grade')),
      properties,
      referrer: normalizeOptionalText(Reflect.get(body, 'referrer')),
      userAgent: normalizeOptionalText(Reflect.get(body, 'userAgent')),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Malformed payload.' }, { status: 400 })
    }

    const normalized = normalizeAuditEvent(body)
    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }

    await db.insert(auditEvents).values({
      eventType: normalized.data.eventType,
      sessionId: normalized.data.sessionId,
      brandName: normalized.data.brandName,
      url: normalized.data.url,
      email: normalized.data.email,
      score: normalized.data.score,
      grade: normalized.data.grade,
      properties: normalized.data.properties,
      referrer: normalized.data.referrer,
      userAgent: normalized.data.userAgent,
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

