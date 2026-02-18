import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { serverEnv } from '@/lib/config/env'

export interface RunPerplexityAdapterParams {
  systemPrompt: string
  userPrompt: string
  timeoutMs?: number
  retries?: number
}

export interface PerplexityAdapterResult {
  rawText: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

const PERPLEXITY_MODEL_DEFAULT = 'sonar-pro'
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai'

export async function runPerplexityAdapter(params: RunPerplexityAdapterParams): Promise<PerplexityAdapterResult> {
  const { systemPrompt, userPrompt, timeoutMs = 15000, retries = 2 } = params

  const apiKey = serverEnv.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured')
  }

  const model = serverEnv.PERPLEXITY_MODEL || PERPLEXITY_MODEL_DEFAULT

  const perplexity = createOpenAI({
    apiKey,
    baseURL: PERPLEXITY_BASE_URL,
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await generateText({
        model: perplexity(model),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.2,
        abortSignal: AbortSignal.timeout(timeoutMs),
      })

      const usage = result.usage
      return {
        rawText: result.text,
        model,
        usage: usage
          ? {
              promptTokens: usage.inputTokens ?? 0,
              completionTokens: usage.outputTokens ?? 0,
              totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            }
          : undefined,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`[Perplexity] Attempt ${attempt + 1} failed:`, lastError.message)
      
if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt))
      }
    }
  }

  throw lastError || new Error('Perplexity adapter failed after retries')
}