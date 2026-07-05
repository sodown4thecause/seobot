import 'server-only'

import {
  dailyDigestDocumentSchema,
  geoHealthResponseSchema,
  geoSuggestionsSchema,
  type DailyDigestDocument,
  type GeoHealthResponse,
  type GeoSuggestions,
} from '@/lib/geo/digest-types'
import { serverEnv } from '@/lib/config/env'
import { z } from 'zod'

const latestDigestResponseSchema = z.object({
  digestDate: z.string(),
  brand: z.string(),
  digest: dailyDigestDocumentSchema,
  suggestions: geoSuggestionsSchema.nullable().optional(),
  degradedSections: z.array(z.string()),
})

export function isGeoApiConfigured(): boolean {
  return Boolean(serverEnv.GEO_API_URL)
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (serverEnv.GEO_API_KEY) {
    headers['CF-Access-Client-Id'] = serverEnv.GEO_API_CLIENT_ID ?? ''
    headers['CF-Access-Client-Secret'] = serverEnv.GEO_API_KEY
  }

  return headers
}

async function fetchGeoApi<T>(path: string, schema: { parse: (value: unknown) => T }): Promise<T | null> {
  if (!serverEnv.GEO_API_URL) return null

  const baseUrl = serverEnv.GEO_API_URL.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}${path}`, {
    headers: buildHeaders(),
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    throw new Error(`GEO read API ${path} failed (${response.status})`)
  }

  return schema.parse(await response.json())
}

export async function fetchLatestDigestFromApi(): Promise<{
  digestDate: string
  brand: string
  digest: DailyDigestDocument
  suggestions: GeoSuggestions | null
  degradedSections: string[]
} | null> {
  const payload = await fetchGeoApi('/digest/latest', latestDigestResponseSchema)
  if (!payload) return null

  return {
    digestDate: payload.digestDate,
    brand: payload.brand,
    digest: payload.digest,
    suggestions: payload.suggestions ?? null,
    degradedSections: payload.degradedSections,
  }
}

export async function fetchDigestFromApiByDate(date: string): Promise<DailyDigestDocument | null> {
  return fetchGeoApi(`/digest/${encodeURIComponent(date)}`, dailyDigestDocumentSchema)
}

export async function fetchGeoTrendsFromApi(days: number): Promise<DailyDigestDocument[]> {
  if (!serverEnv.GEO_API_URL) return []

  const baseUrl = serverEnv.GEO_API_URL.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/trends?days=${days}`, {
    headers: buildHeaders(),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`GEO read API /trends failed (${response.status})`)
  }

  const payload = await response.json() as { digests?: unknown[] }
  return (payload.digests ?? []).map(item => dailyDigestDocumentSchema.parse(item))
}

export async function fetchGeoHealthFromApi(): Promise<GeoHealthResponse | null> {
  return fetchGeoApi('/health', geoHealthResponseSchema)
}

export async function fetchSuggestionsFromApi(date: string): Promise<GeoSuggestions | null> {
  if (!serverEnv.GEO_API_URL) return null

  const baseUrl = serverEnv.GEO_API_URL.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/digest/${encodeURIComponent(date)}/suggestions`, {
    headers: buildHeaders(),
    signal: AbortSignal.timeout(15_000),
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GEO read API suggestions failed (${response.status})`)
  }

  return geoSuggestionsSchema.parse(await response.json())
}
