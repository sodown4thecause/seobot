import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import type { AuditVisibilityState } from '@/lib/audit/types'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asRows(result: unknown): Array<{ id?: string; public_visibility?: AuditVisibilityState }> {
  if (Array.isArray(result)) {
    return result as Array<{ id?: string; public_visibility?: AuditVisibilityState }>
  }

  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: Array<{ id?: string; public_visibility?: AuditVisibilityState }> }).rows
  }

  return []
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params
  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Authentication required.' }, { status: 401 })
  }

  const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase().trim()
  if (!userEmail) {
    return NextResponse.json({ ok: false, message: 'Unable to verify account email.' }, { status: 403 })
  }

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ ok: false, message: 'Invalid audit id format.' }, { status: 400 })
  }

  const body = (await request.json()) as { visibility?: AuditVisibilityState }
  const visibility = body.visibility

  if (visibility !== 'unlisted' && visibility !== 'public' && visibility !== 'private') {
    return NextResponse.json({ ok: false, message: 'Visibility must be unlisted, public, or private.' }, { status: 400 })
  }

  try {
    const result = await db.execute(sql`
      UPDATE ai_visibility_audits
      SET public_visibility = ${visibility}, updated_at = NOW()
      WHERE id = ${id} AND lower(email) = ${userEmail}
      RETURNING id, public_visibility
    `)

    const row = asRows(result)[0]
    if (!row?.id) {
      return NextResponse.json({ ok: false, message: 'Audit report not found.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, id: row.id, visibility: row.public_visibility || visibility })
  } catch (error) {
    console.error('[AI Visibility Audit] Failed to update visibility:', error)
    return NextResponse.json({ ok: false, message: 'Failed to update visibility.' }, { status: 500 })
  }
}
