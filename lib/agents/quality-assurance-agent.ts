/**
 * Quality Assurance Agent - Reviews and improves content quality
 */

import { analyzeContent } from '@/lib/mcp/winston-client'
import { humanizeContent } from '@/lib/external-apis/rytr'
import { storeContentLearning } from '@/lib/ai/learning-storage'

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
}

export class QualityAssuranceAgent {
  private readonly MAX_ITERATIONS = 3
  private readonly TARGET_AI_SCORE = 30 // Target < 30% AI detection

  /**
   * Review and iteratively improve content quality
   */
  async reviewAndImprove(params: QAReviewParams): Promise<QAReviewResult> {
    console.log('[QA Agent] Starting quality review for:', params.topic)

    let currentContent = params.content
    let iterations = 0
    let bestScore = 100
    let bestContent = currentContent
    let lastAnalysis: any = null

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

      // Step 2: Improve with Rytr if needed
      if (iterations < this.MAX_ITERATIONS) {
        console.log('[QA Agent] Improving content with Rytr...')
        try {
          const improved = await humanizeContent({
            content: currentContent,
            strategy: 'improve',
          })
          currentContent = improved.content
        } catch (error) {
          console.warn('[QA Agent] Rytr improvement failed:', error)
          // Continue with current content
          break
        }
      }
    }

    // Store learning for future content (global learning loop)
    if (params.userId) {
      try {
        await storeContentLearning({
          userId: params.userId,
          contentType: params.contentType,
          topic: params.topic,
          keywords: params.keywords,
          aiDetectionScore: bestScore,
          humanProbability: 100 - bestScore,
          successful: bestScore <= this.TARGET_AI_SCORE,
          techniques: this.extractTechniques(bestContent),
          feedback: lastAnalysis?.feedback || null,
        })
      } catch (error) {
        console.error('[QA Agent] Failed to store learning:', error)
        // Non-blocking - continue
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

