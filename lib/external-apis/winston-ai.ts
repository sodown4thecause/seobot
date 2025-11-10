/**
 * Winston AI Integration
 * 
 * Provides plagiarism detection and content originality checking
 * to ensure SEO-friendly, unique content generation.
 * 
 * Features:
 * - Real-time plagiarism detection
 * - Multilingual support
 * - Detailed duplicate source reporting
 * - AI content detection
 * 
 * API Docs: https://gowinston.ai/api-documentation/
 */

import { serverEnv } from '@/lib/config/env'

const WINSTON_API_BASE = 'https://api.gowinston.ai/v1'

export interface WinstonPlagiarismResult {
  score: number // 0-100, higher = more plagiarism detected
  isPlagiarized: boolean
  sources: Array<{
    url: string
    title: string
    matchPercentage: number
    snippet: string
  }>
  aiGenerated?: {
    score: number // 0-100, higher = more likely AI-generated
    isAiGenerated: boolean
  }
}

export interface WinstonCheckOptions {
  text: string
  language?: string // Default: 'en'
  checkAiContent?: boolean // Also check if content is AI-generated
}

/**
 * Check content for plagiarism using Winston AI
 */
export async function checkPlagiarism(
  options: WinstonCheckOptions
): Promise<WinstonPlagiarismResult> {
  const { text, language = 'en', checkAiContent = true } = options

  if (!text || text.trim().length === 0) {
    throw new Error('Text content is required for plagiarism check')
  }

  try {
    const response = await fetch(`${WINSTON_API_BASE}/plagiarism`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverEnv.WINSTON_AI_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        language,
        check_ai: checkAiContent,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Winston AI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // Transform API response to our interface
    return {
      score: data.plagiarism_score || 0,
      isPlagiarized: (data.plagiarism_score || 0) > 20, // >20% considered plagiarized
      sources: (data.sources || []).map((source: any) => ({
        url: source.url,
        title: source.title || source.url,
        matchPercentage: source.match_percentage || 0,
        snippet: source.snippet || '',
      })),
      aiGenerated: checkAiContent ? {
        score: data.ai_score || 0,
        isAiGenerated: (data.ai_score || 0) > 80, // >80% considered AI-generated
      } : undefined,
    }
  } catch (error) {
    console.error('[Winston AI] Plagiarism check failed:', error)
    throw error
  }
}

/**
 * Batch check multiple content pieces for plagiarism
 */
export async function batchCheckPlagiarism(
  contents: Array<{ id: string; text: string; language?: string }>
): Promise<Array<{ id: string; result: WinstonPlagiarismResult }>> {
  const results = await Promise.all(
    contents.map(async (content) => {
      try {
        const result = await checkPlagiarism({
          text: content.text,
          language: content.language,
        })
        return { id: content.id, result }
      } catch (error) {
        console.error(`[Winston AI] Failed to check content ${content.id}:`, error)
        // Return a default result on error
        return {
          id: content.id,
          result: {
            score: 0,
            isPlagiarized: false,
            sources: [],
          },
        }
      }
    })
  )

  return results
}

/**
 * Check if content is AI-generated
 */
export async function checkAiContent(text: string): Promise<{
  score: number
  isAiGenerated: boolean
  confidence: 'low' | 'medium' | 'high'
}> {
  try {
    const response = await fetch(`${WINSTON_API_BASE}/ai-detection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverEnv.WINSTON_AI_API_KEY}`,
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Winston AI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const score = data.ai_score || 0

    return {
      score,
      isAiGenerated: score > 80,
      confidence: score > 90 ? 'high' : score > 70 ? 'medium' : 'low',
    }
  } catch (error) {
    console.error('[Winston AI] AI detection failed:', error)
    throw error
  }
}

/**
 * Validate content for SEO compliance
 * Checks both plagiarism and AI detection
 */
export async function validateContentForSEO(text: string): Promise<{
  isValid: boolean
  plagiarismScore: number
  aiScore: number
  issues: string[]
  recommendations: string[]
}> {
  const result = await checkPlagiarism({ text, checkAiContent: true })

  const issues: string[] = []
  const recommendations: string[] = []

  if (result.isPlagiarized) {
    issues.push(`High plagiarism detected (${result.score}%)`)
    recommendations.push('Rewrite content to ensure originality')
    
    if (result.sources.length > 0) {
      recommendations.push(`Review and cite sources: ${result.sources.slice(0, 3).map(s => s.url).join(', ')}`)
    }
  }

  if (result.aiGenerated?.isAiGenerated) {
    issues.push(`Content appears AI-generated (${result.aiGenerated.score}% confidence)`)
    recommendations.push('Add human touch: personal insights, examples, or expert opinions')
    recommendations.push('Vary sentence structure and add unique perspectives')
  }

  return {
    isValid: issues.length === 0,
    plagiarismScore: result.score,
    aiScore: result.aiGenerated?.score || 0,
    issues,
    recommendations,
  }
}

