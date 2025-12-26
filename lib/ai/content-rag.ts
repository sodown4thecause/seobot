/**
 * Content RAG - Retrieval Augmented Generation for content writing
 * Combines cross-user learnings with uploaded expert documents
 * 
 * NOTE: Agent document retrieval is currently disabled pending Neon migration.
 * The vector search function requires the agent_documents table and
 * match_agent_documents_v2 PostgreSQL function to be set up in Neon.
 */

import {
  retrieveSimilarLearnings,
  getBestPractices,
  getCrossUserInsights,
  getRecentHighScores,
} from './learning-storage'

/**
 * Retrieve relevant agent documents
 * 
 * Uses writing_frameworks table with match_frameworks vector similarity search
 */
import { db, writingFrameworks } from '@/lib/db'
import { sql, gt, desc } from 'drizzle-orm'

export async function retrieveAgentDocuments(
  topic: string,
  agentType: string = 'content_writer',
  limit: number = 3
): Promise<any[]> {
  try {
    console.log(`[Content RAG] Retrieving agent docs for topic: "${topic}", type: ${agentType}, limit: ${limit}`)
    
    // Generate embedding for the topic
    const { generateEmbedding } = await import('@/lib/ai/embedding')
    const queryEmbedding = await generateEmbedding(topic)
    
    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn('[Content RAG] Failed to generate query embedding')
      return []
    }
    
    // Use the match_frameworks vector similarity search function
    // Match threshold of 0.3 means similarity >= 70%
    const embeddingString = `[${queryEmbedding.join(',')}]`
    
    // Define result row type for Neon query
    interface FrameworkRow {
      id: string
      name: string
      description: string | null
      category: string | null
      similarity: number
    }
    
    const results = await db.execute(sql`
      SELECT 
        wf.id,
        wf.name,
        wf.description,
        wf.category,
        1 - (wf.embedding <=> ${embeddingString}::vector) AS similarity
      FROM writing_frameworks wf
      WHERE 
        wf.embedding IS NOT NULL 
        AND 1 - (wf.embedding <=> ${embeddingString}::vector) > 0.3
      ORDER BY similarity DESC
      LIMIT ${limit}
    `)
    
    // Cast Neon query result to typed array
    const rows = results as unknown as FrameworkRow[]
    
    if (!rows || rows.length === 0) {
      console.log(`[Content RAG] No agent documents found for topic: "${topic}"`)
      return []
    }
    
    const documents = rows.map((row) => ({
      id: row.id,
      title: row.name,
      description: row.description,
      category: row.category,
      type: 'writing_framework',
      source: 'agent_knowledge_base'
    }))
    
    console.log(`[Content RAG] Retrieved ${documents.length} agent documents`)
    return documents
  } catch (error) {
    console.error('[Content RAG] Error retrieving agent documents:', error)
    return []
  }
}

/**
 * Get content writing guidance from cross-user learnings and uploaded docs
 */
export async function getContentGuidance(
  contentType: string,
  topic: string,
  keywords: string[]
): Promise<string> {
  try {
    console.log('[Content RAG] Retrieving guidance for:', contentType, topic)

    // Get similar learnings, best practices, agent documents, and cross-user insights in parallel
    const [similarLearnings, bestPractices, agentDocs, crossUserInsights, highScores] = await Promise.all([
      retrieveSimilarLearnings(topic, contentType, 5),
      getBestPractices(contentType),
      retrieveAgentDocuments(topic, 'content_writer', 5), // Increased from default 3 to 5
      getCrossUserInsights(contentType),
      getRecentHighScores(contentType),
    ])

    console.log(
      `[Content RAG] 🌐 Cross-user insights: ${crossUserInsights.uniqueUsers} users, ${crossUserInsights.successfulLearnings} successful patterns`
    )
    console.log('[Content RAG] Agent docs retrieved:', agentDocs?.length ?? 0)

    // Format guidance with cross-user insights
    const guidance = formatGuidance(
      similarLearnings,
      bestPractices,
      agentDocs,
      keywords,
      crossUserInsights,
      highScores,
    )

    console.log('[Content RAG] ✓ Guidance retrieved')
    return guidance
  } catch (error) {
    console.error('[Content RAG] Error getting guidance:', error)
    return 'Write naturally and focus on providing value to readers.'
  }
}

const MAX_AGENT_DOCS = 4 // Increased from 2 to include more SEO/AEO research guidance
const MAX_AGENT_DOC_CHARS = 800 // Increased from 320 to provide fuller context
const MAX_BEST_PRACTICES = 5 // Increased from 3

