/**
 * Research Agent - Conducts topic research using Perplexity
 */

import { perplexity } from '@ai-sdk/perplexity'
import { generateText } from 'ai'

export interface ResearchParams {
  topic: string
  depth?: 'quick' | 'standard' | 'deep'
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
  async research(params: ResearchParams): Promise<ResearchResult> {
    console.log('[Research Agent] Researching:', params.topic)

    const prompt = `Research the topic: "${params.topic}"

Provide:
1. A comprehensive summary
2. Key points and insights
3. Current trends and developments
4. Relevant statistics and data
5. Expert perspectives

Focus on information that would be valuable for creating SEO/AEO optimized content.`

    try {
      const { text } = await generateText({
        model: perplexity('sonar-pro'),
        prompt,
        temperature: 0.3, // Lower temperature for factual research
      })

      // Parse the response
      const result = this.parseResearchResponse(text)

      console.log('[Research Agent] ✓ Research complete')
      return result
    } catch (error) {
      console.error('[Research Agent] Research failed:', error)
      // Return empty result as fallback
      return {
        summary: `Research about ${params.topic}`,
        keyPoints: [],
        sources: [],
        insights: '',
      }
    }
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













