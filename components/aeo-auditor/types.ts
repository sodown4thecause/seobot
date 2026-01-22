export interface CompetitorData {
  domain: string
  name?: string
  organicTraffic?: number
  organicKeywords?: number
  backlinks?: number
  hasSchema?: boolean
  schemaTypes?: string[]
}

export interface PerceptionData {
  llmMentionsCount?: number
  llmMentionsByPlatform?: {
    google: number
    chatGpt: number
    perplexity: number
  }
  perplexitySummary?: string
  perplexitySources?: string[]
  competitors?: CompetitorData[]
  domainMetrics?: {
    organicTraffic?: number
    organicKeywords?: number
    backlinks?: number
    referringDomains?: number
    domainRank?: number
  }
  apiCosts?: {
    dataForSEO: number
    perplexity: number
    firecrawl: number
    total: number
  }
}

export interface AuditReport {
  scoreCard: {
    aeoScore: number
    verdict: string
    grade: string
    breakdown: {
      entityRecognition: number
      accuracyScore: number
      citationStrength: number
      technicalReadiness: number
    }
  }
  hallucinations: {
    positive: Array<{ claim: string; reality: string }>
    negative: Array<{ claim: string; reality: string }>
    isHallucinating: boolean
    riskLevel: string
  }
  knowledgeGraphStatus: {
    exists: boolean
    message: string
    entityType: string
    attributes: string[]
  }
  actionPlan: Array<{
    priority: string
    category: string
    task: string
    fix: string
    impact: string
    effort: string
    productFeature?: string
  }>
  summary: string
  competitorComparison: string
  perception?: PerceptionData
}

export interface AuditResponse {
  success: boolean
  cached: boolean
  auditId: string
  report: AuditReport
  processingTimeMs: number
  toolsUsed?: string[]
  apiCost?: number
}

