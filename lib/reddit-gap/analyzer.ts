import 'server-only'
import { searchSubreddits, searchPosts, getTopPosts } from '@/lib/mcp/reddit/search'
import { getThreadWithComments, extractQuestionsFromThread } from '@/lib/mcp/reddit/threads'
import { scrapeRedditThread } from '@/lib/mcp/supadata/client'
import { buildGapAnalysisPrompt, buildScorecardPrompt } from './prompts'
import {
  calculateEngagementScore,
  calculateGapFrequency,
  assessCommercialIntent,
  assessCompetitionLevel,
  recommendContentType,
  estimateSearchVolume,
  scoreContentGaps,
} from './scorer'
import type {
  ContentGap,
  SubredditDiscovery,
  ThreadAnalysis,
  RedditGapResults,
  RedditGapScorecard,
  RedditGapOpportunity,
  GapMomentumCategory,
  GapBenchmarkBand,
} from './types'

export async function discoverSubreddits(topic: string): Promise<SubredditDiscovery[]> {
  const results = await searchSubreddits(topic, 15)
  const subreddits: SubredditDiscovery[] = results.map((sub) => ({
    name: sub.name,
    displayName: sub.displayName || sub.name,
    description: sub.description || sub.publicDescription || '',
    subscribers: sub.subscribers,
    activeUsers: sub.activeUsers,
    relevanceScore: Math.min(100, Math.round((sub.subscribers / 100000) * 50 + 50)),
    postCount: 0,
  }))

  return subreddits.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10)
}

export async function analyzeThreads(
  topic: string,
  subreddits: SubredditDiscovery[]
): Promise<ThreadAnalysis[]> {
  const allThreads: ThreadAnalysis[] = []
  const SEARCH_QUERIES = [
    topic,
    `${topic} help`,
    `${topic} question`,
    `${topic} recommendation`,
    `best ${topic}`,
  ]

  const seenPostIds = new Set<string>()

  for (const subreddit of subreddits.slice(0, 5)) {
    for (const query of SEARCH_QUERIES.slice(0, 2)) {
      try {
        const posts = await searchPosts(query, subreddit.name, 'relevance', 'year', 10)

        for (const post of posts) {
          if (seenPostIds.has(post.id)) continue
          if (post.score < 5) continue
          seenPostIds.add(post.id)

          try {
            const thread = await getThreadWithComments(
              post.subreddit,
              post.id,
              25,
              'top'
            )

            const questions = extractQuestionsFromThread(thread)

            let scrapedContent = ''
            try {
              const scraped = await scrapeRedditThread(post.subreddit, post.id)
              scrapedContent = scraped.content
            } catch {
              scrapedContent = post.selftext
            }

            allThreads.push({
              postId: post.id,
              title: post.title,
              selftext: post.selftext,
              subreddit: post.subreddit,
              score: post.score,
              numComments: post.numComments,
              upvoteRatio: post.upvoteRatio,
              createdUtc: post.createdUtc,
              url: `https://reddit.com${post.permalink}`,
              questions,
              scrapedContent,
            })
          } catch (error) {
            console.warn(`[Reddit Gap] Failed to analyze thread ${post.id}:`, error)
          }

          if (seenPostIds.size >= 30) break
        }

        if (seenPostIds.size >= 30) break
      } catch (error) {
        console.warn(`[Reddit Gap] Failed to search posts in r/${subreddit.name}:`, error)
      }
    }

    if (seenPostIds.size >= 30) break
  }

  return allThreads.sort((a, b) => b.score - a.score).slice(0, 20)
}

