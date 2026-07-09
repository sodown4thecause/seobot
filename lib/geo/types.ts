export type GeoEngine = 'google_ai_overview' | 'chatgpt' | 'perplexity' | 'gemini' | 'claude'

export interface GeoEngineResult {
  engine: GeoEngine
  prompt: string
  responseText: string
  citedUrls: string[]
  citedDomains: string[]
  rawJson?: unknown
  capturedAt: string
  status: 'completed' | 'skipped' | 'not_configured' | 'error' | 'cost_exceeded'
  error?: string
}

export interface GeoEngineAdapterInput {
  prompt: string
  brand: string
  competitors?: string[]
  topic?: string
}

export interface GeoEngineAdapter {
  runPrompt(input: GeoEngineAdapterInput, userId?: string): Promise<GeoEngineResult>
}

export interface GeoVisibilityAnalysis {
  brandMentioned: boolean
  mentionedBrands: string[]
  competitorMentions: Record<string, number>
  citedDomains: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'absent'
  brandPosition: number | null
  visibilityScore: number
  rationale: string
  recommendedContentActions: string[]
  analysisMethod: 'llm' | 'heuristic'
}
