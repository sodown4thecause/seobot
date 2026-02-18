import 'server-only'

import { z } from 'zod'

import { serverEnv } from '@/lib/config/env'

interface DataForSEOTaskResponse<T> {
  status_code?: number
  status_message?: string
  tasks_error?: number
  tasks?: Array<{
    status_code?: number
    status_message?: string
    result?: T
  }>
}

const keywordDataSchema = z.object({
  keyword: z.string().optional(),
  keyword_info: z.object({
    search_volume: z.number().optional(),
  }).optional(),
}).passthrough()

const rankedSerpElementSchema = z.object({
  serp_item: z.object({
    rank_group: z.number().optional(),
  }).optional(),
}).passthrough()

const rankedKeywordItemSchema = z.object({
  keyword_data: keywordDataSchema.optional(),
  keyword: z.string().optional(),
  ranked_serp_element: rankedSerpElementSchema.optional(),
}).passthrough()

const rankedKeywordResultSchema = z.object({
  items: z.array(rankedKeywordItemSchema).optional(),
}).passthrough()

const searchVolumeRowSchema = z.object({
  keyword: z.string().optional(),
  search_volume: z.number().optional(),
}).passthrough()

interface RankedKeywordCandidate {
  keyword: string
  rank: number
  volume: number
}

interface SearchVolumeCandidate {
  keyword: string
  volume: number
}

export interface DataForSEOSelectionResult {
  selectedKeywords: string[]
  primaryKeyword: string
  secondaryKeyword: string
  serpCompetitorDomains: string[]
  incomplete: boolean
  errors: string[]
}

const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3'

const DEFAULT_FALLBACK_KEYWORD = 'ai visibility software'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim().replace(/\s+/g, ' ')
}

function dedupeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const keyword of keywords) {
    const normalized = normalizeKeyword(keyword)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(keyword.trim())
  }
  return result
}

