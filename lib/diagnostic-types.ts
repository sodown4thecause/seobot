export type DiagnosticIntent = 'transactional' | 'comparative' | 'informational'

export type DiagnosticModel = 'gemini' | 'perplexity' | 'grok'

export type ParseMethod = 'json' | 'heuristic' | 'failed'

export type AIRecommendationType = 'primary' | 'secondary' | 'listed' | 'mention_only'

export type AIPerceptionCategory =
  | 'Informational Authority'
  | 'Considered Alternative'
  | 'Preferred Solution'
  | 'Low AI Visibility'

export interface EngineBreakdown {
  engine: DiagnosticModel
  mentioned: boolean
  recommended: boolean
  cited: boolean
  bestPosition: number | null
  completedRuns: number
  totalRuns: number
}

export interface DiagnosticRunPublic {
  intent: DiagnosticIntent
  model: DiagnosticModel
  mentioned: boolean
  recommended: boolean
  cited: boolean
  targetBestPosition: number | null
  parseMethod: ParseMethod
  error?: string
}

export interface DiagnosticResultPublic {
  id: string
  createdAt: string
  expiresAt: string
  domain: string
  inputKeywords: string[]
  selectedKeywords: string[]
  brandSummary: string
  topics: string[]
  productDescriptors: string[]
  aiInfluenceScore: number
  recommendationRate: number
  engineCoverage: number
  citationRate: number
  aiPerceptionCategory: AIPerceptionCategory
  aiPerceptionInsight: string
  primaryAICompetitor: string
  engineBreakdown: Record<DiagnosticModel, EngineBreakdown>
  runs: DiagnosticRunPublic[]
  incomplete: boolean
  incompleteReasons: string[]
  shareCardSvgDataUrl: string
  xShareIntentUrl: string
}

export interface DiagnosticRunDebug {
  intent: DiagnosticIntent
  model: DiagnosticModel
  systemPrompt: string
  userPrompt: string
  rawResponse: string
  parseError?: string
}

export interface DiagnosticResultStored extends DiagnosticResultPublic {
  debugRuns: DiagnosticRunDebug[]
}
