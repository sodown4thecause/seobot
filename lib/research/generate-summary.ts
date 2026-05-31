import { generateText } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import { serverEnv } from '@/lib/config/env'

const RESEARCH_MODEL = serverEnv.WEEKLY_RESEARCH_MODEL || 'openai/gpt-5.5'
const FALLBACK_RESEARCH_MODEL =
  serverEnv.WEEKLY_RESEARCH_FALLBACK_MODEL || 'openai/gpt-5.4'

export interface ResearchSummaryResult {
  summary: string
  model: string
  rawJson: Record<string, unknown>
}

export async function generateResearchSummary(
  prompt: string,
  tag: string
): Promise<ResearchSummaryResult> {
  try {
    const result = await generateText({
      model: vercelGateway.languageModel(RESEARCH_MODEL),
      prompt,
      providerOptions: {
        gateway: { tags: [`feature:${tag}`, 'mode:weekly-research'] },
      },
    })
    return {
      summary: result.text,
      model: RESEARCH_MODEL,
      rawJson: { usage: result.usage },
    }
  } catch (error) {
    console.warn(
      `[Research] ${RESEARCH_MODEL} failed, falling back to ${FALLBACK_RESEARCH_MODEL}:`,
      error
    )
    const result = await generateText({
      model: vercelGateway.languageModel(FALLBACK_RESEARCH_MODEL),
      prompt,
      providerOptions: {
        gateway: { tags: [`feature:${tag}`, 'mode:fallback-research'] },
      },
    })
    return {
      summary: result.text,
      model: FALLBACK_RESEARCH_MODEL,
      rawJson: {
        usage: result.usage,
        fallbackReason: error instanceof Error ? error.message : String(error),
      },
    }
  }
}