export async function identifyGaps(
  topic: string,
  threads: ThreadAnalysis[],
  subreddits: SubredditDiscovery[]
): Promise<ContentGap[]> {
  if (threads.length === 0) return []

  const allQuestions = threads.flatMap((t) => t.questions.map((q) => q.question))

  const mergedQuestions = new Map<string, {
    question: string
    context: string
    frequency: number
    totalUpvotes: number
    sourceThreads: ContentGap['sourceThreads']
    commercialIntent: 'high' | 'medium' | 'low'
  }>()

  for (const thread of threads) {
    for (const q of thread.questions) {
      const normalizedKey = q.question.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().slice(0, 60)

      if (mergedQuestions.has(normalizedKey)) {
        const existing = mergedQuestions.get(normalizedKey)!
        existing.frequency += 1
        existing.totalUpvotes += q.upvotes
        existing.sourceThreads.push({
          title: thread.title,
          subreddit: thread.subreddit,
          url: thread.url,
          score: thread.score,
          numComments: thread.numComments,
          createdUtc: thread.createdUtc,
        })
      } else {
        const engagementScore = calculateEngagementScore({
          upvotes: q.upvotes,
          comments: thread.numComments,
          upvoteRatio: thread.upvoteRatio,
          recencyDays: Math.max(1, (Date.now() / 1000 - thread.createdUtc) / 86400),
        })

        mergedQuestions.set(normalizedKey, {
          question: q.question,
          context: q.context,
          frequency: calculateGapFrequency(q.question, allQuestions),
          totalUpvotes: q.upvotes,
          sourceThreads: [{
            title: thread.title,
            subreddit: thread.subreddit,
            url: thread.url,
            score: thread.score,
            numComments: thread.numComments,
            createdUtc: thread.createdUtc,
          }],
          commercialIntent: assessCommercialIntent(q.question),
        })
      }
    }
  }

  const gaps: ContentGap[] = Array.from(mergedQuestions.values())
    .sort((a, b) => b.totalUpvotes * b.frequency - a.totalUpvotes * a.frequency)
    .slice(0, 10)
.map((g, index) => ({
        id: `gap-${index + 1}`,
        question: g.question,
        context: g.context,
        engagementScore: Math.min(100, Math.round((g.totalUpvotes / Math.max(1, g.sourceThreads.length)) + g.frequency * 10)),
        frequency: g.frequency,
        commercialIntent: g.commercialIntent,
        competitionLevel: assessCompetitionLevel(g.question, threads),
        sourceThreads: g.sourceThreads.slice(0, 3),
        recommendedContentType: recommendContentType(g.question),
        estimatedSearchVolume: estimateSearchVolume(g.question, Math.min(100, Math.round((g.totalUpvotes / Math.max(1, g.sourceThreads.length)) + g.frequency * 10))),
      }))

  return gaps
}

export async function buildResults(
  topic: string,
  url: string | null,
  subreddits: SubredditDiscovery[],
  threads: ThreadAnalysis[],
  gaps: ContentGap[]
): Promise<RedditGapResults> {
  const scores = scoreContentGaps(gaps, threads, subreddits)
  const totalQuestions = threads.reduce((sum, t) => sum + t.questions.length, 0)
  const analysisConfidence = Math.min(100, Math.round(
    (threads.length / 10) * 30 +
    (totalQuestions / 20) * 40 +
    (subreddits.length / 3) * 30
  ))

  const momentumCategory = getMomentumCategory(scores.overallGapScore, gaps)
  const benchmarkBand = getBenchmarkBand(scores.overallGapScore)

  const scorecard: RedditGapScorecard = {
    overallGapScore: scores.overallGapScore,
    opportunityScore: scores.opportunityScore,
    engagementDensity: scores.engagementDensity,
    questionCoverage: scores.questionCoverage,
    competitiveAdvantage: scores.competitiveAdvantage,
    momentumCategory,
    benchmarkBand,
    strengths: getStrengths(gaps, threads, scores),
    opportunities: gaps.slice(0, 5).map((gap, i) => ({
      id: gap.id,
      title: gap.question.slice(0, 80),
      detail: gap.context,
      action: getActionForGap(gap),
      effort: gap.competitionLevel === 'low' ? 'Low' as const : gap.competitionLevel === 'medium' ? 'Medium' as const : 'High' as const,
      timeframe: gap.commercialIntent === 'high' ? '7 days' as const : gap.commercialIntent === 'medium' ? '30 days' as const : '90 days' as const,
      expectedLift: getExpectedLift(gap),
    })),
    fastestWin: getFastestWin(gaps),
    biggestOpportunity: getBiggestOpportunity(gaps),
    actionPlan: getActionPlan(gaps, topic),
  }

  return {
    topic,
    url,
    discoveredSubreddits: subreddits,
    analyzedThreads: threads.length,
    contentGaps: gaps,
    totalQuestionsFound: totalQuestions,
    analysisConfidence,
    topGapPreview: gaps[0] || null,
    scorecard,
  }
}

