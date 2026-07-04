import type { UIMessage } from 'ai'
import type { GenerativeUiComponent } from './harness-contracts'
import type { KeywordMetric } from '@/components/chat/generative-ui/keyword-metrics'
import type { SerpResultsProps } from '@/components/chat/generative-ui/serp-results'
import type { DomainAnalyticsData } from '@/components/chat/generative-ui/domain-analytics'
import type { AIPlatformData } from '@/components/chat/generative-ui/ai-platform-metrics'
import type { AISearchAnalysis } from '@/lib/ai/ai-search-optimizer'
import type { ContentGapAnalysis } from '@/lib/ai/content-gap-analyzer'
import type { ContentStrategyData } from '@/components/chat/generative-ui/content-strategy'
import type { CitationRecommendationsData } from '@/components/chat/generative-ui/citation-recommendations'
import type { DomainKeywordProfile } from '@/lib/ai/domain-keyword-profiler'

export type SeobotMetadata = {
  mode?: 'seo' | 'geo' | 'content'
  conversationId?: string
  model?: string
  totalTokens?: number
  createdAt?: number
}

export type SeobotDataParts = {
  KeywordMetrics: {
    keywords: KeywordMetric[]
    title?: string
    status?: 'loading' | 'success' | 'error'
    toolCallId?: string
  }
  SerpResults: SerpResultsProps & { status?: 'loading' | 'success' | 'error'; toolCallId?: string }
  DomainAnalytics: { data: DomainAnalyticsData; status?: 'loading' | 'success' | 'error'; toolCallId?: string }
  AIPlatformMetrics: { data: AIPlatformData; status?: 'loading' | 'success' | 'error'; toolCallId?: string }
  AISearchMetrics: {
    analysis: AISearchAnalysis
    status?: 'loading' | 'success' | 'error'
    toolCallId?: string
  }
  ContentStrategy: { data: ContentStrategyData; status?: 'loading' | 'success' | 'error'; toolCallId?: string }
  CitationRecommendations: {
    data: CitationRecommendationsData
    status?: 'loading' | 'success' | 'error'
    toolCallId?: string
  }
  DomainKeywordProfile: {
    profile: DomainKeywordProfile
    status?: 'loading' | 'success' | 'error'
    toolCallId?: string
  }
  ContentGapMatrix: {
    analysis: ContentGapAnalysis
    status?: 'loading' | 'success' | 'error'
    toolCallId?: string
  }
  Status: {
    message: string
    level: 'info' | 'warning' | 'error'
    toolName?: string
  }
}

export type SeobotUIMessage = UIMessage<SeobotMetadata, SeobotDataParts>

export type SeobotDataPartType = `data-${GenerativeUiComponent}` | 'data-Status'

export function dataPartType(component: GenerativeUiComponent | 'Status'): SeobotDataPartType {
  return component === 'Status' ? 'data-Status' : `data-${component}`
}
