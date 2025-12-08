/**
 * Research Agent - Conducts topic research using Perplexity
 */

import { perplexity } from '@ai-sdk/perplexity'
import { generateText } from 'ai'
import { serverEnv } from '@/lib/config/env'
import { withAgentRetry } from '@/lib/errors/retry'
import { ProviderError } from '@/lib/errors/types'
import { logAgentExecution } from '@/lib/errors/logger'
import { createTelemetryConfig } from '@/lib/observability/langfuse'

export interface ResearchParams {
  topic: string
  depth?: 'quick' | 'standard' | 'deep'
  langfuseTraceId?: string // For grouping spans under a parent trace
  sessionId?: string // For Langfuse session tracking
}

export interface ResearchResult {
  summary: string
  keyPoints: string[]
  sources: string[]
  insights: string
}

export class ResearchAgent {
  /**
   * Research a topic using Perplexity
   */
  async research(params: ResearchParams & { userId?: string; requestId?: string }): Promise<ResearchResult> {
    console.log('[Research Agent] Researching:', params.topic)

    const prompt = `Research the topic: "${params.topic}"

Provide:
1. A comprehensive summary
2. Key points and insights
3. Current trends and developments
4. Relevant statistics and data
5. Expert perspectives

Focus on information that would be valuable for creating SEO/AEO optimized content.`

    return logAgentExecution(
      'research-agent',
      async () => {
        return withAgentRetry(
          async () => {
            const { text } = await generateText({
              model: perplexity('sonar-pro'),
              prompt,
              temperature: 0.3, // Lower temperature for factual research
              experimental_telemetry: createTelemetryConfig('research-agent', {
                userId: params.userId,
                sessionId: params.sessionId,
                langfuseTraceId: params.langfuseTraceId,
                topic: params.topic,
                depth: params.depth || 'standard',
                provider: 'perplexity',
                model: 'sonar-pro',
                requestId: params.requestId,
              }),
            })

            // Parse the response
            const result = this.parseResearchResponse(text)

            console.log('[Research Agent] ✓ Research complete')
            return result
          },
          {
            retries: 2,
            agent: 'research-agent',
            provider: 'perplexity',
            onRetry: (error, attempt, delay) => {
              console.warn(
                `[Research Agent] Retry attempt ${attempt} after ${delay}ms:`,
                error.message
              )
            },
          }
        )
      },
      {
        provider: 'perplexity',
        requestId: params.requestId,
        userId: params.userId,
        metadata: {
          topic: params.topic,
          depth: params.depth || 'standard',
        },
      }
    ).catch((error) => {
      // Convert to ProviderError if needed
      if (!(error instanceof ProviderError)) {
        throw new ProviderError(
          error instanceof Error ? error.message : 'Research failed',
          'perplexity',
          {
            requestId: params.requestId,
            agent: 'research-agent',
            cause: error instanceof Error ? error : undefined,
          }
        )
      }
      throw error
    })
  }

  private parseResearchResponse(text: string): ResearchResult {
    // Basic parsing - in production, you'd want more sophisticated parsing
    const lines = text.split('\n').filter(line => line.trim())
    
    return {
      summary: text.substring(0, 500), // First 500 chars as summary
      keyPoints: lines.filter(line => line.match(/^[\d\-\*]/)).slice(0, 10),
      sources: [], // Perplexity includes sources in citations
      insights: text,
    }
  }
}