function getMomentumCategory(score: number, gaps: ContentGap[]): GapMomentumCategory {
  const highIntentCount = gaps.filter((g) => g.commercialIntent === 'high').length
  const lowCompCount = gaps.filter((g) => g.competitionLevel === 'low').length

  if (score >= 70 && highIntentCount >= 3) {
    return { key: 'ripe-opportunity', label: 'Ripe Opportunity', summary: 'High demand with low competition — the market is underserved and ready.' }
  }
  if (score >= 50 && lowCompCount >= 2) {
    return { key: 'emerging-demand', label: 'Emerging Demand', summary: 'Growing questions with few good answers — an early mover advantage exists.' }
  }
  if (score >= 30) {
    return { key: 'contested-space', label: 'Contested Space', summary: 'Active discussions but significant existing content — compete on depth and quality.' }
  }
  if (lowCompCount >= 3) {
    return { key: 'niche-access', label: 'Niche Access', summary: 'Small but focused audience with clear unmet needs — precision content wins.' }
  }
  return { key: 'saturated-market', label: 'Saturated Market', summary: 'Many competitors already covering this — differentiate with unique data or perspective.' }
}

function getBenchmarkBand(score: number): GapBenchmarkBand {
  if (score >= 80) return { label: 'Massive Gap', summary: 'Exceptional content opportunity with minimal existing coverage.' }
  if (score >= 60) return { label: 'High Opportunity', summary: 'Strong unmet demand that your content can capture.' }
  if (score >= 40) return { label: 'Moderate Opportunity', summary: 'Decent gaps exist but competition is present.' }
  if (score >= 20) return { label: 'Limited Opportunity', summary: 'Most questions are already addressed by competitors.' }
  return { label: 'Saturated', summary: 'The space is well-covered — focus on quality differentiation.' }
}

function getStrengths(gaps: ContentGap[], threads: ThreadAnalysis[], scores: ReturnType<typeof scoreContentGaps>): Array<{ title: string; detail: string }> {
  const strengths: Array<{ title: string; detail: string }> = []

  const avgEngagement = gaps.reduce((s, g) => s + g.engagementScore, 0) / Math.max(1, gaps.length)
  if (avgEngagement >= 50) {
    strengths.push({ title: 'High Engagement', detail: `Average engagement score of ${Math.round(avgEngagement)}/100 — users actively discuss these topics.` })
  }

  const lowCompCount = gaps.filter((g) => g.competitionLevel === 'low').length
  if (lowCompCount >= 2) {
    strengths.push({ title: 'Low Competition Gaps', detail: `${lowCompCount} content gaps have little existing coverage — easy wins available.` })
  }

  const highIntentCount = gaps.filter((g) => g.commercialIntent === 'high').length
  if (highIntentCount >= 2) {
    strengths.push({ title: 'Buying Intent', detail: `${highIntentCount} gaps show strong purchase/intent signals — content can directly drive conversions.` })
  }

  if (threads.length >= 15) {
    strengths.push({ title: 'Rich Data', detail: `Analysis of ${threads.length} threads provides high confidence in gap identification.` })
  }

  return strengths.slice(0, 3)
}

