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
}

export interface AuditResponse {
  success: boolean
  cached: boolean
  auditId: string
  report: AuditReport
  processingTimeMs: number
}

