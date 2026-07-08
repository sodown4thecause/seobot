import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestSearchConsoleSnapshot } from '@/lib/search-console/rag'
import { querySearchConsoleAnalytics } from '@/lib/search-console/client'
import { upsertSearchConsoleConnection, recordSearchConsoleSnapshot } from '@/lib/search-console/store'

export const maxDuration = 120

const snapshotRequestSchema = z.object({
  siteUrl: z.string().trim().min(1).max(500),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rowLimit: z.number().int().min(1).max(1000).optional(),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = snapshotRequestSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid Search Console snapshot request', details: parsedBody.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const rows = await querySearchConsoleAnalytics(userId, {
      siteUrl: parsedBody.data.siteUrl,
      startDate: parsedBody.data.startDate,
      endDate: parsedBody.data.endDate,
      rowLimit: parsedBody.data.rowLimit ?? 250,
    })

    const ingest = await ingestSearchConsoleSnapshot({
      userId,
      siteUrl: parsedBody.data.siteUrl,
      startDate: parsedBody.data.startDate,
      endDate: parsedBody.data.endDate,
      rows: rows.map(row => ({
        query: row.keys?.[0] || '(unknown query)',
        page: row.keys?.[1],
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      })),
    })

    await upsertSearchConsoleConnection(userId, parsedBody.data.siteUrl)
    const snapshot = await recordSearchConsoleSnapshot(userId, parsedBody.data.siteUrl, {
      rowCount: rows.length,
      chunkCount: ingest.chunkCount,
      documentIds: ingest.documentIds,
      startDate: parsedBody.data.startDate,
      endDate: parsedBody.data.endDate,
    })

    return NextResponse.json({
      ok: true,
      rowCount: rows.length,
      chunkCount: ingest.chunkCount,
      documentIds: ingest.documentIds,
      snapshotId: snapshot.id,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to import Search Console snapshot',
      },
      { status: 400 }
    )
  }
}