function getActionForGap(gap: ContentGap): string {
  const typeActions: Record<string, string> = {
    blog_post: `Write a comprehensive blog post addressing: "${gap.question}"`,
    guide: `Create an in-depth guide covering: "${gap.question}"`,
    faq: `Build an FAQ page that directly answers: "${gap.question}"`,
    comparison: `Publish a comparison page addressing: "${gap.question}"`,
    tutorial: `Create a step-by-step tutorial for: "${gap.question}"`,
  }
  return typeActions[gap.recommendedContentType] || `Create content addressing: "${gap.question}"`
}

function getExpectedLift(gap: ContentGap): string {
  if (gap.commercialIntent === 'high' && gap.competitionLevel === 'low') return '+40-60% organic traffic'
  if (gap.commercialIntent === 'high') return '+25-40% organic traffic'
  if (gap.competitionLevel === 'low') return '+20-35% organic traffic'
  return '+10-25% organic traffic'
}

function getFastestWin(gaps: ContentGap[]): RedditGapOpportunity {
  const best = gaps.find((g) => g.commercialIntent === 'high' && g.competitionLevel === 'low')
    || gaps.find((g) => g.competitionLevel === 'low')
    || gaps[0]

  return {
    id: best?.id || 'gap-1',
    title: best?.question.slice(0, 80) || 'Create targeted content',
    detail: best?.context || 'Address the top content gap from Reddit analysis.',
    action: best ? getActionForGap(best) : 'Create content addressing the top question.',
    effort: 'Low',
    timeframe: '7 days',
    expectedLift: best ? getExpectedLift(best) : '+10-20% organic traffic',
  }
}

function getBiggestOpportunity(gaps: ContentGap[]): RedditGapOpportunity {
  const best = gaps.find((g) => g.commercialIntent === 'high')
    || gaps.find((g) => g.engagementScore >= 50)
    || gaps[0]

  return {
    id: best?.id || 'gap-1',
    title: best?.question.slice(0, 80) || 'Comprehensive content strategy',
    detail: best?.context || 'Build a content strategy around top Reddit questions.',
    action: best ? getActionForGap(best) : 'Build comprehensive content strategy.',
    effort: 'Medium',
    timeframe: '30 days',
    expectedLift: best ? getExpectedLift(best) : '+20-35% organic traffic',
  }
}

function getActionPlan(gaps: ContentGap[], topic: string): { next7Days: string[]; next30Days: string[]; next90Days: string[] } {
  const lowCompGaps = gaps.filter((g) => g.competitionLevel === 'low').slice(0, 2)
  const highIntentGaps = gaps.filter((g) => g.commercialIntent === 'high').slice(0, 2)

  return {
    next7Days: lowCompGaps.length > 0
      ? lowCompGaps.map((g) => `Publish ${g.recommendedContentType} answering: "${g.question}"`)
      : [`Create an FAQ page addressing the top ${topic} questions from Reddit`],
    next30Days: highIntentGaps.length > 0
      ? highIntentGaps.map((g) => `Build a comprehensive ${g.recommendedContentType} for: "${g.question}"`)
      : [`Develop a content cluster around ${topic} based on Reddit discussions`],
    next90Days: [
      `Establish topical authority on ${topic} by covering all identified content gaps`,
      'Monitor Reddit for new questions and update content accordingly',
      'Build backlinks by referencing Reddit threads in your content',
    ],
  }
}

export async function runFullAnalysis(
  topic: string,
  url: string | null,
  subreddits?: string[]
): Promise<RedditGapResults> {
  const discoveredSubreddits = subreddits && subreddits.length > 0
    ? await discoverSubreddits(topic).then((all) =>
        all.filter((s) => subreddits.includes(s.name) || all.length <= subreddits.length)
      )
    : await discoverSubreddits(topic)

  const threads = await analyzeThreads(topic, discoveredSubreddits)
  const gaps = await identifyGaps(topic, threads, discoveredSubreddits)
  const results = await buildResults(topic, url, discoveredSubreddits, threads, gaps)

  return results
}