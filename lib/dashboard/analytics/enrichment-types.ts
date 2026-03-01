export type EnrichmentProvider = 'firecrawl' | 'jina' | 'perplexity'

export type EnrichmentEvidence = {
  provider: EnrichmentProvider
  summary: string
  status: 'ready' | 'partial' | 'failed'
}

export type EnrichmentResult = {
  partial: boolean
  evidence: EnrichmentEvidence[]
}
