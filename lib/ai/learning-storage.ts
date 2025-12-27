/**
 * Learning Storage - Stores and retrieves content generation learnings
 * Implements global learning loop across all users
 * 
 * Uses Neon PostgreSQL with Drizzle ORM
 */

import { db } from '@/lib/db'
import { contentLearnings } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

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
    await db.insert(contentLearnings).values({
      userId: learning.userId,
      contentType: learning.contentType,
      topic: learning.topic,
      aiDetectionScore: learning.aiDetectionScore,
      techniquesUsed: learning.techniques,
      metadata: {
        keywords: learning.keywords,
        humanProbability: learning.humanProbability,
        successful: learning.successful,
        feedback: learning.feedback,
      },
    })

    console.log('[Learning Storage] Learning stored')
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
    // Match by topic using ILIKE
    const topicPattern = `%${topic.replace('%', '\\%').replace('_', '\\_')}%`

    const results = await db.execute(sql`
      SELECT 
        user_id,
        topic,
        ai_detection_score,
        techniques_used,
        metadata,
        created_at
      FROM content_learnings
      WHERE content_type = ${contentType}
        AND (metadata->>'successful')::boolean = true
        AND topic ILIKE ${topicPattern}
      ORDER BY ai_detection_score ASC
      LIMIT ${limit}
    `)

    console.log(`[Learning Storage] Retrieved ${results.rows?.length || 0} cross-user learnings for: ${topic}`)
    return (results.rows as any[]) || []
  } catch (error) {
    console.error('[Learning Storage] Failed to retrieve learnings:', error)
    return []
  }
}

export async function getRecentHighScores(
  contentType: string,
  threshold: number = 90,
  limit: number = 5
): Promise<any[]> {
  try {
    const results = await db.execute(sql`
      SELECT 
        topic,
        techniques_used,
        ai_detection_score,
        created_at
      FROM content_learnings
      WHERE content_type = ${contentType}
        AND ai_detection_score >= ${threshold}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `)

    return (results.rows as any[]) || []
  } catch (error) {
    console.error('[Learning Storage] Failed to fetch high scores:', error)
    return []
  }
}

/**
 * Get aggregated best practices for a content type
 */
export async function getBestPractices(contentType: string): Promise<any[]> {
  try {
    // Aggregate successful learnings to derive best practices
    const results = await db.execute(sql`
      WITH technique_stats AS (
        SELECT 
          unnest(techniques_used) as technique,
          COUNT(*) as usage_count,
          AVG(ai_detection_score) as avg_score
        FROM content_learnings
        WHERE content_type = ${contentType}
          AND (metadata->>'successful')::boolean = true
          AND techniques_used IS NOT NULL
        GROUP BY unnest(techniques_used)
      )
      SELECT 
        technique as techniques,
        usage_count,
        ROUND(avg_score::numeric, 1) as avg_ai_score,
        ROUND((usage_count::float / (SELECT COUNT(*) FROM content_learnings WHERE content_type = ${contentType}))::numeric, 2) as success_rate
      FROM technique_stats
      ORDER BY avg_score ASC, usage_count DESC
      LIMIT 5
    `)

    return (results.rows as any[]) || []
  } catch (error) {
    console.error('[Learning Storage] Failed to retrieve best practices:', error)
    return []
  }
}

/**
 * REAL-TIME GLOBAL LEARNING: Aggregation is done on-the-fly with SQL
 * No separate aggregation needed since we use dynamic queries
 */
export async function triggerRealTimeLearning(contentType: string): Promise<void> {
  console.log('[Learning Storage] Real-time learning aggregation for:', contentType)
  // Best practices are now calculated dynamically via getBestPractices
  // No separate aggregation step needed
}

/**
 * Store learning and immediately update global best practices
 * This ensures real-time cross-user learning
 */
export async function storeAndLearn(learning: ContentLearning): Promise<void> {
  // Store the individual learning
  await storeContentLearning(learning)
  
  // If this was successful, log it
  if (learning.successful) {
    console.log('[Learning Storage] Successful learning detected - available for global knowledge base')
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
    const results = await db.execute(sql`
      WITH stats AS (
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE (metadata->>'successful')::boolean = true)::int as successful,
          COUNT(DISTINCT user_id)::int as unique_users,
          ROUND(AVG(ai_detection_score) FILTER (WHERE (metadata->>'successful')::boolean = true)::numeric, 1) as avg_score
        FROM content_learnings
        WHERE content_type = ${contentType}
      ),
      technique_stats AS (
        SELECT 
          unnest(techniques_used) as technique,
          COUNT(*) as usage,
          ROUND(AVG(ai_detection_score)::numeric, 1) as avg_score
        FROM content_learnings
        WHERE content_type = ${contentType}
          AND (metadata->>'successful')::boolean = true
          AND techniques_used IS NOT NULL
        GROUP BY unnest(techniques_used)
        ORDER BY COUNT(*) DESC
        LIMIT 10
      )
      SELECT 
        (SELECT total FROM stats) as total_learnings,
        (SELECT successful FROM stats) as successful_learnings,
        (SELECT unique_users FROM stats) as unique_users,
        (SELECT avg_score FROM stats) as avg_ai_score,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object(
            'technique', technique,
            'usage', usage,
            'avgScore', avg_score
          )) FROM technique_stats),
          '[]'::jsonb
        ) as top_techniques
    `)

    const row = (results.rows as any[])?.[0]
    
    if (!row) {
      return {
        totalLearnings: 0,
        successfulLearnings: 0,
        uniqueUsers: 0,
        avgAiScore: 0,
        topTechniques: []
      }
    }

    console.log(`[Learning Storage] Cross-user insights: ${row.unique_users} users, ${row.successful_learnings}/${row.total_learnings} successful`)

    return {
      totalLearnings: row.total_learnings || 0,
      successfulLearnings: row.successful_learnings || 0,
      uniqueUsers: row.unique_users || 0,
      avgAiScore: parseFloat(row.avg_ai_score) || 0,
      topTechniques: row.top_techniques || []
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
