import type {
  AIPerceptionCategory,
  DiagnosticIntent,
  DiagnosticModel,
  EngineBreakdown,
  ParseMethod,
} from '@/lib/diagnostic-types'
import { DIAGNOSTIC_ENGINES } from '@/lib/diagnostic-types'
import type { LlmStructuredResponse } from '@/lib/validate'

interface RunInput {
  intent: DiagnosticIntent
  model: DiagnosticModel
  parsed: LlmStructuredResponse
  parseMethod: ParseMethod
  rawResponse: string
  error?: string
}

export interface RunAnalysis {
  intent: DiagnosticIntent
  model: DiagnosticModel
  parseMethod: ParseMethod
  mentioned: boolean
  recommended: boolean
  cited: boolean
  targetBestPosition: number | null
  recommendationScore: number
  targetPrimaryOrSecondary: boolean
  error?: string
  parsed: LlmStructuredResponse
}

export interface Step1ScoringResult {
  aiInfluenceScore: number
  recommendationRate: number
  engineCoverage: number
  citationRate: number
  primaryAICompetitor: string
  aiPerceptionCategory: AIPerceptionCategory
  aiPerceptionInsight: string
  engineBreakdown: Record<DiagnosticModel, EngineBreakdown>
}

const RECOMMENDATION_WEIGHTS: Record<string, number> = {
  primary: 1,
  secondary: 0.7,
  listed: 0.4,
  mention_only: 0.2,
}

