import type { NormalizedRankTrackerPayload } from '@/lib/dashboard/rank-tracker/types'
import type { DashboardDataType, DashboardSnapshotRecord } from '@/lib/dashboard/repository'
import type { NormalizedWebsiteAuditPayload } from '@/lib/dashboard/website-audit/types'
import type { WorkspaceSnapshot } from '@/lib/dashboard/analytics/contracts'

type RunResponse<TSnapshot> = {
  jobId: string
  dataType: DashboardDataType
  status: 'completed'
  websiteUrl: string
  createdAt: string
  snapshot: TSnapshot
}

type JobResponse<TSnapshot> = RunResponse<TSnapshot> & {
  lastUpdated: string
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  return fallback
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  })

  const payload = (await response.json().catch(() => null)) as { error?: unknown; message?: unknown } | null
  if (!response.ok) {
    // Prefer message (human-readable) over error (machine code) for user display
    const errorText = payload?.message ?? payload?.error
    throw new Error(toErrorMessage(errorText, `Request failed with status ${response.status}`))
  }

  return payload as T
}

export interface RunWebsiteAuditInput {
  domain: string
  maxUrls?: number
  firecrawlLimit?: number
  includeJinaScreenshot?: boolean
}

export interface RunRankTrackerInput {
  domain: string
  competitors?: string[]
  keywordLimit?: number
  locationName?: string
  languageCode?: string
  serpDepth?: number
  firecrawlLimit?: number
  historicalKeywordLimit?: number
}

export async function runWebsiteAudit(input: RunWebsiteAuditInput): Promise<RunResponse<NormalizedWebsiteAuditPayload>> {
  return requestJson('/api/dashboard/website-audit/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function getWebsiteAuditJob(jobId: string): Promise<JobResponse<NormalizedWebsiteAuditPayload>> {
  return requestJson(`/api/dashboard/website-audit/${jobId}`)
}

export async function runRankTracker(input: RunRankTrackerInput): Promise<RunResponse<NormalizedRankTrackerPayload>> {
  return requestJson('/api/dashboard/rank-tracker/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function getRankTrackerJob(jobId: string): Promise<JobResponse<NormalizedRankTrackerPayload>> {
  return requestJson(`/api/dashboard/rank-tracker/${jobId}`)
}

export interface RankTrackerHistoryInput {
  websiteUrl?: string
  limit?: number
}

export interface RankTrackerHistoryResponse {
  dataType: 'ranks'
  count: number
  items: DashboardSnapshotRecord[]
}

export async function getRankTrackerHistory(input?: RankTrackerHistoryInput): Promise<RankTrackerHistoryResponse> {
  const params = new URLSearchParams()
  if (input?.websiteUrl) {
    params.set('websiteUrl', input.websiteUrl)
  }
  if (typeof input?.limit === 'number') {
    params.set('limit', String(input.limit))
  }

  const query = params.toString()
  const url = query.length > 0 ? `/api/dashboard/rank-tracker/history?${query}` : '/api/dashboard/rank-tracker/history'

  return requestJson(url)
}

// ── AEO Insights ────────────────────────────────────────────────────────────

export interface AeoSnapshotInput {
  keywords: string[]
  domain?: string
  location?: string
}

export interface AeoSnapshotResponse {
  success: boolean
  data: WorkspaceSnapshot
}

export async function getAeoInsightsSnapshot(input: AeoSnapshotInput): Promise<AeoSnapshotResponse> {
  const params = new URLSearchParams()
  for (const kw of input.keywords) {
    params.append('keyword', kw)
  }
  if (input.domain) params.set('domain', input.domain)
  if (input.location) params.set('location', input.location)
  return requestJson(`/api/dashboard/aeo/snapshot?${params.toString()}`)
}

export interface AeoRefreshInput {
  domain?: string
  promptCluster?: string
  location?: string
}

export interface AeoRefreshResponse {
  success: boolean
  refreshed: boolean
  data: WorkspaceSnapshot
}

export async function refreshAeoInsights(input: AeoRefreshInput): Promise<AeoRefreshResponse> {
  return requestJson('/api/dashboard/aeo/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

// ── Content Performance ──────────────────────────────────────────────────────

export interface ContentPerformanceSnapshotInput {
  domain: string
  locationName?: string
  languageCode?: string
}

export interface ContentPerformanceSnapshotResponse {
  success: boolean
  data: WorkspaceSnapshot
}

export async function getContentPerformanceSnapshot(
  input: ContentPerformanceSnapshotInput
): Promise<ContentPerformanceSnapshotResponse> {
  const params = new URLSearchParams({ domain: input.domain })
  if (input.locationName) params.set('locationName', input.locationName)
  if (input.languageCode) params.set('languageCode', input.languageCode)
  return requestJson(`/api/dashboard/content-performance/snapshot?${params.toString()}`)
}

export interface ContentPerformanceRefreshInput {
  domain: string
  locationName?: string
  languageCode?: string
}

export interface ContentPerformanceRefreshResponse {
  success: boolean
  refreshed: boolean
  data: WorkspaceSnapshot
}

export async function refreshContentPerformance(
  input: ContentPerformanceRefreshInput
): Promise<ContentPerformanceRefreshResponse> {
  return requestJson('/api/dashboard/content-performance/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
