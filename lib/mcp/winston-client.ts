/**
 * Winston AI MCP Client Configuration
 * 
 * Connects to the Winston AI MCP server for plagiarism detection and content validation
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { tool } from 'ai'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'

// No longer using MCP client for Winston
// import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
// let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

/**
 * Get Winston tools (Direct API version)
 * Replaces the MCP client with a direct tool definition
 */
export async function getWinstonTools() {
  return {
    winston_check_quality: tool({
      description: 'Check content quality, plagiarism, and AI detection using Winston AI. Returns a score (0-100) where higher means more likely AI-generated.',
      parameters: z.object({
        content: z.string().describe('The text content to analyze'),
      }),
      execute: async ({ content }) => {
        return await analyzeContent(content)
      },
    })
  }
}

// Deprecated MCP functions - kept as no-ops or removed
export async function getWinstonMCPClient() {
  return null
}

export async function closeWinstonMCPClient() {
  // No-op
}

/**
 * Analyze content for AI detection using Winston AI API
 * Direct API call (not MCP) for better reliability
 */
export async function analyzeContent(content: string): Promise<{
  score: number
  humanProbability: number
  feedback: string | null
}> {
  try {
    console.log('[Winston AI] Detecting AI content...')

    const response = await fetch('https://api.gowinston.ai/v2/ai-content-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverEnv.WINSTON_AI_API_KEY}`,
      },
      body: JSON.stringify({
        text: content,
        language: 'en',
        sentences: false
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Winston AI] API error:', response.status, errorText)
      throw new Error(`Winston AI API error: ${response.status}`)
    }

    const data = await response.json()

    // Winston AI returns a score between 0-100
    // For AI Detection endpoint: Higher score = more likely AI-generated
    const aiScore = data.score || 0
    const humanProb = 100 - aiScore

    console.log('[Winston AI] Detection complete:', {
      aiScore,
      humanProb,
    })

    return {
      score: aiScore,
      humanProbability: humanProb,
      feedback: data.feedback || null,
    }
  } catch (error) {
    console.error('[Winston AI] Detection failed:', error)
    // Return a default high score so content gets improved
    return {
      score: 80,
      humanProbability: 20,
      feedback: 'Detection failed - defaulting to high AI score for safety',
    }
  }
}