function formatGuidance(
  similarLearnings: any[],
  bestPractices: any[],
  agentDocs: any[] | undefined,
  keywords: string[],
  crossUserInsights: any,
  highScores: any[],
): string {
  const parts: string[] = []

  // Cross-user learning insights
  if (crossUserInsights && crossUserInsights.uniqueUsers > 1) {
    parts.push('## Global Learning Insights')
    parts.push(`Learned from ${crossUserInsights.uniqueUsers} users across ${crossUserInsights.totalLearnings} content pieces:`)
    
    if (crossUserInsights.topTechniques.length > 0) {
      parts.push('\nTop performing techniques across all users:')
      crossUserInsights.topTechniques.slice(0, 5).forEach((technique: any, i: number) => {
        parts.push(`${i + 1}. ${technique.technique} (used ${technique.usage}x, avg score: ${technique.avgScore.toFixed(1)}%)`)
      })
    }
    
    parts.push(`\nCommunity success rate: ${((crossUserInsights.successfulLearnings / crossUserInsights.totalLearnings) * 100).toFixed(1)}%`)
    parts.push('')
  }

  // Expert Knowledge from Uploaded Documents
  if (agentDocs && agentDocs.length > 0) {
    parts.push('## Expert Writing Guidelines')
    parts.push('Apply these proven content writing strategies:')
    agentDocs.slice(0, MAX_AGENT_DOCS).forEach((doc, i) => {
      parts.push(`\n### ${i + 1}. ${doc.title}`)
      parts.push(summarizeDocContent(doc.content, MAX_AGENT_DOC_CHARS))
    })
    parts.push('')
  }

  // Best practices for this content type
  if (bestPractices.length > 0) {
    parts.push('## Proven Techniques')
    const summaries = summarizeBestPractices(bestPractices, MAX_BEST_PRACTICES)
    summaries.forEach((summary) => parts.push(`- ${summary}`))
    parts.push('')
  }

  // Similar successful content
  if (similarLearnings.length > 0) {
    parts.push('## Similar Successful Content')
    parts.push('Learn from these similar pieces that scored well:')
    similarLearnings.forEach((learning, i) => {
      parts.push(`\n${i + 1}. Topic: "${learning.topic}"`)
      parts.push(`   AI Score: ${learning.ai_detection_score}%`)
      parts.push(`   Techniques: ${learning.techniques_used?.join(', ')}`)
    })
    parts.push('')
  }

  // Recommendations based on learnings
  if (similarLearnings.length > 0 || bestPractices.length > 0 || (agentDocs && agentDocs.length > 0)) {
    parts.push('## Recommendations')
    parts.push('Based on successful patterns and expert knowledge:')

    // Analyze common themes
    const avgAiScore = similarLearnings.length > 0
      ? similarLearnings.reduce((sum, l) => sum + l.ai_detection_score, 0) / similarLearnings.length
      : 30

    if (avgAiScore < 30) {
      parts.push('- Continue using varied sentence structures')
      parts.push('- Maintain personal insights and examples')
    } else {
      parts.push('- Add more personal perspectives and real-world examples')
      parts.push('- Vary sentence length and structure more')
    }

    parts.push(`- Naturally incorporate keywords: ${keywords.join(', ')}`)
    parts.push('- Use specific data points and statistics')
    parts.push('- Add rhetorical questions to engage readers')
  }

  if (highScores.length > 0) {
    parts.push('## Patterns Triggering AI Detectors')
    parts.push('These recent drafts were flagged above 90% AI likelihood. Do not mimic their tone or structure:')
    highScores.forEach((entry: any, index: number) => {
      parts.push(
        `\n${index + 1}. Topic: "${entry.topic}" – Score: ${entry.ai_detection_score.toFixed(
          1,
        )}% (${new Date(entry.created_at).toLocaleDateString()})`,
      )
      if (entry.techniques_used?.length) {
        parts.push(`   Techniques used: ${entry.techniques_used.join(', ')}`)
      }
    })
    parts.push(
      '\nPivot to first-person anecdotes, rhetorical questions, and uneven sentence lengths to avoid repeating these failures.',
    )
  }

  return parts.join('\n')
}

function summarizeDocContent(content: string, maxChars: number): string {
  if (!content) return ''
  const sentences = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' ')
  if (sentences.length <= maxChars) return sentences
  return sentences.slice(0, maxChars).trimEnd() + '…'
}

function summarizeBestPractices(practices: any[], limit: number): string[] {
  if (!practices || practices.length === 0) return []
  return practices.slice(0, limit).map((practice) => {
    const techniques = Array.isArray(practice.techniques)
      ? practice.techniques.slice(0, 3).join(', ')
      : practice.techniques
    const successRate = practice.success_rate
      ? `${(practice.success_rate * 100).toFixed(1)}% success`
      : ''
    const aiScore = practice.avg_ai_score
      ? `${practice.avg_ai_score.toFixed(1)}% avg AI score`
      : ''
    return [techniques, successRate, aiScore].filter(Boolean).join(' • ')
  })
}









