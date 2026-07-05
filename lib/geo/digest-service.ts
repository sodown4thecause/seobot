import 'server-only'

import {
  dailyDigestDocumentSchema,
  geoHealthResponseSchema,
  geoSuggestionsSchema,
  type DailyDigestDocument,
  type GeoHealthResponse,
  type GeoSuggestions,
} from '@/lib/geo/digest-types'
import { getGeoDigestByDate, getLatestGeoDigest, listGeoDigestTrends } from '@/lib/geo/digest-store'
import {
  fetchDigestFromApiByDate,
  fetchGeoHealthFromApi,
  fetchGeoTrendsFromApi,
  fetchLatestDigestFromApi,
  fetchSuggestionsFromApi,
  isGeoApiConfigured,
} from '@/lib/geo/geo-api-client'

export interface GeoDigestResponse {
  source: 'neon' | 'geo-api'
  digestDate: string
  brand: string
  digest: DailyDigestDocument
  suggestions: GeoSuggestions | null
  degradedSections: string[]
  syncedAt?: string
}

export async function resolveLatestGeoDigest(): Promise<GeoDigestResponse | null> {
  if (isGeoApiConfigured()) {
    const remote = await fetchLatestDigestFromApi()
    if (remote) {
      const suggestions = await fetchSuggestionsFromApi(remote.digestDate)
      return {
        source: 'geo-api',
        digestDate: remote.digestDate,
        brand: remote.brand,
        digest: remote.digest,
        suggestions: suggestions ?? remote.suggestions,
        degradedSections: remote.degradedSections,
      }
    }
  }

  const stored = await getLatestGeoDigest()
  if (!stored) return null

  return {
    source: 'neon',
    digestDate: stored.digestDate,
    brand: stored.brand,
    digest: stored.digest,
    suggestions: stored.suggestions,
    degradedSections: stored.degradedSections,
    syncedAt: stored.syncedAt.toISOString(),
  }
}

export async function resolveGeoDigestByDate(date: string): Promise<GeoDigestResponse | null> {
  if (isGeoApiConfigured()) {
    const digest = await fetchDigestFromApiByDate(date)
    if (digest) {
      const suggestions = await fetchSuggestionsFromApi(date)
      return {
        source: 'geo-api',
        digestDate: date,
        brand: digest.brand,
        digest,
        suggestions,
        degradedSections: digest.degradedSections,
      }
    }
  }

  const stored = await getGeoDigestByDate(date)
  if (!stored) return null

  return {
    source: 'neon',
    digestDate: stored.digestDate,
    brand: stored.brand,
    digest: stored.digest,
    suggestions: stored.suggestions,
    degradedSections: stored.degradedSections,
    syncedAt: stored.syncedAt.toISOString(),
  }
}

export async function resolveGeoDigestTrends(days: number): Promise<GeoDigestResponse[]> {
  if (isGeoApiConfigured()) {
    const digests = await fetchGeoTrendsFromApi(days)
    return digests.map(digest => ({
      source: 'geo-api' as const,
      digestDate: digest.date,
      brand: digest.brand,
      digest,
      suggestions: null,
      degradedSections: digest.degradedSections,
    }))
  }

  const stored = await listGeoDigestTrends(days)
  return stored.map(row => ({
    source: 'neon' as const,
    digestDate: row.digestDate,
    brand: row.brand,
    digest: row.digest,
    suggestions: row.suggestions,
    degradedSections: row.degradedSections,
    syncedAt: row.syncedAt.toISOString(),
  }))
}

export async function resolveGeoHealth(): Promise<GeoHealthResponse> {
  if (isGeoApiConfigured()) {
    const remote = await fetchGeoHealthFromApi()
    if (remote) return remote
  }

  const latest = await getLatestGeoDigest()
  return {
    ok: Boolean(latest),
    jobs: latest
      ? [{
          jobName: 'neon-sync',
          status: 'completed',
          startedAt: latest.syncedAt.toISOString(),
          finishedAt: latest.syncedAt.toISOString(),
          metadata: { digestDate: latest.digestDate },
        }]
      : [],
  }
}
