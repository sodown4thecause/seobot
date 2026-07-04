import 'server-only'

import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'

const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

const isoDateSchema = z.union([z.string(), z.date()]).transform(value =>
  value instanceof Date ? value.toISOString() : value,
)

export const elmoBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  domains: z.array(z.string()),
  aliases: z.array(z.string()),
  enabled: z.boolean(),
  onboarded: z.boolean(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const elmoCompetitorSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  domains: z.array(z.string()),
  aliases: z.array(z.string()),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const elmoPromptSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  value: z.string(),
  enabled: z.boolean(),
  tags: z.array(z.string()),
  systemTags: z.array(z.string()),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
})

export const elmoAnalyzeResultSchema = z.object({
  brandName: z.string(),
  website: z.string(),
  additionalDomains: z.array(z.string()),
  aliases: z.array(z.string()),
  competitors: z.array(z.object({
    name: z.string(),
    domains: z.array(z.string()),
    aliases: z.array(z.string()),
  })),
  suggestedPrompts: z.array(z.object({
    prompt: z.string(),
    tags: z.array(z.string()),
  })),
})

export const elmoPromptSnapshotSchema = z.object({
  brandId: z.string(),
  promptId: z.string(),
  promptValue: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  mentions: z.object({
    mentionsTotal: z.number(),
    brandMentionsTotal: z.number(),
    competitorMentionsTotal: z.number(),
    mentionsTopK: z.array(z.object({
      entity: z.string(),
      count: z.number(),
    })),
  }),
  citations: z.object({
    citationsTotal: z.number(),
    brandCitationsTotal: z.number(),
    competitorCitationsTotal: z.number(),
    citedUrlsTopK: z.array(z.object({
      url: z.string(),
      title: z.string().nullable(),
      count: z.number(),
    })),
  }),
})

export const elmoReportStatusSchema = z.enum(['pending', 'running', 'completed', 'failed'])

export const elmoReportCreateResponseSchema = z.object({
  reportId: z.string(),
  status: elmoReportStatusSchema,
  brandName: z.string(),
  brandWebsite: z.string(),
  createdAt: isoDateSchema,
})

export const elmoReportPendingSchema = z.object({
  reportId: z.string(),
  status: z.enum(['pending', 'running', 'failed']),
  progress: z.unknown().optional(),
  brandName: z.string(),
  brandWebsite: z.string(),
  createdAt: isoDateSchema,
  completedAt: isoDateSchema.nullable().optional(),
})

const elmoReportPromptSnapshotSchema = z.object({
  promptValue: z.string(),
  totalRuns: z.number(),
  mentions: z.object({
    mentionsTotal: z.number(),
    brandMentionsTotal: z.number(),
    competitorMentionsTotal: z.number(),
    mentionsTopK: z.array(z.object({
      entity: z.string(),
      count: z.number(),
    })),
  }),
})

export const elmoReportCompletedSchema = z.object({
  reportId: z.string(),
  status: z.literal('completed'),
  brandName: z.string(),
  brandWebsite: z.string(),
  createdAt: isoDateSchema,
  completedAt: isoDateSchema.nullable().optional(),
  prompts: z.array(elmoReportPromptSnapshotSchema),
  unstable: z.unknown().optional(),
})

export type ElmoBrand = z.infer<typeof elmoBrandSchema>
export type ElmoCompetitor = z.infer<typeof elmoCompetitorSchema>
export type ElmoPrompt = z.infer<typeof elmoPromptSchema>
export type ElmoAnalyzeResult = z.infer<typeof elmoAnalyzeResultSchema>
export type ElmoPromptSnapshot = z.infer<typeof elmoPromptSnapshotSchema>
export type ElmoReportCreateResponse = z.infer<typeof elmoReportCreateResponseSchema>
export type ElmoReportPending = z.infer<typeof elmoReportPendingSchema>
export type ElmoReportCompleted = z.infer<typeof elmoReportCompletedSchema>

export class ElmoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string,
    message: string,
  ) {
    super(message)
    this.name = 'ElmoApiError'
  }
}

export function isElmoConfigured(): boolean {
  return Boolean(serverEnv.ELMO_API_URL && serverEnv.ELMO_API_KEY)
}

