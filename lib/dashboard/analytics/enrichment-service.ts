import { searchWithPerplexity } from '@/lib/external-apis/perplexity'
import { getFirecrawlTools } from '@/lib/mcp/firecrawl-client'
import { getJinaTools } from '@/lib/mcp/jina-client'
import type { EnrichmentEvidence, EnrichmentResult } from '@/lib/dashboard/analytics/enrichment-types'

type EnrichmentInput = {
  domain: string
  query: string
}

function settle(provider: EnrichmentEvidence['provider'], status: 'ready' | 'partial' | 'failed', summary: string): EnrichmentEvidence {
  return { provider, status, summary }
}

export async function runEnrichment(input: EnrichmentInput): Promise<EnrichmentResult> {
  const [firecrawlResult, jinaResult, perplexityResult] = await Promise.allSettled([
    getFirecrawlTools(),
    getJinaTools(),
    searchWithPerplexity({
      query: `${input.query} site:${input.domain}`,
      model: 'sonar-pro',
      returnCitations: true,
    }),
  ])

  const evidence: EnrichmentEvidence[] = []

  if (firecrawlResult.status === 'fulfilled') {
    const toolCount = Object.keys(firecrawlResult.value).length
    evidence.push(settle('firecrawl', 'ready', `Firecrawl MCP connected (${toolCount} tools available)`))
  } else {
    evidence.push(settle('firecrawl', 'failed', 'Firecrawl MCP unavailable'))
  }

  if (jinaResult.status === 'fulfilled') {
    const toolCount = Object.keys(jinaResult.value).length
    evidence.push(settle('jina', 'ready', `Jina MCP connected (${toolCount} tools available)`))
  } else {
    evidence.push(settle('jina', 'failed', 'Jina MCP unavailable'))
  }

  if (perplexityResult.status === 'fulfilled' && perplexityResult.value.success) {
    evidence.push(
      settle('perplexity', 'ready', `Perplexity returned ${perplexityResult.value.citations.length} citations`)
    )
  } else if (perplexityResult.status === 'fulfilled') {
    evidence.push(settle('perplexity', 'partial', 'Perplexity enrichment unavailable or no citations'))
  } else {
    evidence.push(settle('perplexity', 'failed', 'Perplexity enrichment request failed'))
  }

  return {
    partial: evidence.some((item) => item.status !== 'ready'),
    evidence,
  }
}
