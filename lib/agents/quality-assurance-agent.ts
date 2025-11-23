/**
 * Quality Assurance Agent - Reviews and improves content quality
 */

import { analyzeContent } from '@/lib/mcp/winston-client'
import { humanizeContent } from '@/lib/external-apis/humanization-service'
import { storeAndLearn, getCrossUserInsights } from '@/lib/ai/learning-storage'

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
    console.log('[QA Agent] Initial content length:', params.content?.length ?? 0)

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

    // GLOBAL LEARNING: Store and immediately share with all users
    if (params.userId) {
      try {
        const learning = {
          userId: params.userId,
          contentType: params.contentType,
          topic: params.topic,
          keywords: params.keywords,
          aiDetectionScore: bestScore,
          humanProbability: 100 - bestScore,
          successful: bestScore <= this.TARGET_AI_SCORE,
          techniques: this.extractTechniques(bestContent),
          feedback: lastAnalysis?.feedback || null,
        }

        // Only learn from runs where we actually improved content and achieved target AI score
        if (learning.successful && rytrImproved) {
          // Store learning and trigger real-time global knowledge update
          await storeAndLearn(learning)
        } else {
          console.log('[QA Agent] Skipping learning storage – unsuccessful or no Rytr improvement')
        }
        
        // Log cross-user learning insights
        const insights = await getCrossUserInsights(params.contentType)
        console.log(`[QA Agent] 🌍 Global learning: ${insights.uniqueUsers} users contributed, ${insights.successfulLearnings} successful patterns`)
        
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

