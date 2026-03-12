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

export type AuditVisibilityState = 'unlisted' | 'public' | 'private'

export interface TopicalMapNode {
  topic: string
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
  youCoverage: number
  competitorCoverage: number
  aiMentions: number
  citations: number
  evidenceDepth: number
  freshness: {
    lastIndexedAt: string
  }
  sourceUrls: string[]
  confidence: number
}

export interface TopicalMapScores {
  topicalAuthority: number
  aeoCitation: number
  proofGap: number
  shareShock: number
}

export interface TopicalMapProviderStatus {
  dataforseo: 'ok' | 'partial' | 'failed'
  firecrawl: 'ok' | 'partial' | 'failed'
  aiDiagnostics: 'ok' | 'partial' | 'failed'
}

export type AuditMomentumCategoryKey =
  | 'early-signal'
  | 'untapped-upside'
  | 'emerging-presence'
  | 'category-builder'
  | 'reference-brand'

export interface AuditMomentumCategory {
  key: AuditMomentumCategoryKey
  label: string
  summary: string
}

export interface AuditBenchmarkBand {
  label: string
  summary: string
}

export interface AuditStrength {
  title: string
  detail: string
}

export type AuditInsightEffort = 'Low' | 'Medium' | 'High'
export type AuditInsightTimeframe = '7 days' | '30 days' | '90 days'

export interface AuditOpportunity {
  id: string
  title: string
  detail: string
  action: string
  effort: AuditInsightEffort
  timeframe: AuditInsightTimeframe
  expectedLift: string
}

export type AuditShareFormat = 'linkedin' | 'x' | 'story' | 'pdf' | 'team'

export interface AuditShareModule {
  key: string
  format: AuditShareFormat
  title: string
  subtitle: string
  summary: string
  shareText: string
  ctaLabel: string
}

export interface AuditTeamSummary {
  headline: string
  summary: string
  bullets: string[]
}

export interface AuditScorecard {
  overallScore: number
  visibilityScore: number
  aeoReadinessScore: number
  topicalAuthorityScore: number
  unlockPotentialScore: number
  momentumCategory: AuditMomentumCategory
  benchmarkBand: AuditBenchmarkBand
  strengths: AuditStrength[]
  opportunities: AuditOpportunity[]
  fastestWin: AuditOpportunity
  biggestOpportunity: AuditOpportunity
  actionPlan: {
    next7Days: string[]
    next30Days: string[]
    next90Days: string[]
  }
  shareModules: AuditShareModule[]
  teamSummary: AuditTeamSummary
}

export interface TopicalMapResultPayload {
  auditVersion: string
  publicVisibility: AuditVisibilityState
  topicalMap: {
    nodes: TopicalMapNode[]
    scores: TopicalMapScores
  }
  priorityActions: string[]
  shareArtifacts: {
    verdictCard: {
      title: string
      summary: string
    }
    topicalMapCard: {
      topGaps: string[]
    }
    channels: {
      x: string
      reddit: string
    }
  }
  runMetadata: {
    generatedAt: string
    confidence: number
    partialData: boolean
    providerStatus: TopicalMapProviderStatus
  }
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
  scorecard?: AuditScorecard
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
  email?: string
}

export type AuditRequestPayload = AuditRunPayload | AuditDetectPayload

export type AuditConversionEvent = 'strategy-call' | 'full-audit'

export interface AuditConvertPayload {
  auditId: string
  event: AuditConversionEvent
}

export interface AuditResponsePayload {
  ok: boolean
  stage: 'detected' | 'completed'
  detected?: BrandDetectionPayload
  detectionMeta?: DetectionMeta
  results?: AuditResults
  platformResults?: PlatformResult[]
  executionMeta?: AuditExecutionMeta
  auditId?: string
  completedAt?: string
  citationUrls?: string[]
  totalChecks?: 5
  topicalMapPayload?: TopicalMapResultPayload
  publicVisibility?: AuditVisibilityState
  message?: string
}