function getBaseUrl(): string {
  if (!serverEnv.ELMO_API_URL) {
    throw new ElmoApiError(503, 'NotConfigured', 'ELMO_API_URL is not configured')
  }
  return serverEnv.ELMO_API_URL.replace(/\/$/, '')
}

function buildHeaders(): HeadersInit {
  if (!serverEnv.ELMO_API_KEY) {
    throw new ElmoApiError(503, 'NotConfigured', 'ELMO_API_KEY is not configured')
  }

  return {
    Authorization: `Bearer ${serverEnv.ELMO_API_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

async function parseErrorBody(response: Response): Promise<{ error?: string; message?: string }> {
  try {
    const body = await response.json() as { error?: string; message?: string }
    return body
  } catch {
    const text = await response.text().catch(() => '')
    return { message: text || response.statusText }
  }
}

export async function elmoFetch<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new ElmoApiError(
      response.status,
      body.error ?? 'RequestFailed',
      body.message ?? `Elmo API request failed (${response.status})`,
    )
  }

  if (response.status === 204) {
    return schema.parse(undefined)
  }

  return schema.parse(await response.json())
}

export interface ElmoListParams {
  page?: number
  limit?: number
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listElmoBrands(params: ElmoListParams = {}): Promise<{
  brands: ElmoBrand[]
  pagination: z.infer<typeof paginationSchema>
}> {
  return elmoFetch(
    `/api/v1/brands${buildQuery({ page: params.page, limit: params.limit })}`,
    z.object({
      brands: z.array(elmoBrandSchema),
      pagination: paginationSchema,
    }),
  )
}

export async function getElmoBrand(brandId: string): Promise<ElmoBrand> {
  return elmoFetch(`/api/v1/brands/${encodeURIComponent(brandId)}`, elmoBrandSchema)
}

export async function createElmoBrand(input: {
  id: string
  name: string
  domains: string[]
  aliases?: string[]
  competitors?: Array<{ name: string; domains?: string[]; aliases?: string[] }>
  prompts?: Array<{ value: string; tags?: string[]; enabled?: boolean }>
}): Promise<ElmoBrand> {
  return elmoFetch('/api/v1/brands', elmoBrandSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateElmoBrand(
  brandId: string,
  input: {
    brandName?: string
    domains?: string[]
    aliases?: string[]
    enabled?: boolean
  },
): Promise<ElmoBrand> {
  return elmoFetch(`/api/v1/brands/${encodeURIComponent(brandId)}`, elmoBrandSchema, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function listElmoCompetitors(params: ElmoListParams & { brandId?: string } = {}): Promise<{
  competitors: ElmoCompetitor[]
  pagination: z.infer<typeof paginationSchema>
}> {
  return elmoFetch(
    `/api/v1/competitors${buildQuery({ brandId: params.brandId, page: params.page, limit: params.limit })}`,
    z.object({
      competitors: z.array(elmoCompetitorSchema),
      pagination: paginationSchema,
    }),
  )
}

export async function getElmoCompetitor(competitorId: string): Promise<ElmoCompetitor> {
  return elmoFetch(`/api/v1/competitors/${encodeURIComponent(competitorId)}`, elmoCompetitorSchema)
}

export async function createElmoCompetitor(input: {
  brandId: string
  name: string
  domains?: string[]
  aliases?: string[]
}): Promise<ElmoCompetitor> {
  return elmoFetch('/api/v1/competitors', elmoCompetitorSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateElmoCompetitor(
  competitorId: string,
  input: { name?: string; domains?: string[]; aliases?: string[] },
): Promise<ElmoCompetitor> {
  return elmoFetch(`/api/v1/competitors/${encodeURIComponent(competitorId)}`, elmoCompetitorSchema, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteElmoCompetitor(competitorId: string): Promise<ElmoCompetitor> {
  return elmoFetch(`/api/v1/competitors/${encodeURIComponent(competitorId)}`, elmoCompetitorSchema, {
    method: 'DELETE',
  })
}

export async function listElmoPrompts(params: ElmoListParams & { brandId?: string } = {}): Promise<{
  prompts: ElmoPrompt[]
  pagination: z.infer<typeof paginationSchema>
}> {
  return elmoFetch(
    `/api/v1/prompts${buildQuery({ brandId: params.brandId, page: params.page, limit: params.limit })}`,
    z.object({
      prompts: z.array(elmoPromptSchema),
      pagination: paginationSchema,
    }),
  )
}

export async function getElmoPrompt(promptId: string): Promise<ElmoPrompt> {
  return elmoFetch(`/api/v1/prompts/${encodeURIComponent(promptId)}`, elmoPromptSchema)
}

export async function createElmoPrompt(input: {
  brandId: string
  value: string
  tags?: string[]
}): Promise<ElmoPrompt> {
  return elmoFetch('/api/v1/prompts', elmoPromptSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateElmoPrompt(
  promptId: string,
  input: { value?: string; enabled?: boolean; tags?: string[] },
): Promise<ElmoPrompt> {
  return elmoFetch(`/api/v1/prompts/${encodeURIComponent(promptId)}`, elmoPromptSchema, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteElmoPrompt(promptId: string): Promise<ElmoPrompt & { deletedRunsCount?: number }> {
  return elmoFetch(
    `/api/v1/prompts/${encodeURIComponent(promptId)}`,
    elmoPromptSchema.extend({ deletedRunsCount: z.number().optional() }),
    { method: 'DELETE' },
  )
}

export async function getElmoPromptSnapshot(
  promptId: string,
  params: { startDate: string; endDate: string; kMentions?: number; kCitations?: number },
): Promise<ElmoPromptSnapshot> {
  return elmoFetch(
    `/api/v1/prompts/${encodeURIComponent(promptId)}/snapshot${buildQuery({
      startDate: params.startDate,
      endDate: params.endDate,
      kMentions: params.kMentions,
      kCitations: params.kCitations,
    })}`,
    elmoPromptSnapshotSchema,
  )
}

export async function analyzeElmoBrand(input: {
  website: string
  brandName?: string
  maxCompetitors?: number
  maxPrompts?: number
}): Promise<ElmoAnalyzeResult> {
  return elmoFetch('/api/v1/tools/analyze', elmoAnalyzeResultSchema, {
    method: 'POST',
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(120_000),
  })
}

export async function createElmoReport(input: {
  brandName: string
  brandWebsite: string
  manualPrompts?: string[]
}): Promise<ElmoReportCreateResponse> {
  return elmoFetch('/api/v1/reports', elmoReportCreateResponseSchema, {
    method: 'POST',
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(30_000),
  })
}

export async function listElmoReports(params: ElmoListParams = {}): Promise<{
  reports: Array<{
    id: string
    brandName: string
    brandWebsite: string
    status: z.infer<typeof elmoReportStatusSchema>
    createdAt: string
    completedAt: string | null
  }>
  pagination: z.infer<typeof paginationSchema>
}> {
  return elmoFetch(
    `/api/v1/reports${buildQuery({ page: params.page, limit: params.limit })}`,
    z.object({
      reports: z.array(z.object({
        id: z.string(),
        brandName: z.string(),
        brandWebsite: z.string(),
        status: elmoReportStatusSchema,
        createdAt: isoDateSchema,
        completedAt: isoDateSchema.nullable(),
      })),
      pagination: paginationSchema,
    }),
  )
}

export async function getElmoReport(
  reportId: string,
  params: { kMentions?: number } = {},
): Promise<ElmoReportPending | ElmoReportCompleted> {
  const payload = await elmoFetch(
    `/api/v1/reports/${encodeURIComponent(reportId)}${buildQuery({ kMentions: params.kMentions })}`,
    z.union([elmoReportPendingSchema, elmoReportCompletedSchema]),
  )
  return payload
}

export async function pollElmoReport(
  reportId: string,
  options: { timeoutMs?: number; intervalMs?: number; kMentions?: number } = {},
): Promise<ElmoReportPending | ElmoReportCompleted> {
  const timeoutMs = options.timeoutMs ?? 120_000
  const intervalMs = options.intervalMs ?? 3_000
  const deadline = Date.now() + timeoutMs
  let latest: ElmoReportPending | ElmoReportCompleted | null = null

  while (Date.now() < deadline) {
    latest = await getElmoReport(reportId, { kMentions: options.kMentions })
    if (latest.status === 'completed' || latest.status === 'failed') {
      return latest
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  if (latest) return latest
  return getElmoReport(reportId, { kMentions: options.kMentions })
}
