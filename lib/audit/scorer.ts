import type { AuditResults, BrandDetectionPayload, PlatformResult } from '@/lib/audit/types'

const TOTAL_CHECKS: 5 = 5

function toPercent(value: number): number {
  return Math.round(value * 100)
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export function computeAuditResults(
  context: BrandDetectionPayload,
  platformResults: PlatformResult[]
): AuditResults {
  const brandFoundCount = platformResults.filter((result) => result.brandMentioned).length

  const competitorMentionCounts = new Map<string, number>()
  platformResults.forEach((result) => {
    result.competitorsMentioned.forEach((competitor) => {
      competitorMentionCounts.set(competitor, (competitorMentionCounts.get(competitor) || 0) + 1)
    })
  })

  let topCompetitor = context.competitors[0] || 'Competitor'
  let topCompetitorFoundCount = 0

  competitorMentionCounts.forEach((count, competitor) => {
    if (count > topCompetitorFoundCount) {
      topCompetitor = competitor
      topCompetitorFoundCount = count
    }
  })

  const competitorComparison =
    topCompetitorFoundCount === 0
      ? 'That means the category benchmark is still open, and you have room to define it.'
      : brandFoundCount >= topCompetitorFoundCount
        ? 'That puts you at or above the strongest observed benchmark in this sample, which is a solid base to compound.'
        : 'That gives you a clear benchmark and visible room to grow.'
  const competitorAdvantage = `${context.brand} appeared ${brandFoundCount} out of ${TOTAL_CHECKS} times in this sample, while ${topCompetitor} appeared ${topCompetitorFoundCount} times. ${competitorComparison}`

  const citationUrls = unique(platformResults.flatMap((result) => result.citationUrls))
  const competitorDomainCounter = new Map<string, number>()

  platformResults.forEach((result) => {
    result.competitorDomainsCited.forEach((domain) => {
      competitorDomainCounter.set(domain, (competitorDomainCounter.get(domain) || 0) + 1)
    })
  })

  const competitorDomainsCited = Array.from(competitorDomainCounter.entries()).map(
    ([domain, count]) => ({ domain, count })
  )

  const perplexityChecks = platformResults
    .filter((result) => result.platform === 'perplexity')
    .slice(0, 3)
    .map((result) => ({ mentioned: result.brandMentioned, position: result.brandPosition }))

  const grokResult = platformResults.find((result) => result.platform === 'grok')
  const geminiResult = platformResults.find((result) => result.platform === 'gemini')

  return {
    brand: context.brand,
    brandFoundCount,
    totalChecks: TOTAL_CHECKS,
    visibilityRate: toPercent(brandFoundCount / TOTAL_CHECKS),
    topCompetitor,
    topCompetitorFoundCount,
    competitorAdvantage,
    citationUrls,
    userDomainCited: platformResults.some((result) => result.userDomainCited),
    competitorDomainsCited,
    platformResults: {
      perplexity: perplexityChecks,
      grok: grokResult
        ? { mentioned: grokResult.brandMentioned, position: grokResult.brandPosition }
        : { mentioned: false, position: null },
      gemini: geminiResult
        ? { mentioned: geminiResult.brandMentioned, position: geminiResult.brandPosition }
        : { mentioned: false, position: null },
    },
  }
}
