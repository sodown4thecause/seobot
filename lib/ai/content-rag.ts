/**
 * Content RAG - Retrieval Augmented Generation for content writing
 * Combines cross-user learnings with uploaded expert documents
 */

import {
  retrieveSimilarLearnings,
  getBestPractices,
  getCrossUserInsights,
  getRecentHighScores,
} from './learning-storage'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from './embeddings'

/**
 * Retrieve relevant agent documents from Supabase
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 */
async function retrieveAgentDocuments(
  topic: string,
  agentType: string = 'content_writer',
  limit: number = 3
): Promise<any[]> {
  try {
    const supabase = await createClient()
    
    // Generate embedding for the topic using OpenAI
    const embedding = await generateEmbedding(topic)
    
    // Call the vector search function
    const { data, error } = await supabase.rpc('match_agent_documents_v2', {
      query_embedding: embedding,
      agent_type_param: agentType,
      match_threshold: 0.3, // Lowered from 0.5 - semantic similarity typically ranges 0.3-0.7
      max_results: limit,
    })

    if (error) {
      console.error('[Content RAG] Failed to retrieve agent documents (RPC error):', error)
      return []
    }

    return data || []
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
      retrieveAgentDocuments(topic, 'content_writer'),
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

const MAX_AGENT_DOCS = 2
const MAX_AGENT_DOC_CHARS = 320
const MAX_BEST_PRACTICES = 3

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









