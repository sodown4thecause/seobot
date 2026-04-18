'use client'

import type { RedditGapResults } from '@/lib/reddit-gap/types'
import { ContentGapList } from './ContentGapList'

interface RedditGapResultsProps {
  audit: {
    id: string
    topic: string
    url: string | null
    contentGaps: unknown
    scorecard: unknown
    discoveredSubreddits: unknown
    threadCount: number | null
    totalQuestionsFound: number | null
    analysisConfidence: number | null
    overallGapScore: number | null
    createdAt: Date
  }
}

export function RedditGapResults({ audit }: RedditGapResultsProps) {
  const results: RedditGapResults = {
    topic: audit.topic,
    url: audit.url,
    discoveredSubreddits: (audit.discoveredSubreddits as RedditGapResults['discoveredSubreddits']) || [],
    analyzedThreads: audit.threadCount || 0,
    contentGaps: (audit.contentGaps as RedditGapResults['contentGaps']) || [],
    totalQuestionsFound: audit.totalQuestionsFound || 0,
    analysisConfidence: audit.analysisConfidence || 0,
    topGapPreview: ((audit.contentGaps as RedditGapResults['contentGaps']) || [])[0] || null,
    scorecard: (audit.scorecard as RedditGapResults['scorecard']) || {
      overallGapScore: audit.overallGapScore,
      opportunityScore: 0,
      engagementDensity: 0,
      questionCoverage: 0,
      competitiveAdvantage: 0,
      momentumCategory: { key: 'emerging-demand' as const, label: 'Emerging Demand', summary: '' },
      benchmarkBand: { label: '', summary: '' },
      strengths: [],
      opportunities: [],
      fastestWin: { id: 'gap-1', title: '', detail: '', action: '', effort: 'Low' as const, timeframe: '7 days' as const, expectedLift: '' },
      biggestOpportunity: { id: 'gap-1', title: '', detail: '', action: '', effort: 'Medium' as const, timeframe: '30 days' as const, expectedLift: '' },
      actionPlan: { next7Days: [], next30Days: [], next90Days: [] },
    },
  }

  return <ContentGapList results={results} auditId={audit.id} />
}