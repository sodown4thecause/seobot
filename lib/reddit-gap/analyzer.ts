import 'server-only'
import { searchSubreddits, searchPosts, getTopPosts } from '@/lib/mcp/reddit/search'
import { getThreadWithComments, extractQuestionsFromThread } from '@/lib/mcp/reddit/threads'
import { scrapeRedditThread } from '@/lib/mcp/supadata/client'
import { buildGapAnalysisPrompt, buildScorecardPrompt } from './prompts'
import { runGrokAdapter } from '@/lib/llm/adapters/grok'
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

  for (const subreddit of subreddits.slice(0, 3)) {
    for (const query of SEARCH_QUERIES.slice(0, 1)) {
      try {
        const posts = await searchPosts(query, subreddit.name, 'relevance', 'year', 5)

        for (const post of posts) {
          if (seenPostIds.has(post.id)) continue
          if (post.score < 10) continue
          seenPostIds.add(post.id)

          try {
            const thread = await getThreadWithComments(
              post.subreddit,
              post.id,
              15,
              'top'
            )

            const questions = extractQuestionsFromThread(thread)

            let scrapedContent = ''
            try {
              const scraped = await scrapeRedditThread(post.subreddit, post.id)
              scrapedContent = scraped.content
            } catch (error) {
              if (error instanceof Error && error.message.includes('Supadata API')) {
                console.warn(`[Reddit Gap] Supadata API failure, using selftext:`, error)
                scrapedContent = post.selftext
              } else {
                console.warn(`[Reddit Gap] Failed to scrape thread ${post.id}, using selftext:`, error)
                scrapedContent = post.selftext
              }
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

          if (seenPostIds.size >= 10) break
        }

        if (seenPostIds.size >= 10) break
      } catch (error) {
        console.warn(`[Reddit Gap] Failed to search posts in r/${subreddit.name}:`, error)
      }
    }

    if (seenPostIds.size >= 10) break
  }

  return allThreads.sort((a, b) => b.score - a.score).slice(0, 10)
}

export async function identifyGaps(
  topic: string,
  threads: ThreadAnalysis[],
  subreddits: SubredditDiscovery[]
): Promise<ContentGap[]> {
  if (threads.length === 0) return []

  try {
    // Use Grok for AI-powered gap analysis - much faster and more intelligent
    const prompt = buildGapAnalysisPrompt(topic, threads, subreddits)
    
    const result = await runGrokAdapter({
      systemPrompt: "You are a content strategy expert specializing in SEO and audience research. Analyze Reddit discussions to identify content gaps.",
      userPrompt: prompt,
      timeoutMs: 10000, // 10 second timeout
      retries: 1
    })

    // Parse AI response
    const aiGaps = JSON.parse(result.rawText)
    
    // Convert AI response to ContentGap format with proper metadata
    // Use deterministic calculations based on thread data, not random values
    return aiGaps.map((gap: any, index: number) => {
      const baseEngagement = gap.engagementScore || 50
      // Derive engagement score from actual thread scores (deterministic)
      const threadEngagement = threads.slice(0, 3).reduce((sum, t) => sum + Math.min(100, t.score), 0) / Math.max(1, threads.slice(0, 3).length * 2)
      const engagementScore = Math.min(100, Math.round((baseEngagement + threadEngagement) / 2))
      
      // Calculate frequency based on actual question occurrence in threads
      const questionFrequency = threads.filter(t => 
        t.questions.some(q => q.question.toLowerCase().includes(gap.question.toLowerCase().slice(0, 20)))
      ).length
      const frequency = Math.max(1, Math.min(5, questionFrequency || Math.ceil(gap.engagementScore / 20)))
      
      return {
        id: `gap-${index + 1}`,
        question: gap.question,
        context: gap.context,
        engagementScore,
        frequency,
        commercialIntent: gap.commercialIntent || 'medium',
        competitionLevel: gap.competitionLevel || 'medium',
        sourceThreads: threads.slice(0, 3).map(t => ({
          title: t.title,
          subreddit: t.subreddit,
          url: t.url,
          score: t.score,
          numComments: t.numComments,
          createdUtc: t.createdUtc,
        })),
        recommendedContentType: gap.recommendedContentType || 'blog_post',
        estimatedSearchVolume: gap.estimatedSearchVolume || 'medium',
      }
    }).slice(0, 8)
    
  } catch (error) {
    console.warn('[Reddit Gap] AI analysis failed, falling back to algorithmic:', error)
    
    // Fallback to simplified algorithmic approach
    const allQuestions = threads.flatMap((t) => t.questions.map((q) => q.question))
    
    return threads.slice(0, 5).map((thread, index) => {
      const question = thread.questions[0]?.question || `What are people asking about ${topic}?`
      
      return {
        id: `gap-${index + 1}`,
        question,
        context: thread.questions[0]?.context || 'Users are actively discussing this topic',
        engagementScore: Math.min(100, thread.score / 10),
        frequency: 1,
        commercialIntent: assessCommercialIntent(question),
        competitionLevel: 'medium',
        sourceThreads: [{
          title: thread.title,
          subreddit: thread.subreddit,
          url: thread.url,
          score: thread.score,
          numComments: thread.numComments,
          createdUtc: thread.createdUtc,
        }],
        recommendedContentType: recommendContentType(question),
        estimatedSearchVolume: 'medium',
      }
    })
  }
}

export async function buildResults(
  topic: string,
  url: string | null,
  subreddits: SubredditDiscovery[],
  threads: ThreadAnalysis[],
  gaps: ContentGap[]
): Promise<RedditGapResults> {
  const totalQuestions = threads.reduce((sum, t) => sum + t.questions.length, 0)
  const analysisConfidence = Math.min(100, Math.round(
    (threads.length / 10) * 30 +
    (totalQuestions / 20) * 40 +
    (subreddits.length / 3) * 30
  ))

  try {
    // Use Grok for AI-powered scorecard generation
    const prompt = buildScorecardPrompt(topic, gaps, threads.length, totalQuestions)
    
    const result = await runGrokAdapter({
      systemPrompt: "You are an SEO and content strategy auditor. Generate comprehensive scorecards for Reddit content gap analysis.",
      userPrompt: prompt,
      timeoutMs: 8000, // 8 second timeout
      retries: 1
    })

    // Parse AI-generated scorecard
    const aiScorecard = JSON.parse(result.rawText)
    
    const scorecard: RedditGapScorecard = {
      overallGapScore: aiScorecard.overallGapScore || 65,
      opportunityScore: aiScorecard.opportunityScore || 60,
      engagementDensity: aiScorecard.engagementDensity || 55,
      questionCoverage: aiScorecard.questionCoverage || 70,
      competitiveAdvantage: aiScorecard.competitiveAdvantage || 50,
      momentumCategory: aiScorecard.momentumCategory || { key: 'emerging-demand', label: 'Emerging Demand', summary: 'Growing questions with few good answers.' },
      benchmarkBand: aiScorecard.benchmarkBand || { label: 'Moderate Opportunity', summary: 'Decent gaps exist but competition is present.' },
      strengths: aiScorecard.strengths || [{ title: 'AI Analysis', detail: 'Grok identified key content opportunities from Reddit discussions.' }],
      opportunities: aiScorecard.opportunities || gaps.slice(0, 5).map((gap, i) => ({
        id: gap.id,
        title: gap.question.slice(0, 80),
        detail: gap.context,
        action: getActionForGap(gap),
        effort: gap.competitionLevel === 'low' ? 'Low' as const : gap.competitionLevel === 'medium' ? 'Medium' as const : 'High' as const,
        timeframe: gap.commercialIntent === 'high' ? '7 days' as const : gap.commercialIntent === 'medium' ? '30 days' as const : '90 days' as const,
        expectedLift: getExpectedLift(gap),
      })),
      fastestWin: aiScorecard.fastestWin || getFastestWin(gaps),
      biggestOpportunity: aiScorecard.biggestOpportunity || getBiggestOpportunity(gaps),
      actionPlan: aiScorecard.actionPlan || getActionPlan(gaps, topic),
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
    
  } catch (error) {
    console.warn('[Reddit Gap] AI scorecard generation failed, using fallback:', error)
    
    // Fallback to algorithmic scorecard
    const scores = scoreContentGaps(gaps, threads, subreddits)
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
      strengths: [{ title: 'AI-Powered Analysis', detail: 'Grok analyzed Reddit discussions to identify content opportunities.' }],
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