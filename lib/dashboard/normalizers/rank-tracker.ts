import type {
  NormalizedRankKeyword,
  NormalizedRankTrackerPayload,
  ProviderStatus,
  RankTrackerProviderName,
  RankTrackerProviderStatuses,
} from '@/lib/dashboard/rank-tracker/types'

const PROVIDERS: RankTrackerProviderName[] = ['dataforseo', 'googleSearchConsole']

const DEFAULT_PROVIDER_STATUSES: RankTrackerProviderStatuses = {
  dataforseo: 'failed',
  googleSearchConsole: 'failed',
}

const KEYWORD_SORT_COLLATOR = new Intl.Collator('en', {
  usage: 'sort',
  sensitivity: 'variant',
  numeric: true,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function toProviderStatus(value: unknown): ProviderStatus | null {
  if (value === 'ok' || value === 'partial' || value === 'failed') {
    return value
  }

  return null
}

function sanitizePosition(value: number | null): number {
  if (value === null || value <= 0) {
    return 0
  }

  return Math.trunc(value)
}

function compareKeywordsDeterministically(a: string, b: string): number {
  const localeStable = KEYWORD_SORT_COLLATOR.compare(a, b)
  if (localeStable !== 0) {
    return localeStable
  }

  if (a === b) {
    return 0
  }

  return a < b ? -1 : 1
}

function deriveOverallStatus(statuses: RankTrackerProviderStatuses): ProviderStatus {
  const values = Object.values(statuses)

  if (values.every((status) => status === 'ok')) {
    return 'ok'
  }

  if (values.every((status) => status === 'failed')) {
    return 'failed'
  }

  return 'partial'
}

function normalizeProviderStatus(providerPayload: unknown): ProviderStatus {
  if (!isRecord(providerPayload)) {
    return 'failed'
  }

  const explicitStatus = toProviderStatus(providerPayload.status)
  if (explicitStatus) {
    return explicitStatus
  }

  if (typeof providerPayload.error === 'string' && providerPayload.error.trim().length > 0) {
    return 'failed'
  }

  if (Array.isArray(providerPayload.keywords)) {
    return 'ok'
  }

  return 'partial'
}

function normalizeKeyword(row: unknown): NormalizedRankKeyword | null {
  if (!isRecord(row)) {
    return null
  }

  const keyword = typeof row.keyword === 'string' ? row.keyword.trim() : ''
  if (!keyword) {
    return null
  }

  const currentPosition = sanitizePosition(toNumber(row.currentPosition) ?? toNumber(row.current_position))
  const previousPosition = sanitizePosition(toNumber(row.previousPosition) ?? toNumber(row.previous_position))
  const explicitChange = toNumber(row.change)

  const change = explicitChange ?? (previousPosition > 0 && currentPosition > 0 ? previousPosition - currentPosition : 0)

  return {
    keyword,
    currentPosition,
    previousPosition,
    change,
  }
}

function sortKeywords(keywords: NormalizedRankKeyword[]): NormalizedRankKeyword[] {
  return keywords.slice().sort((a, b) => compareKeywordsDeterministically(a.keyword, b.keyword))
}

export function normalizeRankTrackerPayload(input: unknown): NormalizedRankTrackerPayload {
  const payload = isRecord(input) ? input : {}
  const providersPayload = isRecord(payload.providers) ? payload.providers : {}

  const providerStatuses: RankTrackerProviderStatuses = { ...DEFAULT_PROVIDER_STATUSES }

  for (const provider of PROVIDERS) {
    providerStatuses[provider] = normalizeProviderStatus(providersPayload[provider])
  }

  const rawKeywords = Array.isArray(payload.keywords)
    ? payload.keywords
    : PROVIDERS.flatMap((provider) => {
        const providerPayload = providersPayload[provider]
        if (!isRecord(providerPayload) || !Array.isArray(providerPayload.keywords)) {
          return []
        }

        return providerPayload.keywords
      })

  const keywords = sortKeywords(
    rawKeywords
      .map((row) => normalizeKeyword(row))
      .filter((row): row is NormalizedRankKeyword => row !== null)
  )

  const winners = keywords.filter((keyword) => keyword.change > 0)
  const losers = keywords.filter((keyword) => keyword.change < 0)
  const unchanged = keywords.filter((keyword) => keyword.change === 0)

  const trackedKeywords = keywords.length
  const averagePosition =
    trackedKeywords === 0
      ? 0
      : Number((keywords.reduce((total, keyword) => total + keyword.currentPosition, 0) / trackedKeywords).toFixed(2))

  const topTenCount = keywords.filter((keyword) => keyword.currentPosition > 0 && keyword.currentPosition <= 10).length
  const visibility = trackedKeywords === 0 ? 0 : Number(((topTenCount / trackedKeywords) * 100).toFixed(2))

  return {
    summary: {
      trackedKeywords,
      averagePosition,
      visibility,
    },
    movements: {
      winners: { count: winners.length, keywords: winners },
      losers: { count: losers.length, keywords: losers },
      unchanged: { count: unchanged.length, keywords: unchanged },
    },
    keywords,
    providerStatus: {
      overall: deriveOverallStatus(providerStatuses),
      providers: providerStatuses,
    },
  }
}
