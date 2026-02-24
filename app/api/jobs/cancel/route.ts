import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { refreshJobs } from '@/lib/db/schema'

interface CancelBody {
  jobId?: string
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as CancelBody
  if (!body.jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  const cancelledRows = await db
    .update(refreshJobs)
    .set({ status: 'cancelled', updatedAt: new Date(), completedAt: new Date() })
    .where(
      and(
        eq(refreshJobs.id, body.jobId),
        eq(refreshJobs.userId, userId),
        inArray(refreshJobs.status, ['queued', 'processing'])
      )
    )
    .returning({ id: refreshJobs.id })

  return NextResponse.json({ ok: true, cancelled: cancelledRows.length > 0 })
}
