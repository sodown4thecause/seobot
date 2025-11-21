/**
 * Learning Storage - Stores and retrieves content generation learnings
 * Implements global learning loop across all users
 */

import { createClient } from '@/lib/supabase/server'

export interface ContentLearning {
  userId: string
  contentType: string
  topic: string
  keywords: string[]
  aiDetectionScore: number
  humanProbability: number
  successful: boolean
  techniques: string[]
  feedback: string | null
}

/**
 * Store a content learning for future reference
 */
export async function storeContentLearning(learning: ContentLearning): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('content_learnings').insert({
      user_id: learning.userId,
      content_type: learning.contentType,
      topic: learning.topic,
      keywords: learning.keywords,
      ai_detection_score: learning.aiDetectionScore,
      human_probability: learning.humanProbability,
      successful: learning.successful,
      techniques_used: learning.techniques,
      feedback: learning.feedback,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[Learning Storage] Error storing learning:', {
        error,
        userId: learning.userId,
        contentType: learning.contentType,
        topic: learning.topic
      })
      throw error
    }

    console.log('[Learning Storage] ✓ Learning stored')
  } catch (error) {
    console.error('[Learning Storage] Failed to store learning:', error)
    throw error
  }
}

/**
 * Retrieve similar successful learnings for a topic
 */
export async function retrieveSimilarLearnings(
  topic: string,
  contentType: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('content_learnings')
      .select('*')
      .eq('content_type', contentType)
      .eq('successful', true)
      .ilike('topic', `%${topic}%`)
      .order('ai_detection_score', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[Learning Storage] Error retrieving learnings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Learning Storage] Failed to retrieve learnings:', error)
    return []
  }
}

/**
 * Get aggregated best practices for a content type
 */
export async function getBestPractices(contentType: string): Promise<any[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('content_best_practices')
      .select('*')
      .eq('content_type', contentType)
      .order('success_rate', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[Learning Storage] Error retrieving best practices:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Learning Storage] Failed to retrieve best practices:', error)
    return []
  }
}

/**
 * Aggregate individual learnings into best practices
 * Should be run periodically (e.g., daily cron job)
 */
export async function aggregateBestPractices(contentType: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Get successful learnings
    const { data: learnings, error: fetchError } = await supabase
      .from('content_learnings')
      .select('*')
      .eq('content_type', contentType)
      .eq('successful', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (fetchError || !learnings || learnings.length === 0) {
      console.log('[Learning Storage] No learnings to aggregate for:', contentType)
      return
    }

    // Aggregate techniques
    const techniqueCount: Record<string, number> = {}
    const techniqueScores: Record<string, number[]> = {}

    learnings.forEach((learning) => {
      learning.techniques_used?.forEach((technique: string) => {
        techniqueCount[technique] = (techniqueCount[technique] || 0) + 1
        if (!techniqueScores[technique]) {
          techniqueScores[technique] = []
        }
        techniqueScores[technique].push(learning.ai_detection_score)
      })
    })

    // Calculate best practices
    const bestPractices = Object.entries(techniqueCount)
      .map(([technique, count]) => {
        const scores = techniqueScores[technique]
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
        return {
          technique,
          usage_count: count,
          avg_ai_score: avgScore,
          success_rate: count / learnings.length,
        }
      })
      .sort((a, b) => a.avg_ai_score - b.avg_ai_score)
      .slice(0, 10)

    // Upsert best practices
    const { error: upsertError } = await supabase
      .from('content_best_practices')
      .upsert({
        content_type: contentType,
        techniques: bestPractices.map(bp => bp.technique),
        success_rate: bestPractices[0]?.success_rate || 0,
        avg_ai_score: bestPractices[0]?.avg_ai_score || 0,
        sample_size: learnings.length,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'content_type',
      })

    if (upsertError) {
      console.error('[Learning Storage] Error upserting best practice:', {
        error: upsertError,
        contentType
      })
      return
    }

    console.log('[Learning Storage] ✓ Best practices aggregated for:', contentType)
  } catch (error) {
    console.error('[Learning Storage] Failed to aggregate best practices:', error)
  }
}









