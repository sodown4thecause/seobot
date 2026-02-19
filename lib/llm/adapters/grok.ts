import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { serverEnv } from '@/lib/config/env'

export interface RunGrokAdapterParams {
  systemPrompt: string
  userPrompt: string
  timeoutMs?: number
  retries?: number
}

export interface GrokAdapterResult {
  rawText: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

const GROK_MODEL_DEFAULT = 'grok-2-1212'
const XAI_BASE_URL_DEFAULT = 'https://api.x.ai/v1'

export async function runGrokAdapter(params: RunGrokAdapterParams): Promise<GrokAdapterResult> {
  const { systemPrompt, userPrompt, timeoutMs = 15000, retries = 2 } = params

  const apiKey = serverEnv.XAI_API_KEY
  if (!apiKey) {
    throw new Error('XAI_API_KEY is not configured')
  }

  const model = serverEnv.GROK_MODEL || GROK_MODEL_DEFAULT
  const baseURL = serverEnv.XAI_BASE_URL || XAI_BASE_URL_DEFAULT

  const xai = createOpenAI({
    apiKey,
    baseURL,
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await generateText({
        model: xai(model),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
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
      console.error(`[Grok] Attempt ${attempt + 1} failed:`, lastError.message)

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt))
      }
    }
  }

  throw lastError || new Error('Grok adapter failed after retries')
}