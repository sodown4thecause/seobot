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
      content_sample: learning.feedback || learning.topic,
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
 * GLOBAL LEARNING: Retrieves learnings from ALL users to benefit everyone
 */
export async function retrieveSimilarLearnings(
  topic: string,
  contentType: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const supabase = await createClient()

    // Match by topic using ILIKE; keyword matching can be added later with safer filters
    const topicPattern = `%${topic.replace('%', '\\%').replace('_', '\\_')}%`

    const { data, error } = await supabase
      .from('content_learnings')
      .select('user_id, topic, keywords, ai_detection_score, human_probability, techniques_used, feedback, created_at')
      .eq('content_type', contentType)
      .eq('successful', true)
      .ilike('topic', topicPattern)
      .order('ai_detection_score', { ascending: true }) // Best scores first
      .limit(limit)

    if (error) {
      console.error('[Learning Storage] Error retrieving learnings:', error)
      return []
    }

    console.log(`[Learning Storage] Retrieved ${data?.length || 0} cross-user learnings for: ${topic}`)
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

/**
 * REAL-TIME GLOBAL LEARNING: Update best practices immediately after each learning
 * This ensures all users benefit from the latest successful techniques instantly
 */
export async function triggerRealTimeLearning(contentType: string): Promise<void> {
  try {
    console.log('[Learning Storage] 🔄 Triggering real-time learning aggregation for:', contentType)
    await aggregateBestPractices(contentType)
    
    // Also aggregate related content types to improve cross-pollination
    if (contentType === 'blog_post') {
      await aggregateBestPractices('article') // Similar writing techniques
    } else if (contentType === 'article') {
      await aggregateBestPractices('blog_post')
    }
    
    console.log('[Learning Storage] ✓ Real-time learning complete')
  } catch (error) {
    console.error('[Learning Storage] Real-time learning failed:', error)
    // Don't throw - this shouldn't block content generation
  }
}

/**
 * Store learning and immediately update global best practices
 * This ensures real-time cross-user learning
 */
export async function storeAndLearn(learning: ContentLearning): Promise<void> {
  // Store the individual learning
  await storeContentLearning(learning)
  
  // If this was successful, immediately update best practices for all users
  if (learning.successful) {
    console.log('[Learning Storage] 🎯 Successful learning detected - updating global knowledge base')
    await triggerRealTimeLearning(learning.contentType)
  }
}

/**
 * Get cross-user learning insights for debugging and analytics
 */
export async function getCrossUserInsights(contentType: string): Promise<{
  totalLearnings: number
  successfulLearnings: number
  uniqueUsers: number
  avgAiScore: number
  topTechniques: Array<{ technique: string; usage: number; avgScore: number }>
}> {
  try {
    const supabase = await createClient()
    
    // Get all learnings for this content type across ALL users
    const { data: allLearnings, error } = await supabase
      .from('content_learnings')
      .select('user_id, ai_detection_score, successful, techniques_used')
      .eq('content_type', contentType)
    
    if (error || !allLearnings) {
      return {
        totalLearnings: 0,
        successfulLearnings: 0,
        uniqueUsers: 0,
        avgAiScore: 0,
        topTechniques: []
      }
    }
    
    const successful = allLearnings.filter(l => l.successful)
    const uniqueUsers = new Set(allLearnings.map(l => l.user_id)).size
    const avgAiScore = successful.length > 0 
      ? successful.reduce((sum, l) => sum + l.ai_detection_score, 0) / successful.length 
      : 0
    
    // Analyze technique usage across all users
    const techniqueStats: Record<string, { count: number; scores: number[] }> = {}
    successful.forEach(learning => {
      learning.techniques_used?.forEach((technique: string) => {
        if (!techniqueStats[technique]) {
          techniqueStats[technique] = { count: 0, scores: [] }
        }
        techniqueStats[technique].count++
        techniqueStats[technique].scores.push(learning.ai_detection_score)
      })
    })
    
    const topTechniques = Object.entries(techniqueStats)
      .map(([technique, stats]) => ({
        technique,
        usage: stats.count,
        avgScore: stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)
    
    console.log(`[Learning Storage] Cross-user insights: ${uniqueUsers} users, ${successful.length}/${allLearnings.length} successful`)
    
    return {
      totalLearnings: allLearnings.length,
      successfulLearnings: successful.length,
      uniqueUsers,
      avgAiScore,
      topTechniques
    }
  } catch (error) {
    console.error('[Learning Storage] Failed to get insights:', error)
    return {
      totalLearnings: 0,
      successfulLearnings: 0,
      uniqueUsers: 0,
      avgAiScore: 0,
      topTechniques: []
    }
  }
}


