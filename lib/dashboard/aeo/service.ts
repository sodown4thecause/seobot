import { analyzeAISearchVolume } from '@/lib/services/dataforseo/ai-search-volume-integration'
import { normalizeAeoInsightsSnapshot } from '@/lib/dashboard/analytics/normalizers'
import { runEnrichment } from '@/lib/dashboard/analytics/enrichment-service'

type AeoInsightsRequest = {
  keywords: string[]
  locationName?: string
  languageCode?: string
}

export async function buildAeoInsightsSnapshot(input: AeoInsightsRequest) {
  const sanitizedKeywords = input.keywords
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0)

  const aiResult = await analyzeAISearchVolume({
    keywords: sanitizedKeywords.length > 0 ? sanitizedKeywords : ['seo reporting'],
    location_name: input.locationName,
    language_code: input.languageCode,
  })

  const aiKeywordCount = aiResult.success ? aiResult.data.summary.totalKeywords : 0
  const citationCoverageScore = aiResult.success ? Math.round(aiResult.data.summary.averageAIOpportunityScore) : 0

  const enrichment = await runEnrichment({
    domain: 'example.com',
    query: sanitizedKeywords.join(' ') || 'ai answer engine optimization',
  })

  return normalizeAeoInsightsSnapshot({
    aiKeywordCount,
    citationCoverageScore,
    enrichment,
  })
}
