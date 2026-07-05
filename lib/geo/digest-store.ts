import 'server-only'

import { desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { geoTrackingDailyDigests } from '@/lib/db/schema'
import {
  dailyDigestDocumentSchema,
  geoSuggestionsSchema,
  type DailyDigestDocument,
  type GeoSuggestions,
} from '@/lib/geo/digest-types'

export interface StoredGeoDigest {
  id: string
  digestDate: string
  brand: string
  digest: DailyDigestDocument
  degradedSections: string[]
  suggestions: GeoSuggestions | null
  syncedAt: Date
}

function rowToStoredDigest(row: typeof geoTrackingDailyDigests.$inferSelect): StoredGeoDigest {
  return {
    id: row.id,
    digestDate: row.digestDate,
    brand: row.brand,
    digest: dailyDigestDocumentSchema.parse(row.digest),
    degradedSections: row.degradedSections ?? [],
    suggestions: row.suggestions ? geoSuggestionsSchema.parse(row.suggestions) : null,
    syncedAt: row.syncedAt,
  }
}

export async function getLatestGeoDigest(): Promise<StoredGeoDigest | null> {
  const [row] = await db
    .select()
    .from(geoTrackingDailyDigests)
    .orderBy(desc(geoTrackingDailyDigests.digestDate))
    .limit(1)

  return row ? rowToStoredDigest(row) : null
}

export async function getGeoDigestByDate(date: string): Promise<StoredGeoDigest | null> {
  const [row] = await db
    .select()
    .from(geoTrackingDailyDigests)
    .where(eq(geoTrackingDailyDigests.digestDate, date))
    .limit(1)

  return row ? rowToStoredDigest(row) : null
}

export async function listGeoDigestTrends(days: number): Promise<StoredGeoDigest[]> {
  const safeDays = Math.min(Math.max(days, 1), 90)
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - safeDays)
  const sinceDate = since.toISOString().slice(0, 10)

  const rows = await db
    .select()
    .from(geoTrackingDailyDigests)
    .where(gte(geoTrackingDailyDigests.digestDate, sinceDate))
    .orderBy(desc(geoTrackingDailyDigests.digestDate))

  return rows.map(rowToStoredDigest)
}

export async function countGeoDigests(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(geoTrackingDailyDigests)

  return result?.count ?? 0
}
