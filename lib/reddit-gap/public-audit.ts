import { redditGapAudits } from '@/lib/db/schema'

export const publicRedditGapAuditSelection = {
  id: redditGapAudits.id,
  topic: redditGapAudits.topic,
  url: redditGapAudits.url,
  contentGaps: redditGapAudits.contentGaps,
  scorecard: redditGapAudits.scorecard,
  discoveredSubreddits: redditGapAudits.discoveredSubreddits,
  threadCount: redditGapAudits.threadCount,
  totalQuestionsFound: redditGapAudits.totalQuestionsFound,
  analysisConfidence: redditGapAudits.analysisConfidence,
  overallGapScore: redditGapAudits.overallGapScore,
  createdAt: redditGapAudits.createdAt,
} as const
