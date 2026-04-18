export { discoverSubreddits, analyzeThreads, identifyGaps, buildResults, runFullAnalysis } from './analyzer'
export { calculateEngagementScore, calculateGapFrequency, assessCommercialIntent, assessCompetitionLevel, recommendContentType, estimateSearchVolume, scoreContentGaps } from './scorer'
export { buildSubredditDiscoveryPrompt, buildGapAnalysisPrompt, buildScorecardPrompt } from './prompts'
export type {
  RedditGapDetectPayload,
  RedditGapRunPayload,
  RedditGapRequestPayload,
  ContentGap,
  SubredditDiscovery,
  ThreadAnalysis,
  ThreadAnalysisComment,
  RedditGapResults,
  RedditGapScorecard,
  RedditGapOpportunity,
  GapMomentumCategory,
  GapMomentumCategoryKey,
  GapBenchmarkBand,
  RedditGapResponsePayload,
  RedditGapConversionEvent,
  RedditGapConvertPayload,
} from './types'