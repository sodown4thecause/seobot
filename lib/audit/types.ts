export interface BrandDetectionPayload {
  brand: string
  category: string
  icp: string
  competitors: string[]
  vertical: string
}

export interface DetectionMeta {
  source: 'scraped' | 'fallback'
  fallbackReason?: string
}

export interface AuditExecutionMeta {
  fallbackApplied: boolean
  citationAvailability: 'full' | 'degraded'
  message?: string
  fallbackDetails?: string[]
}

export interface PlatformResult {
  platform: 'perplexity' | 'grok' | 'gemini'
  prompt: string
  brandMentioned: boolean
  brandPosition: number | null
  brandContext: string | null
  competitorsMentioned: string[]
  citationUrls: string[]
  userDomainCited: boolean
  competitorDomainsCited: string[]
  rawResponse: string
}

export interface AuditResults {
  brand: string
  brandFoundCount: number
  totalChecks: 5
  visibilityRate: number
  topCompetitor: string
  topCompetitorFoundCount: number
  competitorAdvantage: string
  citationUrls: string[]
  userDomainCited: boolean
  competitorDomainsCited: Array<{ domain: string; count: number }>
  platformResults: {
    perplexity: Array<{ mentioned: boolean; position: number | null }>
    grok: { mentioned: boolean; position: number | null }
    gemini: { mentioned: boolean; position: number | null }
  }
}

export interface AuditRunPayload {
  action: 'run'
  domain: string
  email: string
  confirmedContext: BrandDetectionPayload
  mockSafe?: boolean
  simulatePerplexityFailure?: boolean
  simulateGrokFailure?: boolean
}

export interface AuditDetectPayload {
  action: 'detect'
  domain: string
  email: string
}

export type AuditRequestPayload = AuditRunPayload | AuditDetectPayload

export interface AuditResponsePayload {
  ok: boolean
  stage: 'detected' | 'completed'
  detected?: BrandDetectionPayload
  detectionMeta?: DetectionMeta
  results?: AuditResults
  platformResults?: PlatformResult[]
  executionMeta?: AuditExecutionMeta
  citationUrls?: string[]
  totalChecks?: 5
  message?: string
}
