import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  searchConsoleConnections,
  searchConsoleSnapshots,
  type Json,
  type SearchConsoleConnection,
  type SearchConsoleSnapshot,
} from '@/lib/db/schema'

export async function upsertSearchConsoleConnection(
  userId: string,
  siteUrl: string,
  siteName?: string
): Promise<SearchConsoleConnection> {
  const [row] = await db
    .insert(searchConsoleConnections)
    .values({
      userId,
      siteUrl,
      siteName,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: [searchConsoleConnections.userId, searchConsoleConnections.siteUrl],
      set: {
        status: 'active',
        ...(siteName ? { siteName } : {}),
      },
    })
    .returning()

  if (!row) {
    throw new Error('Failed to upsert Search Console connection')
  }
  return row
}

export async function recordSearchConsoleSnapshot(
  userId: string,
  siteUrl: string,
  data: {
    startDate?: string
    endDate?: string
    rowCount?: number
    chunkCount?: number
    documentIds?: Json
    metadata?: Json
  }
): Promise<SearchConsoleSnapshot> {
  const [connection] = await db
    .select({ id: searchConsoleConnections.id })
    .from(searchConsoleConnections)
    .where(and(
      eq(searchConsoleConnections.userId, userId),
      eq(searchConsoleConnections.siteUrl, siteUrl),
    ))
    .limit(1)

  const [row] = await db
    .insert(searchConsoleSnapshots)
    .values({
      userId,
      siteUrl,
      connectionId: connection?.id,
      startDate: data.startDate,
      endDate: data.endDate,
      rowCount: data.rowCount ?? 0,
      chunkCount: data.chunkCount ?? 0,
      documentIds: data.documentIds ?? [],
      metadata: data.metadata ?? {},
    })
    .returning()

  if (!row) {
    throw new Error('Failed to record Search Console snapshot')
  }

  if (connection) {
    await db
      .update(searchConsoleConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(searchConsoleConnections.id, connection.id))
  }

  return row
}

export async function getSearchConsoleConnections(userId: string): Promise<SearchConsoleConnection[]> {
  return db
    .select()
    .from(searchConsoleConnections)
    .where(and(
      eq(searchConsoleConnections.userId, userId),
      eq(searchConsoleConnections.status, 'active'),
    ))
    .orderBy(desc(searchConsoleConnections.connectedAt))
}

export async function getSearchConsoleSnapshots(userId: string, limit = 20): Promise<SearchConsoleSnapshot[]> {
  return db
    .select()
    .from(searchConsoleSnapshots)
    .where(eq(searchConsoleSnapshots.userId, userId))
    .orderBy(desc(searchConsoleSnapshots.createdAt))
    .limit(limit)
}
