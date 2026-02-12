/**
 * LLM-as-Judge Response Quality Scoring
 * 
 * Uses a fast, cost-effective model to evaluate response quality
 * across multiple dimensions: relevance, accuracy, helpfulness, completeness
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { vercelGateway } from '@/lib/ai/gateway-provider'

// Zod schema for structured judge output
const JudgeScoreSchema = z.object({
  relevance: z.number().min(1).max(5).describe('How relevant is the response to the question asked?'),
  accuracy: z.number().min(1).max(5).describe('Is the SEO/AEO information provided accurate?'),
  helpfulness: z.number().min(1).max(5).describe('Would this help a user accomplish their goal?'),
  completeness: z.number().min(1).max(5).describe('Did the response fully address all parts of the question?'),
  reasoning: z.string().describe('Brief explanation for the scores'),
})

export type JudgeScore = z.infer<typeof JudgeScoreSchema>

export interface JudgeParams {
  question: string
  expectedTools: string[]
  actualTools: string[]
  response: string
}

export interface JudgeResult extends JudgeScore {
  overallScore: number
  toolMatchScore: number
}

/**
 * Score a chatbot response using LLM-as-judge
 */
export async function scoreResponse(params: JudgeParams): Promise<JudgeResult> {
  const { question, expectedTools, actualTools, response } = params

  // Calculate tool match score
  const matchedTools = expectedTools.filter(expected =>
    actualTools.some(actual =>
      actual.toLowerCase().includes(expected.toLowerCase()) ||
      expected.toLowerCase().includes(actual.toLowerCase())
    )
  )
  const toolMatchScore = expectedTools.length > 0 
    ? matchedTools.length / expectedTools.length 
    : 0

  // Truncate response if too long (to save tokens)
  const truncatedResponse = response.length > 4000 
    ? response.substring(0, 4000) + '\n...(response truncated for evaluation)'
    : response

  // Skip judging if response is empty or too short
  if (!response || response.length < 50) {
    return {
      relevance: 1,
      accuracy: 1,
      helpfulness: 1,
      completeness: 1,
      reasoning: 'Response was too short or empty to evaluate meaningfully',
      overallScore: 1,
      toolMatchScore
    }
  }

  try {
    // Use Gemini Flash for fast, cheap evaluation
    const result = await generateObject({
      model: vercelGateway.languageModel('google/gemini-2.0-flash'),
      schema: JudgeScoreSchema,
      prompt: `You are an impartial judge evaluating an AI assistant response for an SEO/AEO platform.

QUESTION ASKED:
${question}

EXPECTED TOOLS (what should have been called):
${expectedTools.length > 0 ? expectedTools.join(', ') : 'None specified'}

ACTUAL TOOLS CALLED:
${actualTools.length > 0 ? actualTools.join(', ') : 'None detected'}

RESPONSE TO EVALUATE:
${truncatedResponse}

---

Evaluate this response on four dimensions (1-5 scale):

1. RELEVANCE (1-5): Is the response relevant to the question asked?
   - 1: Completely off-topic
   - 2: Mostly irrelevant with minor relevance
   - 3: Somewhat relevant but misses key aspects
   - 4: Relevant with minor gaps
   - 5: Directly addresses the question

2. ACCURACY (1-5): Is the SEO/AEO information provided accurate?
   - 1: Contains significant factual errors
   - 2: Several inaccuracies
   - 3: Mix of accurate and questionable information
   - 4: Mostly accurate with minor issues
   - 5: Accurate and reliable information

3. HELPFULNESS (1-5): Would this help a user accomplish their goal?
   - 1: Not helpful at all
   - 2: Minimally helpful
   - 3: Somewhat helpful but incomplete
   - 4: Helpful with minor gaps
   - 5: Very helpful and actionable

4. COMPLETENESS (1-5): Did the response fully address all parts of the question?
   - 1: Missed almost everything
   - 2: Addressed only one minor aspect
   - 3: Addressed some parts but missed others
   - 4: Addressed most parts adequately
   - 5: Fully comprehensive response

Provide your scores and a brief reasoning for each dimension.`,
    })

    const scores = result.object
    const overallScore = (scores.relevance + scores.accuracy + scores.helpfulness + scores.completeness) / 4

    return {
      ...scores,
      overallScore,
      toolMatchScore
    }
  } catch (error) {
    console.error('[Judge] Scoring failed:', error)
    
    // Return a default score on error
    return {
      relevance: 3,
      accuracy: 3,
      helpfulness: 3,
      completeness: 3,
      reasoning: `Scoring failed due to error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      overallScore: 3,
      toolMatchScore
    }
  }
}

/**
 * Batch score multiple responses
 */
export async function scoreResponses(
  items: Array<JudgeParams & { id: number }>
): Promise<Map<number, JudgeResult>> {
  const results = new Map<number, JudgeResult>()
  
  // Process in parallel with a concurrency limit
  const CONCURRENCY = 3
  const chunks: Array<Array<typeof items[0]>> = []
  
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    chunks.push(items.slice(i, i + CONCURRENCY))
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (item) => {
      const result = await scoreResponse(item)
      return { id: item.id, result }
    })
    
    const chunkResults = await Promise.all(promises)
    for (const { id, result } of chunkResults) {
      results.set(id, result)
    }
  }
  
  return results
}
