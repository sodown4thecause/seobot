import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { requireUserId } from '@/lib/auth/clerk'
import type { AuditConversionEvent, AuditConvertPayload } from '@/lib/audit/types'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SUPPORTED_EVENTS = new Set<AuditConversionEvent>(['strategy-call', 'full-audit'])

function toRows(result: unknown): Array<{ id?: unknown }> {
  if (Array.isArray(result)) {
    return result
  }

  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: Array<{ id?: unknown }> }).rows
    if (Array.isArray(rows)) {
      return rows
    }
  }

  return []
}

function isValidPayload(payload: unknown): payload is AuditConvertPayload {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const { auditId, event } = payload as Partial<AuditConvertPayload>
  return (
    typeof auditId === 'string' &&
    UUID_REGEX.test(auditId) &&
    typeof event === 'string' &&
    SUPPORTED_EVENTS.has(event as AuditConversionEvent)
  )
}

export async function POST(request: NextRequest) {
  try {
    await requireUserId()
  } catch {
    return NextResponse.json({ ok: false, message: 'Authentication required.' }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!isValidPayload(payload)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Expected payload: { auditId: UUID, event: "strategy-call" | "full-audit" }.',
      },
      { status: 400 }
    )
  }

  const existingAudit = await db.execute(sql`SELECT id FROM ai_visibility_audits WHERE id = ${payload.auditId} LIMIT 1`)
  if (toRows(existingAudit).length === 0) {
    return NextResponse.json({ ok: false, message: 'Audit not found.' }, { status: 404 })
  }

  await db.execute(sql`
    UPDATE ai_visibility_audits
    SET converted = true, updated_at = NOW()
    WHERE id = ${payload.auditId} AND converted = false
  `)

  return NextResponse.json({ ok: true })
}
