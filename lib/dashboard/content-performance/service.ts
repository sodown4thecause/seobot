import { analyzeRankedKeywords } from '@/lib/services/dataforseo/ranked-keywords-analysis'
import { normalizeContentPerformanceSnapshot } from '@/lib/dashboard/analytics/normalizers'
import { runEnrichment } from '@/lib/dashboard/analytics/enrichment-service'

type ContentPerformanceRequest = {
  domain: string
  locationName?: string
  languageCode?: string
}

export async function buildContentPerformanceSnapshot(input: ContentPerformanceRequest) {
  const rankedKeywordsResult = await analyzeRankedKeywords({
    target: input.domain,
    location_name: input.locationName,
    language_code: input.languageCode,
    limit: 100,
  })

  if (!rankedKeywordsResult.success) {
    console.warn('[Dashboard][ContentPerformance] Ranked keywords analysis failed', {
      domain: input.domain,
      error: rankedKeywordsResult.error?.message,
      code: rankedKeywordsResult.error?.code,
    })
  }

  const rankedKeywordCount = rankedKeywordsResult.success ? rankedKeywordsResult.data.totalKeywords : 0
  const decayPages = Math.max(0, Math.round(rankedKeywordCount * 0.2))

  void runEnrichment({
    domain: input.domain,
    query: 'content performance keyword decay opportunities',
  }).catch((error) => {
    console.warn('[Dashboard][ContentPerformance] Enrichment prefetch failed', {
      domain: input.domain,
      error: error instanceof Error ? error.message : String(error),
    })
  })

  return normalizeContentPerformanceSnapshot({ rankedKeywordCount, decayPages })
}
