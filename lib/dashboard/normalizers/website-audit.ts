import type {
  NormalizedWebsiteAuditPayload,
  ProviderStatus,
  WebsiteAuditIssue,
  WebsiteAuditIssueSeverity,
  WebsiteAuditProviderName,
  WebsiteAuditProviderStatuses,
} from '@/lib/dashboard/website-audit/types'

const PROVIDERS: WebsiteAuditProviderName[] = ['dataforseo', 'firecrawl', 'lighthouse']

const DEFAULT_PROVIDER_STATUSES: WebsiteAuditProviderStatuses = {
  dataforseo: 'failed',
  firecrawl: 'failed',
  lighthouse: 'failed',
}

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

function toIssueSeverity(value: unknown): WebsiteAuditIssueSeverity {
  if (value === 'critical' || value === 'warning' || value === 'info') {
    return value
  }

  return 'warning'
}

function deriveOverallStatus(statuses: WebsiteAuditProviderStatuses): ProviderStatus {
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

  const hasScore = toNumber(providerPayload.score) !== null
  const hasIssues = Array.isArray(providerPayload.issues)

  if (hasScore || hasIssues) {
    return 'ok'
  }

  return 'partial'
}

function normalizeIssues(providerName: WebsiteAuditProviderName, payload: unknown): WebsiteAuditIssue[] {
  if (!isRecord(payload) || !Array.isArray(payload.issues)) {
    return []
  }

  return payload.issues
    .filter(isRecord)
    .map((issue) => {
      const title = typeof issue.title === 'string' ? issue.title.trim() : ''
      if (!title) {
        return null
      }

      return {
        title,
        severity: toIssueSeverity(issue.severity),
        sourceProvider: providerName,
      } satisfies WebsiteAuditIssue
    })
    .filter((issue): issue is WebsiteAuditIssue => issue !== null)
}

export function normalizeWebsiteAuditPayload(input: unknown): NormalizedWebsiteAuditPayload {
  const payload = isRecord(input) ? input : {}
  const providersPayload = isRecord(payload.providers) ? payload.providers : {}

  const providerStatuses: WebsiteAuditProviderStatuses = { ...DEFAULT_PROVIDER_STATUSES }
  const allIssues: WebsiteAuditIssue[] = []
  const scores: number[] = []

  for (const provider of PROVIDERS) {
    const providerPayload = providersPayload[provider]

    providerStatuses[provider] = normalizeProviderStatus(providerPayload)
    allIssues.push(...normalizeIssues(provider, providerPayload))

    if (isRecord(providerPayload)) {
      const score = toNumber(providerPayload.score)
      if (score !== null) {
        scores.push(Math.max(0, Math.min(100, score)))
      }
    }
  }

  const issueCounts = {
    critical: allIssues.filter((issue) => issue.severity === 'critical').length,
    warning: allIssues.filter((issue) => issue.severity === 'warning').length,
    info: allIssues.filter((issue) => issue.severity === 'info').length,
  }

  const healthScore =
    scores.length > 0
      ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
      : 0

  return {
    summary: {
      healthScore,
      totalIssues: allIssues.length,
      issuesBySeverity: issueCounts,
    },
    issues: allIssues,
    providerStatus: {
      overall: deriveOverallStatus(providerStatuses),
      providers: providerStatuses,
    },
  }
}
