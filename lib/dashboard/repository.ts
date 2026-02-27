import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { dashboardData, type Json } from '@/lib/db/schema'

export type DashboardDataType = 'audit' | 'ranks'

type StoredSnapshotEnvelope = {
  jobId: string
  status: 'completed'
  snapshot: unknown
  createdAt: string
}

export interface DashboardSnapshotRecord {
  id: string
  jobId: string
  status: 'completed'
  userId: string
  websiteUrl: string
  dataType: DashboardDataType
  snapshot: unknown
  createdAt: string
  lastUpdated: string
}

export interface SaveDashboardSnapshotInput {
  userId: string
  websiteUrl: string
  dataType: DashboardDataType
  jobId: string
  snapshot: unknown
}

export interface ListDashboardHistoryInput {
  userId: string
  dataType: DashboardDataType
  websiteUrl?: string
  limit?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toIsoString(value: Date): string {
  return value.toISOString()
}

function buildStoredSnapshotEnvelope(input: {
  jobId: string
  status: 'completed'
  snapshot: unknown
  createdAt: string
}): Json {
  return JSON.parse(JSON.stringify(input)) as Json
}

function parseStoredSnapshotEnvelope(value: Json | null): StoredSnapshotEnvelope | null {
  if (!isRecord(value)) {
    return null
  }

  if (typeof value.jobId !== 'string' || value.status !== 'completed' || typeof value.createdAt !== 'string') {
    return null
  }

  return {
    jobId: value.jobId,
    status: 'completed',
    snapshot: value.snapshot,
    createdAt: value.createdAt,
  }
}

function toSnapshotRecord(
  row: typeof dashboardData.$inferSelect,
  envelope: StoredSnapshotEnvelope
): DashboardSnapshotRecord {
  return {
    id: row.id,
    jobId: envelope.jobId,
    status: envelope.status,
    userId: row.userId,
    websiteUrl: row.websiteUrl,
    dataType: row.dataType as DashboardDataType,
    snapshot: envelope.snapshot,
    createdAt: envelope.createdAt,
    lastUpdated: toIsoString(row.lastUpdated),
  }
}

export async function saveDashboardSnapshot(input: SaveDashboardSnapshotInput): Promise<DashboardSnapshotRecord> {
  const websiteUrl = input.websiteUrl.trim()
  const now = new Date()
  const createdAt = now.toISOString()

  const [inserted] = await db
    .insert(dashboardData)
    .values({
      userId: input.userId,
      websiteUrl,
      dataType: input.dataType,
      data: buildStoredSnapshotEnvelope({
        jobId: input.jobId,
        status: 'completed',
        snapshot: input.snapshot,
        createdAt,
      }),
      freshness: 'fresh',
      lastUpdated: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!inserted) {
    throw new Error('Failed to persist dashboard snapshot')
  }

  const envelope = parseStoredSnapshotEnvelope(inserted.data)
  if (!envelope) {
    throw new Error('Persisted dashboard snapshot payload is invalid')
  }

  return toSnapshotRecord(inserted, envelope)
}

export async function getDashboardJobById(
  userId: string,
  dataType: DashboardDataType,
  jobId: string
): Promise<DashboardSnapshotRecord | null> {
  const [row] = await db
    .select()
    .from(dashboardData)
    .where(
      and(
        eq(dashboardData.userId, userId),
        eq(dashboardData.dataType, dataType),
        sql`${dashboardData.data} ->> 'jobId' = ${jobId}`
      )
    )
    .orderBy(desc(dashboardData.createdAt))
    .limit(1)

  if (!row) {
    return null
  }

  const envelope = parseStoredSnapshotEnvelope(row.data)
  if (!envelope) {
    return null
  }

  return toSnapshotRecord(row, envelope)
}

export async function listDashboardHistory(input: ListDashboardHistoryInput): Promise<DashboardSnapshotRecord[]> {
  const limit = Math.max(1, Math.min(50, input.limit ?? 10))
  const websiteUrl = input.websiteUrl?.trim()

  const rows = websiteUrl
    ? await db
        .select()
        .from(dashboardData)
        .where(
          and(
            eq(dashboardData.userId, input.userId),
            eq(dashboardData.dataType, input.dataType),
            eq(dashboardData.websiteUrl, websiteUrl)
          )
        )
        .orderBy(desc(dashboardData.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(dashboardData)
        .where(and(eq(dashboardData.userId, input.userId), eq(dashboardData.dataType, input.dataType)))
        .orderBy(desc(dashboardData.createdAt))
        .limit(limit)

  return rows
    .map((row) => {
      const envelope = parseStoredSnapshotEnvelope(row.data)
      if (!envelope) {
        return null
      }

      return toSnapshotRecord(row, envelope)
    })
    .filter((row): row is DashboardSnapshotRecord => row !== null)
}
