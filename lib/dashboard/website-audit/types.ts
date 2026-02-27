export type ProviderStatus = 'ok' | 'partial' | 'failed'

export type WebsiteAuditProviderName = 'dataforseo' | 'firecrawl' | 'lighthouse'

export type WebsiteAuditProviderStatuses = Record<WebsiteAuditProviderName, ProviderStatus>

export interface WebsiteAuditProviderStatusSummary {
  overall: ProviderStatus
  providers: WebsiteAuditProviderStatuses
}

export type WebsiteAuditIssueSeverity = 'critical' | 'warning' | 'info'

export interface WebsiteAuditIssue {
  title: string
  severity: WebsiteAuditIssueSeverity
  sourceProvider: WebsiteAuditProviderName
}

export interface WebsiteAuditSummary {
  healthScore: number
  totalIssues: number
  issuesBySeverity: {
    critical: number
    warning: number
    info: number
  }
}

export interface NormalizedWebsiteAuditPayload {
  summary: WebsiteAuditSummary
  issues: WebsiteAuditIssue[]
  providerStatus: WebsiteAuditProviderStatusSummary
}
