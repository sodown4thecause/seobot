import type {
  AuditBenchmarkBand,
  AuditExecutionMeta,
  AuditMomentumCategory,
  AuditOpportunity,
  AuditResults,
  AuditScorecard,
  AuditShareModule,
  AuditStrength,
  PlatformResult,
  TopicalMapNode,
  TopicalMapResultPayload,
} from '@/lib/audit/types'

interface BuildAuditScorecardInput {
  results: AuditResults
  platformResults: PlatformResult[]
  topicalMapPayload?: TopicalMapResultPayload | null
  executionMeta?: AuditExecutionMeta | null
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function positionToScore(position: number | null): number {
  if (!position || position < 1) return 0
  if (position === 1) return 100
  if (position === 2) return 86
  if (position === 3) return 74
  return 62
}

function distinctMentionedPlatforms(platformResults: PlatformResult[]): Array<PlatformResult['platform']> {
  return unique(
    platformResults
      .filter((result) => result.brandMentioned)
      .map((result) => result.platform)
  )
}

function pickTopGapNode(payload?: TopicalMapResultPayload | null): TopicalMapNode | null {
  if (!payload?.topicalMap.nodes.length) {
    return null
  }

  return payload.topicalMap.nodes
    .slice()
    .sort((a, b) => {
      const gapA = a.competitorCoverage - a.youCoverage
      const gapB = b.competitorCoverage - b.youCoverage
      if (gapA !== gapB) return gapB - gapA
      return a.topic.localeCompare(b.topic)
    })[0] || null
}

function buildMomentumCategory(overallScore: number): AuditMomentumCategory {
  if (overallScore <= 24) {
    return {
      key: 'early-signal',
      label: 'Early Signal',
      summary: 'You are early in AI visibility, which means the upside is wide open and the next wins are unusually leverageable.',
    }
  }

  if (overallScore <= 44) {
    return {
      key: 'untapped-upside',
      label: 'Untapped Upside',
      summary: 'You already have enough signal to prioritize. The main opportunity is turning scattered mentions into consistent visibility.',
    }
  }

  if (overallScore <= 64) {
    return {
      key: 'emerging-presence',
      label: 'Emerging Presence',
      summary: 'Your brand is beginning to show up in buyer journeys. The next step is expanding authority and source depth.',
    }
  }

  if (overallScore <= 84) {
    return {
      key: 'category-builder',
      label: 'Category Builder',
      summary: 'You are building a repeatable AI-search footprint. Stronger proof assets and topic ownership can compound that advantage.',
    }
  }

  return {
    key: 'reference-brand',
    label: 'Reference Brand',
    summary: 'AI systems already have strong reasons to surface your brand. Focus on protecting and extending that lead.',
  }
}

function buildBenchmarkBand(
  overallScore: number,
  unlockPotentialScore: number,
  modelCoverageCount: number
): AuditBenchmarkBand {
  if (overallScore <= 24) {
    return {
      label: 'High-headroom benchmark',
      summary: `You are earlier than most teams that have not built an explicit AI visibility system yet. With ${modelCoverageCount}/3 model coverage today, the headroom is still highly actionable.`,
    }
  }

  if (overallScore <= 44) {
    return {
      label: 'Opportunity-rich benchmark',
      summary: `You have enough presence to create momentum quickly. An unlock potential score of ${unlockPotentialScore}/100 signals strong returns from focused execution.`,
    }
  }

  if (overallScore <= 64) {
    return {
      label: 'Emerging benchmark',
      summary: 'You are ahead of the typical brand that is only optimizing for Google. The next gains come from consistency and proof.',
    }
  }

  if (overallScore <= 84) {
    return {
      label: 'Leadership benchmark',
      summary: 'You are operating above the common baseline for brands experimenting with AI search visibility. Continued topic ownership can turn this into a durable moat.',
    }
  }

  return {
    label: 'Reference benchmark',
    summary: 'You look like a brand that AI systems can confidently surface and cite. Keep compounding with deeper coverage and stronger evidence.',
  }
}

function buildStrengths(
  input: BuildAuditScorecardInput,
  modelCoverageCount: number,
  topGapNode: TopicalMapNode | null,
  topicalAuthorityScore: number
): AuditStrength[] {
  const strengths: AuditStrength[] = []

  if (input.results.brandFoundCount > 0) {
    strengths.push({
      title: `Already surfacing in ${input.results.brandFoundCount}/${input.results.totalChecks} buyer-intent checks`,
      detail: `${input.results.brand} is already showing signal in live AI buyer journeys, which gives you a concrete baseline to build from.`,
    })
  }

  if (modelCoverageCount > 0) {
    strengths.push({
      title: `Present across ${modelCoverageCount}/3 AI models`,
      detail: 'Your visibility is not starting from zero. You already have cross-model signal that can be expanded with focused content and proof.',
    })
  }

  if (input.results.userDomainCited) {
    strengths.push({
      title: 'Already earning direct source trust',
      detail: 'At least one model cited your own domain, which means you are already behaving like a source in part of the category.',
    })
  } else if (input.results.citationUrls.length > 0) {
    strengths.push({
      title: 'Clear citation patterns are visible in your category',
      detail: 'The models returned external sources, which means the path to becoming cite-worthy is visible rather than speculative.',
    })
  }

  if (topicalAuthorityScore >= 55) {
    strengths.push({
      title: `Topical authority is already building at ${topicalAuthorityScore}/100`,
      detail: 'Your coverage depth is strong enough to support faster gains once you align proof assets and topic ownership.',
    })
  } else if (topGapNode) {
    strengths.push({
      title: `A clear growth topic is already identifiable`,
      detail: `${topGapNode.topic} stands out as a visible next move, which makes the roadmap concrete instead of vague.`,
    })
  }

  strengths.push({
    title: 'Your category context is clear enough to benchmark',
    detail: 'The system can confidently identify your brand, category, and competitive set, which makes each next action more targeted.',
  })

  return strengths.slice(0, 3)
}

function buildOpportunities(
  input: BuildAuditScorecardInput,
  modelCoverageCount: number,
  topGapNode: TopicalMapNode | null,
  aeoReadinessScore: number,
  unlockPotentialScore: number
): AuditOpportunity[] {
  const opportunities: AuditOpportunity[] = []
  const proofGapScore = input.topicalMapPayload?.topicalMap.scores.proofGap ?? 0
  const hasProofGapScore = typeof input.topicalMapPayload?.topicalMap.scores.proofGap === 'number'
  const missingModels = Math.max(0, 3 - modelCoverageCount)

  if (missingModels > 0) {
    opportunities.push({
      id: 'model-coverage',
      title: missingModels === 3 ? 'Create your first cross-model footprint' : 'Expand from partial visibility to broader coverage',
      detail: `${input.results.brand} currently shows up on ${modelCoverageCount}/3 models. Broader model coverage is the fastest way to make your scorecard feel stronger on the next rerun.`,
      action: 'Publish one category page or comparison page that states your positioning clearly, cites proof, and answers buyer-intent questions directly.',
      effort: 'Medium',
      timeframe: '30 days',
      expectedLift: '+8 to +12 pts',
    })
  }

  if (!input.results.userDomainCited || input.results.citationUrls.length < 2 || aeoReadinessScore < 60) {
    opportunities.push({
      id: 'source-trust',
      title: 'Become a source, not just a mention',
      detail: 'The category is being discussed, but your owned pages are not yet the evidence layer AI systems lean on consistently.',
      action: 'Ship one source-backed page with clear stats, author proof, FAQs, and schema so your domain becomes citation-ready.',
      effort: 'Medium',
      timeframe: '30 days',
      expectedLift: '+7 to +10 pts',
    })
  }

  if (topGapNode) {
    const gap = Math.max(0, topGapNode.competitorCoverage - topGapNode.youCoverage)
    opportunities.push({
      id: 'topic-gap',
      title: `Own ${topGapNode.topic} as your fastest authority win`,
      detail: `Competitors currently lead this topic by ${gap} coverage points. Closing even part of that gap can move both visibility and topical authority on the next rerun.`,
      action: `Publish or expand a source-backed page for ${topGapNode.topic}, then link it from your highest-authority pages.`,
      effort: gap > 24 ? 'Medium' : 'Low',
      timeframe: '7 days',
      expectedLift: '+6 to +9 pts',
    })
  }

  if (hasProofGapScore && (proofGapScore >= 55 || unlockPotentialScore >= 60)) {
    opportunities.push({
      id: 'proof-gap',
      title: 'Turn proof gaps into credibility gains',
      detail: `Your proof-gap signal is ${proofGapScore}/100, which means the clearest upside is adding original evidence that AI systems can quote with confidence.`,
      action: 'Add case studies, comparison snapshots, original data points, and structured author credentials to the pages you want AI systems to surface.',
      effort: 'Medium',
      timeframe: '90 days',
      expectedLift: '+8 to +14 pts',
    })
  }

  opportunities.push({
    id: 'rerun-loop',
    title: 'Build momentum with a monthly rerun cadence',
    detail: 'This scorecard becomes more valuable when the team can track movement over time instead of treating it like a one-off diagnosis.',
    action: 'Rerun the scorecard monthly and use the deltas as a standing GTM or SEO check-in.',
    effort: 'Low',
    timeframe: '90 days',
    expectedLift: 'Compounding',
  })

  return opportunities.slice(0, 4)
}

function buildActionPlan(opportunities: AuditOpportunity[]): AuditScorecard['actionPlan'] {
  const first = opportunities[0]
  const second = opportunities[1] || first
  const third = opportunities[2] || second || first

  return {
    next7Days: unique([
      first?.action || 'Publish one page aimed at your strongest topic opportunity.',
      'Turn your clearest buyer-intent question into a source-backed page with clean headings and proof.',
      'Capture this scorecard and share it internally so ownership is visible.',
    ]).slice(0, 3),
    next30Days: unique([
      second?.action || 'Expand your strongest topic into a small cluster of supporting pages.',
      'Refresh your comparison and solution pages so AI systems have explicit language to quote.',
      'Add schema, author proof, and internal links to the pages you want cited.',
    ]).slice(0, 3),
    next90Days: unique([
      third?.action || 'Turn your scorecard into a monthly benchmark and planning ritual.',
      'Build a repeatable content cadence around your top two opportunity themes.',
      'Review score movement monthly and keep shipping pages that strengthen citations, comparisons, and original proof.',
    ]).slice(0, 3),
  }
}

function buildShareModules(
  input: BuildAuditScorecardInput,
  scorecard: Pick<
    AuditScorecard,
    | 'overallScore'
    | 'momentumCategory'
    | 'benchmarkBand'
    | 'fastestWin'
    | 'unlockPotentialScore'
    | 'topicalAuthorityScore'
    | 'actionPlan'
  >
): AuditShareModule[] {
  const brand = input.results.brand

  return [
    {
      key: 'executive-scorecard',
      format: 'linkedin',
      title: 'Executive scorecard',
      subtitle: `${scorecard.overallScore}/100 • ${scorecard.momentumCategory.label}`,
      summary: `${brand} scored ${scorecard.overallScore}/100 on AI visibility. The strongest signal: ${scorecard.fastestWin.title.toLowerCase()}.`,
      shareText: `${brand} scored ${scorecard.overallScore}/100 on our AI Visibility Scorecard. Current category: ${scorecard.momentumCategory.label}. Fastest win: ${scorecard.fastestWin.title}.`,
      ctaLabel: 'Copy LinkedIn post',
    },
    {
      key: 'benchmark-card',
      format: 'story',
      title: 'Benchmark snapshot',
      subtitle: scorecard.benchmarkBand.label,
      summary: scorecard.benchmarkBand.summary,
      shareText: `${brand} benchmark snapshot: ${scorecard.benchmarkBand.label}. ${scorecard.benchmarkBand.summary}`,
      ctaLabel: 'Copy story text',
    },
    {
      key: 'topical-authority',
      format: 'x',
      title: 'Topical authority card',
      subtitle: `${scorecard.topicalAuthorityScore}/100 topical authority`,
      summary: `${brand} has the clearest upside in topic ownership and source-backed coverage.`,
      shareText: `${brand} topical authority score: ${scorecard.topicalAuthorityScore}/100. Biggest upside right now: stronger source-backed coverage on buyer-intent topics.`,
      ctaLabel: 'Copy X post',
    },
    {
      key: 'team-roadmap',
      format: 'team',
      title: 'Team action card',
      subtitle: `${scorecard.unlockPotentialScore}/100 unlock potential`,
      summary: `Next 30 days: ${scorecard.actionPlan.next30Days[0] || scorecard.fastestWin.action}`,
      shareText: `${brand} team note: ${scorecard.actionPlan.next7Days[0]} Then ${scorecard.actionPlan.next30Days[0]}.`,
      ctaLabel: 'Copy team summary',
    },
    {
      key: 'pdf-export',
      format: 'pdf',
      title: 'Board-ready export',
      subtitle: 'Scorecard + roadmap',
      summary: 'Export the scorecard with strengths, opportunities, and the 7/30/90-day plan.',
      shareText: `${brand} AI Visibility Scorecard export ready.`,
      ctaLabel: 'Print / save PDF',
    },
  ]
}

function buildTeamSummary(
  input: BuildAuditScorecardInput,
  scorecard: Pick<
    AuditScorecard,
    | 'overallScore'
    | 'momentumCategory'
    | 'benchmarkBand'
    | 'fastestWin'
    | 'biggestOpportunity'
  >
) {
  return {
    headline: `${input.results.brand}: ${scorecard.momentumCategory.label} in AI visibility`,
    summary: `${input.results.brand} is at ${scorecard.overallScore}/100 today. The scorecard shows clear upside with a defined fastest win and a concrete next roadmap.`,
    bullets: [
      `Benchmark: ${scorecard.benchmarkBand.label}`,
      `Fastest win: ${scorecard.fastestWin.title}`,
      `Biggest opportunity: ${scorecard.biggestOpportunity.title}`,
    ],
  }
}

export function buildAuditScorecard(input: BuildAuditScorecardInput): AuditScorecard {
  const topicalAuthorityScore = input.topicalMapPayload?.topicalMap.scores.topicalAuthority ?? 42
  const modelCoverageCount = distinctMentionedPlatforms(input.platformResults).length
  const positionHealthScore = average(
    input.platformResults
      .filter((result) => result.brandMentioned)
      .map((result) => positionToScore(result.brandPosition))
  )
  const citationSignalScore = clamp(
    input.results.citationUrls.length * 14 +
      (input.results.userDomainCited ? 22 : 0) +
      input.platformResults.filter((result) => result.citationUrls.length > 0).length * 10 +
      (input.executionMeta?.citationAvailability === 'full' ? 8 : 0)
  )

  const visibilityScore = clamp(input.results.visibilityRate)
  const aeoReadinessScore = clamp(0.45 * visibilityScore + 0.35 * citationSignalScore + 0.2 * positionHealthScore)
  const unlockPotentialScore = clamp(
    0.55 * (100 - visibilityScore) + 0.45 * (input.topicalMapPayload?.topicalMap.scores.proofGap ?? 55)
  )
  const overallScore = clamp(
    0.4 * visibilityScore +
      0.25 * aeoReadinessScore +
      0.2 * topicalAuthorityScore +
      0.15 * unlockPotentialScore
  )

  const momentumCategory = buildMomentumCategory(overallScore)
  const benchmarkBand = buildBenchmarkBand(overallScore, unlockPotentialScore, modelCoverageCount)
  const topGapNode = pickTopGapNode(input.topicalMapPayload)
  const strengths = buildStrengths(input, modelCoverageCount, topGapNode, topicalAuthorityScore)
  const opportunities = buildOpportunities(input, modelCoverageCount, topGapNode, aeoReadinessScore, unlockPotentialScore)
  const fastestWin = opportunities.find((opportunity) => opportunity.timeframe === '7 days') || opportunities[0]
  const biggestOpportunity =
    opportunities.find((opportunity) => opportunity.id === 'source-trust') ||
    opportunities.find((opportunity) => opportunity.id === 'topic-gap') ||
    opportunities[0]
  const actionPlan = buildActionPlan(opportunities)

  const partialScorecard: AuditScorecard = {
    overallScore,
    visibilityScore,
    aeoReadinessScore,
    topicalAuthorityScore,
    unlockPotentialScore,
    momentumCategory,
    benchmarkBand,
    strengths,
    opportunities,
    fastestWin,
    biggestOpportunity,
    actionPlan,
    shareModules: [],
    teamSummary: {
      headline: '',
      summary: '',
      bullets: [],
    },
  }

  partialScorecard.shareModules = buildShareModules(input, partialScorecard)
  partialScorecard.teamSummary = buildTeamSummary(input, partialScorecard)

  return partialScorecard
}
