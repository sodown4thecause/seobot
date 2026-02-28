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

  const competitorAdvantage = `${topCompetitor} was recommended ${topCompetitorFoundCount} out of ${TOTAL_CHECKS} times. ${context.brand} was recommended ${brandFoundCount} out of ${TOTAL_CHECKS} times.`

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
