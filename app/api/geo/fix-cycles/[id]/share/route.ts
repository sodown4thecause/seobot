import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth-config'
import { db, geoFixCycles } from '@/lib/db'
import { generateFixCycleShareToken } from '@/lib/geo/fix-cycle'

type RouteContext = {
  params: Promise<{ id: string }>
}

async function getOwnerId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export async function POST(_request: Request, context: RouteContext) {
  const userId = await getOwnerId()
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { id } = await context.params
  const [cycle] = await db.select({ id: geoFixCycles.id })
    .from(geoFixCycles)
    .where(and(eq(geoFixCycles.id, id), eq(geoFixCycles.userId, userId)))
    .limit(1)

  if (!cycle) return NextResponse.json({ error: 'Fix cycle not found' }, { status: 404 })

  const shareToken = generateFixCycleShareToken()
  const [updated] = await db.update(geoFixCycles)
    .set({ shareToken })
    .where(eq(geoFixCycles.id, cycle.id))
    .returning({ shareToken: geoFixCycles.shareToken })

  return NextResponse.json({
    success: true,
    shareToken: updated.shareToken,
    shareUrl: `${new URL(_request.url).origin}/proof/${updated.shareToken}`,
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getOwnerId()
  if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { id } = await context.params
  const [updated] = await db.update(geoFixCycles)
    .set({ shareToken: null })
    .where(and(eq(geoFixCycles.id, id), eq(geoFixCycles.userId, userId)))
    .returning({ id: geoFixCycles.id })

  if (!updated) return NextResponse.json({ error: 'Fix cycle not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
