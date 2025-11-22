/**
 * Content RAG - Retrieval Augmented Generation for content writing
 * Combines cross-user learnings with uploaded expert documents
 */

import { retrieveSimilarLearnings, getBestPractices, getCrossUserInsights } from './learning-storage'
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
      match_threshold: 0.5,
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
    const [similarLearnings, bestPractices, agentDocs, crossUserInsights] = await Promise.all([
      retrieveSimilarLearnings(topic, contentType, 5),
      getBestPractices(contentType),
      retrieveAgentDocuments(topic, 'content_writer'),
      getCrossUserInsights(contentType),
    ])

    console.log(`[Content RAG] 🌐 Cross-user insights: ${crossUserInsights.uniqueUsers} users, ${crossUserInsights.successfulLearnings} successful patterns`)

    // Format guidance with cross-user insights
    const guidance = formatGuidance(similarLearnings, bestPractices, agentDocs, keywords, crossUserInsights)

    console.log('[Content RAG] ✓ Guidance retrieved')
    return guidance
  } catch (error) {
    console.error('[Content RAG] Error getting guidance:', error)
    return 'Write naturally and focus on providing value to readers.'
  }
}

/**
 * Format learnings into structured guidance
 */
function formatGuidance(
  similarLearnings: any[],
  bestPractices: any[],
  agentDocs: any[] | undefined,
  keywords: string[],
  crossUserInsights?: any
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
    agentDocs.forEach((doc, i) => {
      parts.push(`\n### ${i + 1}. ${doc.title}`)
      parts.push(doc.content.substring(0, 500)) // First 500 chars
    })
    parts.push('')
  }

  // Best practices for this content type
  if (bestPractices.length > 0) {
    parts.push('## Proven Techniques')
    parts.push('These techniques have consistently produced human-like content:')
    bestPractices.forEach((practice) => {
      parts.push(`\n- ${practice.techniques?.join(', ')}`)
      parts.push(`  Success rate: ${(practice.success_rate * 100).toFixed(1)}%`)
      parts.push(`  Avg AI detection: ${practice.avg_ai_score?.toFixed(1)}%`)
    })
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

  return parts.join('\n')
}