function positionWeight(position: number | null | undefined): number {
  if (position === null || position === undefined) return 0.2
  if (position <= 1) return 1
  if (position === 2) return 0.75
  if (position === 3) return 0.5
  return 0.3
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function domainFromUrl(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function brandMatchesTarget(name: string, targetDomain: string, targetBrandName: string): boolean {
  const normalizedName = normalizeToken(name)
  const domainToken = normalizeToken(targetDomain.split('.')[0] || targetDomain)
  const brandToken = normalizeToken(targetBrandName)

  if (!normalizedName) return false

  const MIN_TOKEN_LENGTH = 3

  if (brandToken) {
    if (brandToken.length < MIN_TOKEN_LENGTH) {
      if (name.toLowerCase().split(/\b/).some((part) => part.toLowerCase() === targetBrandName.toLowerCase())) {
        return true
      }
    } else if (normalizedName.includes(brandToken)) {
      return true
    }
  }

  if (domainToken) {
    if (domainToken.length < MIN_TOKEN_LENGTH) {
      const domainBase = targetDomain.split('.')[0] || targetDomain
      if (name.toLowerCase().split(/\b/).some((part) => part.toLowerCase() === domainBase.toLowerCase())) {
        return true
      }
    } else if (normalizedName.includes(domainToken)) {
      return true
    }
  }

  return false
}

export function analyzeDiagnosticRun(args: {
  run: RunInput
  targetDomain: string
  targetBrandName: string
}): RunAnalysis {
  const { run, targetDomain, targetBrandName } = args
  const rawLower = run.rawResponse.toLowerCase()
  const normalizedDomain = targetDomain.toLowerCase().replace(/^www\./, '')

  const matchingRecommendations = run.parsed.recommended_brands.filter((brand) =>
    brandMatchesTarget(brand.name, normalizedDomain, targetBrandName),
  )

  const targetLinks = run.parsed.direct_links_included.filter((link) => {
    const linkDomain = domainFromUrl(link.url)
    return linkDomain === normalizedDomain || linkDomain.endsWith(`.${normalizedDomain}`)
  })

  const domainMentionedInRaw =
    rawLower.includes(normalizedDomain) || rawLower.includes(`www.${normalizedDomain}`)

  const mentioned = domainMentionedInRaw || matchingRecommendations.length > 0 || targetLinks.length > 0

  const recommendedEntries = matchingRecommendations.filter(
    (entry) => entry.recommendation_type === 'primary' || entry.recommendation_type === 'secondary' || entry.recommendation_type === 'listed',
  )

  const recommended = recommendedEntries.length > 0

  const targetBestPosition =
    matchingRecommendations
      .map((entry) => (entry.position === undefined ? null : entry.position))
      .filter((position): position is number => typeof position === 'number' && Number.isFinite(position))
      .sort((a, b) => a - b)[0] ?? null

  const recommendationScore = matchingRecommendations.reduce((maxScore, entry) => {
    const typeWeight = RECOMMENDATION_WEIGHTS[entry.recommendation_type] ?? 0
    const score = typeWeight * positionWeight(entry.position)
    return Math.max(maxScore, score)
  }, 0)

  const targetPrimaryOrSecondary = matchingRecommendations.some(
    (entry) => entry.recommendation_type === 'primary' || entry.recommendation_type === 'secondary',
  )

  return {
    intent: run.intent,
    model: run.model,
    parseMethod: run.parseMethod,
    mentioned,
    recommended,
    cited: targetLinks.length > 0,
    targetBestPosition,
    recommendationScore,
    targetPrimaryOrSecondary,
    error: run.error,
    parsed: run.parsed,
  }
}

function buildEngineBreakdown(runs: RunAnalysis[]): Record<DiagnosticModel, EngineBreakdown> {
  const engines = DIAGNOSTIC_ENGINES
  const breakdown = {} as Record<DiagnosticModel, EngineBreakdown>

  for (const engine of engines) {
    const engineRuns = runs.filter((run) => run.model === engine)
    const bestPosition =
      engineRuns
        .map((run) => run.targetBestPosition)
        .filter((position): position is number => typeof position === 'number')
        .sort((a, b) => a - b)[0] ?? null

    breakdown[engine] = {
      engine,
      mentioned: engineRuns.some((run) => run.mentioned),
      recommended: engineRuns.some((run) => run.recommended),
      cited: engineRuns.some((run) => run.cited),
      bestPosition,
      completedRuns: engineRuns.filter((run) => !run.error).length,
      totalRuns: DIAGNOSTIC_ENGINES.length,
    }
  }

  return breakdown
}

function computePrimaryCompetitor(args: {
  runs: RunAnalysis[]
  targetDomain: string
  targetBrandName: string
  serpCompetitorDomains: string[]
}): string {
  const frequencies = new Map<string, number>()

  for (const run of args.runs) {
    for (const brand of run.parsed.recommended_brands) {
      if (brandMatchesTarget(brand.name, args.targetDomain, args.targetBrandName)) {
        continue
      }
      const key = brand.name.trim().toLowerCase()
      if (!key) continue
      frequencies.set(key, (frequencies.get(key) || 0) + 1)
    }
  }

  for (const competitorDomain of args.serpCompetitorDomains) {
    const key = competitorDomain.trim().toLowerCase()
    if (!key) continue
    frequencies.set(key, (frequencies.get(key) || 0) + 1)
  }

  const top = Array.from(frequencies.entries()).sort((a, b) => b[1] - a[1])[0]
  if (!top) {
    return 'No consistent competitor detected'
  }

  return top[0]
}

function computePerceptionCategory(runs: RunAnalysis[]): {
  category: AIPerceptionCategory
  insight: string
} {
  const mentionsByIntent: Record<DiagnosticIntent, number> = {
    transactional: 0,
    comparative: 0,
    informational: 0,
  }

  let transactionalPreferred = false

  for (const run of runs) {
    if (run.mentioned) {
      mentionsByIntent[run.intent] += 1
    }

    if (run.intent === 'transactional') {
      const hasPreferred = run.targetPrimaryOrSecondary
      if (hasPreferred) {
        transactionalPreferred = true
      }
    }
  }

  const totalMentions = mentionsByIntent.transactional + mentionsByIntent.comparative + mentionsByIntent.informational
  if (totalMentions === 0) {
    return {
      category: 'Low AI Visibility',
      insight: 'AI models rarely mention your brand in these high-intent prompts.',
    }
  }

  if (transactionalPreferred) {
    return {
      category: 'Preferred Solution',
      insight: 'At least one transactional run places your brand as a direct recommendation.',
    }
  }

  if (mentionsByIntent.informational > 0 && mentionsByIntent.comparative === 0 && mentionsByIntent.transactional === 0) {
    return {
      category: 'Informational Authority',
      insight: 'Your brand appears in informational intent, but not in buying-oriented comparisons.',
    }
  }

  return {
    category: 'Considered Alternative',
    insight: 'Your brand is considered during comparisons but is not yet the dominant transactional pick.',
  }
}

function roundRate(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function computeStep1Score(args: {
  runs: RunAnalysis[]
  expectedRuns: number
  targetDomain: string
  targetBrandName: string
  serpCompetitorDomains: string[]
}): Step1ScoringResult {
  const expectedRuns = Math.max(args.expectedRuns, 1)
  const recommendationRate =
    args.runs.reduce((sum, run) => sum + run.recommendationScore, 0) / expectedRuns

  const engineBreakdown = buildEngineBreakdown(args.runs)
  const enginesMentioned = Object.values(engineBreakdown).filter((engine) => engine.mentioned).length
  const engineCoverage = enginesMentioned / DIAGNOSTIC_ENGINES.length

  const citationRate = args.runs.filter((run) => run.cited).length / expectedRuns

  const scoreRaw = 100 * (0.5 * recommendationRate + 0.3 * engineCoverage + 0.2 * citationRate)
  const aiInfluenceScore = Math.max(0, Math.min(100, Math.round(scoreRaw)))

  const primaryAICompetitor = computePrimaryCompetitor({
    runs: args.runs,
    targetDomain: args.targetDomain,
    targetBrandName: args.targetBrandName,
    serpCompetitorDomains: args.serpCompetitorDomains,
  })

  const perception = computePerceptionCategory(args.runs)

  return {
    aiInfluenceScore,
    recommendationRate: roundRate(recommendationRate),
    engineCoverage: roundRate(engineCoverage),
    citationRate: roundRate(citationRate),
    primaryAICompetitor,
    aiPerceptionCategory: perception.category,
    aiPerceptionInsight: perception.insight,
    engineBreakdown,
  }
}
