import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { serverEnv } from '@/lib/config/env'

export interface RunGeminiAdapterParams {
  systemPrompt: string
  userPrompt: string
  timeoutMs?: number
  retries?: number
}

export interface GeminiAdapterResult {
  rawText: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

const GEMINI_MODEL_DEFAULT = 'gemini-2.0-flash'

export async function runGeminiAdapter(params: RunGeminiAdapterParams): Promise<GeminiAdapterResult> {
  const { systemPrompt, userPrompt, timeoutMs = 15000, retries = 2 } = params

  const apiKey = serverEnv.GOOGLE_API_KEY || serverEnv.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not configured')
  }

  const model = serverEnv.GEMINI_MODEL || GEMINI_MODEL_DEFAULT

  const google = createGoogleGenerativeAI({ apiKey })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await generateText({
        model: google(model),
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
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, lastError.message)
      
if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt))
      }
    }
  }

  throw lastError || new Error('Gemini adapter failed after retries')
}