function extractRootDomainToken(domain: string): string {
  const host = domain.toLowerCase().replace(/^www\./, '')
  return host.split('.')[0] || host
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function keywordIsBranded(keyword: string, brandTokens: string[]): boolean {
  const normalized = normalizeKeyword(keyword)
  return brandTokens.some((token) => token.length > 2 && normalized.includes(token))
}

function isTooSimilar(candidate: string, existing: string): boolean {
  const a = new Set(tokenize(candidate))
  const b = new Set(tokenize(existing))
  if (a.size === 0 || b.size === 0) return false

  let overlap = 0
  for (const token of a) {
    if (b.has(token)) overlap += 1
  }
  const ratio = overlap / Math.max(a.size, b.size)
  return ratio >= 0.8
}

function pickDiverseTopKeywords(candidates: SearchVolumeCandidate[], maxCount: number): string[] {
  const sorted = [...candidates].sort((a, b) => b.volume - a.volume)
  const chosen: string[] = []

  for (const candidate of sorted) {
    if (chosen.length >= maxCount) break
    if (chosen.some((existing) => isTooSimilar(existing, candidate.keyword))) {
      continue
    }
    chosen.push(candidate.keyword)
  }

  return chosen
}

async function postDataForSEO<T>(args: {
  path: string
  payload: Record<string, unknown>
  timeoutMs: number
  retries: number
}): Promise<DataForSEOTaskResponse<T>> {
  const auth = Buffer.from(
    `${serverEnv.DATAFORSEO_USERNAME}:${serverEnv.DATAFORSEO_PASSWORD}`,
  ).toString('base64')

  let lastError: unknown

  for (let attempt = 1; attempt <= args.retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), args.timeoutMs)

    try {
      const response = await fetch(`${DATAFORSEO_BASE_URL}${args.path}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([args.payload]),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`DataForSEO HTTP ${response.status}: ${text.slice(0, 300)}`)
      }

      return (await response.json()) as DataForSEOTaskResponse<T>
    } catch (error) {
      lastError = error
      if (attempt < args.retries) {
        await sleep(300 * attempt)
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('DataForSEO request failed')
}

function extractRankedKeywordCandidates(raw: DataForSEOTaskResponse<unknown>): RankedKeywordCandidate[] {
  const result = raw.tasks?.[0]?.result
  if (!Array.isArray(result) || result.length === 0) return []

  const parsed = rankedKeywordResultSchema.safeParse(result[0])
  if (!parsed.success) return []

  const items = parsed.data.items
  if (!Array.isArray(items)) return []

  const candidates: RankedKeywordCandidate[] = []
  for (const item of items) {
    const keyword = item.keyword_data?.keyword || item.keyword || ''
    const rank = item.ranked_serp_element?.serp_item?.rank_group || 0
    const volume = item.keyword_data?.keyword_info?.search_volume || 0

    if (!keyword || rank <= 0 || volume <= 0) continue
    candidates.push({ keyword, rank, volume })
  }

  return candidates
}

function extractSearchVolumes(raw: DataForSEOTaskResponse<unknown>): SearchVolumeCandidate[] {
  const result = raw.tasks?.[0]?.result
  if (!Array.isArray(result)) return []

  const candidates: SearchVolumeCandidate[] = []
  for (const row of result) {
    const parsed = searchVolumeRowSchema.safeParse(row)
    if (!parsed.success) continue

    const keyword = String(parsed.data.keyword || '').trim()
    const volume = Number(parsed.data.search_volume || 0)

    if (keyword.length > 0 && Number.isFinite(volume)) {
      candidates.push({ keyword, volume })
    }
  }

  return candidates
}

function extractSerpCompetitorDomains(raw: DataForSEOTaskResponse<unknown>, targetDomain: string): string[] {
  const result = raw.tasks?.[0]?.result
  if (!Array.isArray(result) || result.length === 0) return []

  const items = (result[0] as { items?: unknown[] })?.items
  if (!Array.isArray(items)) return []

  const normalizedTarget = targetDomain.toLowerCase().replace(/^www\./, '')
  const set = new Set<string>()

  for (const item of items as Array<Record<string, unknown>>) {
    const type = String(item.type || '')
    if (type !== 'organic') continue

    const domain = String(item.domain || '').toLowerCase().replace(/^www\./, '')
    if (!domain || domain === normalizedTarget || domain.endsWith(`.${normalizedTarget}`)) {
      continue
    }

    set.add(domain)
    if (set.size >= 10) break
  }

  return Array.from(set)
}

function fallbackKeywords(inputKeywords: string[], topics: string[]): string[] {
  const merged = dedupeKeywords([...inputKeywords, ...topics])
  return merged.slice(0, 5)
}

export async function selectStrongestKeywords(args: {
  domain: string
  brandName: string
  inputKeywords: string[]
  topics: string[]
  minVolume: number
  timeoutMs: number
  retries: number
}): Promise<DataForSEOSelectionResult> {
  const errors: string[] = []

  const brandTokens = dedupeKeywords([
    extractRootDomainToken(args.domain),
    ...tokenize(args.brandName),
  ]).map((token) => token.toLowerCase())

  let rankedCandidates: RankedKeywordCandidate[] = []

  try {
    const rankedResponse = await postDataForSEO<unknown>({
      path: '/dataforseo_labs/google/ranked_keywords/live',
      payload: {
        target: args.domain,
        location_name: 'United States',
        language_code: 'en',
        limit: 300,
      },
      timeoutMs: args.timeoutMs,
      retries: args.retries,
    })

    rankedCandidates = extractRankedKeywordCandidates(rankedResponse)
      .filter((candidate) => candidate.rank <= 20 && candidate.volume >= args.minVolume)
      .sort((a, b) => {
        const scoreA = a.volume * (1 / Math.max(a.rank, 1))
        const scoreB = b.volume * (1 / Math.max(b.rank, 1))
        return scoreB - scoreA
      })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Ranked keyword lookup failed')
  }

  const nonBrandedRanked = rankedCandidates.filter(
    (candidate) => !keywordIsBranded(candidate.keyword, brandTokens),
  )

  const rankedPool = (nonBrandedRanked.length > 0 ? nonBrandedRanked : rankedCandidates).map((candidate) => ({
    keyword: candidate.keyword,
    volume: candidate.volume,
  }))

  let selectedKeywords = pickDiverseTopKeywords(rankedPool, 5)

  if (selectedKeywords.length === 0) {
    const fallbackPool = dedupeKeywords([...args.inputKeywords, ...args.topics]).slice(0, 25)

    if (fallbackPool.length > 0) {
      try {
        const searchVolumeResponse = await postDataForSEO<unknown>({
          path: '/keywords_data/google_ads/search_volume/live',
          payload: {
            keywords: fallbackPool,
            location_code: 2840,
            language_code: 'en',
          },
          timeoutMs: args.timeoutMs,
          retries: args.retries,
        })

        const validatedCandidates = extractSearchVolumes(searchVolumeResponse)
          .filter((candidate) => candidate.volume >= args.minVolume)
          .filter((candidate) => !keywordIsBranded(candidate.keyword, brandTokens))

        selectedKeywords = pickDiverseTopKeywords(validatedCandidates, 5)
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Search volume fallback failed')
      }
    }
  }

  if (selectedKeywords.length === 0) {
    selectedKeywords = fallbackKeywords(args.inputKeywords, args.topics)
  }

if (selectedKeywords.length === 0) {
    selectedKeywords = [DEFAULT_FALLBACK_KEYWORD]
  }

  const primaryKeyword = selectedKeywords[0]
  const secondaryKeyword = selectedKeywords[1] || primaryKeyword

  let serpCompetitorDomains: string[] = []
  if (primaryKeyword) {
    try {
      const serpResponse = await postDataForSEO<unknown>({
        path: '/serp/google/organic/live/advanced',
        payload: {
          keyword: primaryKeyword,
          location_code: 2840,
          language_code: 'en',
          device: 'desktop',
        },
        timeoutMs: args.timeoutMs,
        retries: args.retries,
      })

      serpCompetitorDomains = extractSerpCompetitorDomains(serpResponse, args.domain)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'SERP competitor lookup failed')
    }
  }

  return {
    selectedKeywords,
    primaryKeyword,
    secondaryKeyword,
    serpCompetitorDomains,
    incomplete: errors.length > 0,
    errors,
  }
}
