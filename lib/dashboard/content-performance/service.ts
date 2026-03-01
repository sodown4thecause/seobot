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

  const rankedKeywordCount = rankedKeywordsResult.success ? rankedKeywordsResult.data.totalKeywords : 0
  const decayPages = Math.max(0, Math.round(rankedKeywordCount * 0.2))

  await runEnrichment({
    domain: input.domain,
    query: 'content performance keyword decay opportunities',
  })

  return normalizeContentPerformanceSnapshot({ rankedKeywordCount, decayPages })
}
