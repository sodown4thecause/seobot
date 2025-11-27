/**
 * Winston AI MCP Client Configuration
 * 
 * Provides AI detection and plagiarism checking using Winston AI API.
 * Production-grade replacement for Gradio-based detection.
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { tool } from 'ai'
import { z } from 'zod'
import { checkAiContent } from '@/lib/external-apis/winston-ai'

/**
 * Get Winston tools (Direct API version)
 */
export async function getWinstonTools() {
  return {
    winston_check_quality: tool({
      description: 'Check content quality and AI detection using Winston AI. Returns a score (0-100) where higher means more likely AI-generated.',
      inputSchema: z.object({
        content: z.string().describe('The text content to analyze'),
      }),
      execute: async ({ content }) => {
        return await analyzeContent(content)
      },
    })
  }
}

/**
 * Analyze content for AI detection using Winston AI
 * Production-grade detection with fallback handling
 */
export async function analyzeContent(content: string): Promise<{
  score: number
  humanProbability: number
  feedback: string | null
}> {
  try {
    const result = await checkAiContent(content);
    
    return {
      score: result.score,
      humanProbability: 100 - result.score,
      feedback: result.confidence === 'low' 
        ? 'Detection confidence is low - consider manual review' 
        : null
    };
  } catch (error) {
    console.error('[Winston Client] AI detection failed:', error);
    // Return conservative fallback - assume AI-generated to be safe
    return {
      score: 75,
      humanProbability: 25,
      feedback: 'Detection service unavailable - using fallback score'
    };
  }
}

