/**
 * Quality Assurance Agent - Reviews and improves content quality
 */

import { analyzeContent } from '@/lib/mcp/winston-client'
import { humanizeContent } from '@/lib/external-apis/humanization-service'
import { retrieveAgentDocuments } from '@/lib/ai/content-rag'

export interface QAReviewParams {
  content: string
  contentType: string
  topic: string
  keywords: string[]
  userId?: string
}

export interface QAReviewResult {
  content: string
  metadata: {
    aiDetectionScore: number
    humanProbability: number
    seoScore: number
    iterations: number
  }
  suggestions: string[]
  techniques: string[]
}

export class QualityAssuranceAgent {
  private readonly MAX_ITERATIONS = 5 // Increased from 3 for better humanization
  private readonly TARGET_AI_SCORE = 25 // Tightened from 30% for production quality

  /**
   * Review and iteratively improve content quality
   */
  async reviewAndImprove(params: QAReviewParams): Promise<QAReviewResult> {
    console.log('[QA Agent] Starting quality review for:', params.topic)
    console.log('[QA Agent] Initial content length:', params.content?.length ?? 0)

    // Pre-fetch anti-AI detection guidance
    let avoidanceGuidance = '';
    try {
      // Specifically search for "AI Detection Avoidance" document
      const docs = await retrieveAgentDocuments('AI Detection Avoidance Banned Words', 'content_writer', 1);
      if (docs && docs.length > 0) {
        avoidanceGuidance = docs[0].content;
        console.log('[QA Agent] ✓ Retrieved anti-AI detection guidance');
      }
    } catch (error) {
      console.warn('[QA Agent] Failed to retrieve avoidance guidance:', error);
    }

    let currentContent = params.content
    let iterations = 0
    let bestScore = 100
    let bestContent = currentContent
    let lastAnalysis: any = null
    let rytrImproved = false
    let rytrAttempted = false

    while (iterations < this.MAX_ITERATIONS) {
      iterations++
      console.log(`[QA Agent] Iteration ${iterations}/${this.MAX_ITERATIONS}`)

      // Step 1: Analyze with Winston AI
      const analysis = await analyzeContent(currentContent)
      lastAnalysis = analysis
      const aiScore = analysis.score || 100
      const humanProb = 100 - aiScore

      console.log(`[QA Agent] AI Detection Score: ${aiScore}%`)
      console.log(`[QA Agent] Human Probability: ${humanProb}%`)

      // Track best version
      if (aiScore < bestScore) {
        bestScore = aiScore
        bestContent = currentContent
      }

      // If we've met the target, we're done
      if (aiScore <= this.TARGET_AI_SCORE) {
        console.log('[QA Agent] ✓ Target AI score achieved')
        break
      }

      // Step 2: Humanize content with multi-provider fallback
      if (iterations < this.MAX_ITERATIONS) {
        if (!currentContent || currentContent.trim().length === 0) {
          console.warn('[QA Agent] Skipping humanization – empty content')
          break
        }

        console.log('[QA Agent] Current content length before humanization:', currentContent.length)
        console.log('[QA Agent] Humanizing content (multi-provider)...')
        try {
          const result = await humanizeContent({
            content: currentContent,
            userId: params.userId,
            disableRytr: rytrAttempted,
            guidance: avoidanceGuidance, // Pass the RAG-retrieved guidance
          })

          if (!result.content || result.content.trim().length === 0) {
            console.warn('[QA Agent] Humanization returned empty content – keeping original draft')
          } else {
            console.log(`[QA Agent] ✓ Humanization successful using: ${result.provider}`)
            currentContent = result.content
            rytrImproved = true // Keep this flag for analytics (even if not Rytr)
            if (!rytrAttempted) {
              rytrAttempted = true
            }
          }
        } catch (error) {
          console.warn('[QA Agent] Humanization failed:', error)
          // Continue with current content
          break
        }
      }
    }

    console.log(`[QA Agent] ✓ Review complete after ${iterations} iterations`)

    return {
      content: bestContent,
      metadata: {
        aiDetectionScore: bestScore,
        humanProbability: 100 - bestScore,
        seoScore: 0, // TODO: Add SEO scoring
        iterations,
      },
      suggestions: this.generateSuggestions(bestScore, iterations),
      techniques: this.extractTechniques(bestContent),
    }
  }

  private extractTechniques(content: string): string[] {
    const techniques: string[] = []
    
    // Analyze content for techniques used
    if (content.match(/\b(I|we|my|our)\b/gi)) {
      techniques.push('first_person_perspective')
    }
    if (content.match(/\?/g)?.length || 0 > 2) {
      techniques.push('rhetorical_questions')
    }
    if (content.match(/for example|such as|like/gi)) {
      techniques.push('concrete_examples')
    }
    if (content.match(/\d+%|\$\d+/g)) {
      techniques.push('specific_data_points')
    }
    
    return techniques
  }

  private generateSuggestions(score: number, iterations: number): string[] {
    const suggestions: string[] = []

    if (score > 30) {
      suggestions.push('Content still reads as AI-generated. Consider adding more personal insights and varied sentence structures.')
    }
    if (score > 50) {
      suggestions.push('High AI detection score. Add more unique perspectives and real-world examples.')
    }
    if (iterations >= this.MAX_ITERATIONS) {
      suggestions.push('Maximum iterations reached. Manual review recommended.')
    }

    return suggestions
  }
}

