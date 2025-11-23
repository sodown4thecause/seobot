/**
 * Winston AI MCP Client Configuration
 * 
 * Connects to the Winston AI MCP server for plagiarism detection and content validation.
 * 
 * IMPORTANT: Winston AI uses JSON-RPC 2.0 protocol. The API key is NOT passed in headers,
 * but rather as an "apiKey" parameter in each tool call. The connection itself requires
 * no authentication.
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 * 
 * AI Detection now uses Gradio AI Detector as primary method
 */

import { tool } from 'ai'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'
import { detectAIContentWithGradio } from '@/lib/external-apis/gradio-ai-detector'


/**
 * Get Winston tools (Direct API version)
 * Replaces the MCP client with a direct tool definition
 */
export async function getWinstonTools() {
  return {
    winston_check_quality: tool({
      description: 'Check content quality, plagiarism, and AI detection using Winston AI. Returns a score (0-100) where higher means more likely AI-generated.',
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
 * Analyze content for AI detection using Gradio AI Detector
 * Replaces Winston AI as the primary detection method
 */
export async function analyzeContent(content: string): Promise<{
  score: number
  humanProbability: number
  feedback: string | null
}> {
  const result = await detectAIContentWithGradio(content);
  
  return {
    score: result.score,
    humanProbability: result.humanProbability,
    feedback: null
  };
}

