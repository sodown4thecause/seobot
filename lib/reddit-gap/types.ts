export interface RedditGapDetectPayload {
  action: 'detect'
  topic: string
  url?: string
}

export interface RedditGapRunPayload {
  action: 'run'
  topic: string
  url?: string
  email: string
  confirmedSubreddits: string[]
}

export type RedditGapRequestPayload = RedditGapDetectPayload | RedditGapRunPayload

export interface ContentGap {
  id: string
  question: string
  context: string
  engagementScore: number
  frequency: number
  commercialIntent: 'high' | 'medium' | 'low'
  competitionLevel: 'low' | 'medium' | 'high'
  sourceThreads: Array<{
    title: string
    subreddit: string
    url: string
    score: number
    numComments: number
    createdUtc: number
  }>
  recommendedContentType: 'blog_post' | 'guide' | 'faq' | 'comparison' | 'tutorial'
  estimatedSearchVolume: 'high' | 'medium' | 'low'
}

export interface SubredditDiscovery {
  name: string
  displayName: string
  description: string
  subscribers: number
  activeUsers: number
  relevanceScore: number
  postCount: number
}

export interface ThreadAnalysisComment {
  id: string
  author: string
  body: string
  score: number
  createdUtc: number
  parentId: string
  isSubmitter: boolean
  replies: ThreadAnalysisComment[]
}

export interface ThreadAnalysis {
  postId: string
  title: string
  selftext: string
  subreddit: string
  score: number
  numComments: number
  commentCount?: number
  upvoteRatio: number
  createdUtc: number
  url: string
  questions: Array<{
    question: string
    context: string
    upvotes: number
    source: string
    sourceUrl: string
  }>
  scrapedContent: string
  comments?: ThreadAnalysisComment[]
}

export interface RedditGapResults {
  topic: string
  url: string | null
  discoveredSubreddits: SubredditDiscovery[]
  analyzedThreads: number
  contentGaps: ContentGap[]
  totalQuestionsFound: number
  analysisConfidence: number
  topGapPreview: ContentGap | null
  scorecard: RedditGapScorecard
}

export interface RedditGapScorecard {
  overallGapScore: number
  opportunityScore: number
  engagementDensity: number
  questionCoverage: number
  competitiveAdvantage: number
  momentumCategory: GapMomentumCategory
  benchmarkBand: GapBenchmarkBand
  strengths: Array<{ title: string; detail: string }>
  opportunities: Array<RedditGapOpportunity>
  fastestWin: RedditGapOpportunity
  biggestOpportunity: RedditGapOpportunity
  actionPlan: {
    next7Days: string[]
    next30Days: string[]
    next90Days: string[]
  }
}

export type GapMomentumCategoryKey =
  | 'ripe-opportunity'
  | 'emerging-demand'
  | 'contested-space'
  | 'niche-access'
  | 'saturated-market'

export interface GapMomentumCategory {
  key: GapMomentumCategoryKey
  label: string
  summary: string
}

export interface GapBenchmarkBand {
  label: string
  summary: string
}

export interface RedditGapOpportunity {
  id: string
  title: string
  detail: string
  action: string
  effort: 'Low' | 'Medium' | 'High'
  timeframe: '7 days' | '30 days' | '90 days'
  expectedLift: string
}

export interface RedditGapResponsePayload {
  ok: boolean
  stage: 'detected' | 'completed'
  detected?: SubredditDiscovery[]
  detectionMeta?: {
    source: 'searched' | 'fallback'
    fallbackReason?: string
  }
  message?: string
  results?: RedditGapResults
  auditId?: string
  completedAt?: string
}

export type RedditGapConversionEvent = 'strategy-call' | 'full-report'

export interface RedditGapConvertPayload {
  auditId: string
  event: RedditGapConversionEvent
}