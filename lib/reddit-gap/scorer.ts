import type { ContentGap, ThreadAnalysis, SubredditDiscovery } from './types'

interface EngagementFactors {
  upvotes: number
  comments: number
  upvoteRatio: number
  recencyDays: number
}

export function calculateEngagementScore(factors: EngagementFactors): number {
  const upvoteWeight = 0.3
  const commentWeight = 0.3
  const ratioWeight = 0.2
  const recencyWeight = 0.2

  const upvoteScore = Math.min(factors.upvotes / 100, 1) * 100
  const commentScore = Math.min(factors.comments / 50, 1) * 100
  const ratioScore = factors.upvoteRatio * 100
  const recencyScore = Math.max(0, 100 - (factors.recencyDays / 3.65))

  return Math.round(
    upvoteScore * upvoteWeight +
    commentScore * commentWeight +
    ratioScore * ratioWeight +
    recencyScore * recencyWeight
  )
}

export function calculateGapFrequency(question: string, allQuestions: string[]): number {
  const normalizedQ = question.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const keywords = normalizedQ.split(/\s+/).filter((w) => w.length > 3)

  let frequency = 0
  for (const q of allQuestions) {
    const normalizedOther = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const matchCount = keywords.filter((kw) => normalizedOther.includes(kw)).length
    if (matchCount >= Math.ceil(keywords.length * 0.4)) {
      frequency++
    }
  }

  return frequency
}

export function assessCommercialIntent(question: string): 'high' | 'medium' | 'low' {
  const highIntentPatterns = [
    /\b(buy|purchase|price|cost|budget|afford|cheapest|best|vs|compare|review|recommend)\b/i,
    /\b(should i|which one|what should|i need|i want|looking for|help me choose)\b/i,
    /\b(alternative|replacement|upgrade|switch|migrate)\b/i,
  ]

  const mediumIntentPatterns = [
    /\b(how (to|do|can|does)|what is|guide|tutorial|setup|configure)\b/i,
    /\b(problem|issue|error|fix|troubleshoot|debug)\b/i,
    /\b(setup|install|integrate|workflow|process)\b/i,
  ]

  for (const pattern of highIntentPatterns) {
    if (pattern.test(question)) return 'high'
  }

  for (const pattern of mediumIntentPatterns) {
    if (pattern.test(question)) return 'medium'
  }

  return 'low'
}

export function assessCompetitionLevel(question: string, threads: ThreadAnalysis[]): 'low' | 'medium' | 'high' {
  const keywords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  let answeredCount = 0

  for (const thread of threads) {
    const fullText = `${thread.title} ${thread.selftext} ${thread.scrapedContent}`.toLowerCase()
    const matchCount = keywords.filter((kw) => fullText.includes(kw)).length
    if (matchCount >= Math.ceil(keywords.length * 0.5)) {
      const threadComments = thread.comments || []
      const hasSubstantiveAnswer = threadComments.some((c) => c.score >= 5 && c.body.length > 200)
      if (hasSubstantiveAnswer) answeredCount++
    }
  }

  if (answeredCount >= 3) return 'high'
  if (answeredCount >= 1) return 'medium'
  return 'low'
}

export function recommendContentType(question: string): ContentGap['recommendedContentType'] {
  if (/\b(compare|vs|versus|alternative|which one)\b/i.test(question)) return 'comparison'
  if (/\b(how to|how do|tutorial|setup|guide|step)\b/i.test(question)) return 'tutorial'
  if (/\b(what is|definition|explain|meaning|basics)\b/i.test(question)) return 'guide'
  if (/\b(list|top|best|favorite|recommend)\b/i.test(question)) return 'blog_post'
  if (/\?.*\?$/.test(question.trim()) || /^(can|does|is|are|should|will|would)\b/i.test(question)) return 'faq'
  return 'blog_post'
}

export function estimateSearchVolume(question: string, engagement: number): ContentGap['estimatedSearchVolume'] {
  if (engagement >= 70 && /\b(best|how|what|top|guide)\b/i.test(question)) return 'high'
  if (engagement >= 40) return 'medium'
  return 'low'
}

export function scoreContentGaps(
  gaps: ContentGap[],
  threads: ThreadAnalysis[],
  subreddits: SubredditDiscovery[]
): {
  overallGapScore: number
  opportunityScore: number
  engagementDensity: number
  questionCoverage: number
  competitiveAdvantage: number
} {
  if (gaps.length === 0) {
    return {
      overallGapScore: 0,
      opportunityScore: 0,
      engagementDensity: 0,
      questionCoverage: 0,
      competitiveAdvantage: 0,
    }
  }

  const avgEngagement = gaps.reduce((sum, g) => sum + g.engagementScore, 0) / gaps.length
  const highIntentCount = gaps.filter((g) => g.commercialIntent === 'high').length
  const lowCompCount = gaps.filter((g) => g.competitionLevel === 'low').length
  const totalQuestions = threads.reduce((sum, t) => sum + t.questions.length, 0)
  const totalSubscribers = subreddits.reduce((sum, s) => sum + s.subscribers, 0)
  const engagementDensity = Math.min(100, Math.round((totalQuestions / Math.max(1, threads.length)) * 10))
  const questionCoverage = Math.min(100, Math.round((totalQuestions / Math.max(1, totalQuestions + gaps.length * 3)) * 100))
  const competitiveAdvantage = Math.min(100, Math.round((lowCompCount / gaps.length) * 100))
  const opportunityScore = Math.min(100, Math.round(
    (highIntentCount / gaps.length) * 50 +
    (avgEngagement / 100) * 30 +
    (lowCompCount / gaps.length) * 20
  ))
  const overallGapScore = Math.min(100, Math.round(
    opportunityScore * 0.4 +
    engagementDensity * 0.25 +
    questionCoverage * 0.2 +
    competitiveAdvantage * 0.15
  ))

  return {
    overallGapScore,
    opportunityScore,
    engagementDensity,
    questionCoverage,
    competitiveAdvantage,
  }
}