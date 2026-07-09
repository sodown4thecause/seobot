/**
 * Intent Classification Module
 *
 * Handles LLM-based intent classification for routing user queries
 * to the appropriate agent (seo-aeo, content, general, onboarding).
 */

import { IntentToolRouter, type IntentClassification } from '@/lib/agents/intent-tool-router'
import { AgentRouter, type ChatModeId } from '@/lib/agents/agent-router'
import { AbortError } from '@/lib/errors/types'
import { buildOnboardingSystemPrompt } from '@/lib/onboarding/prompts'
import type { OnboardingData, OnboardingStep } from '@/lib/onboarding/state'
import { isChatMode } from '@/lib/chat/modes'

export type AgentType = 'seo-aeo' | 'content' | 'general' | 'onboarding' | 'image' | 'geo'

export interface ClassificationResult {
  agent: AgentType
  confidence: number
  reasoning: string
  tools: string[]
  classification: IntentClassification | null
  allIntents: string[]
}

export interface ClassifyOptions {
  query: string
  context?: {
    page?: string
    chatMode?: string
    mode?: string
    onboarding?: unknown
    [key: string]: unknown
  }
}

function resolveChatMode(context?: ClassifyOptions['context']): ChatModeId | null {
  const candidate = context?.chatMode ?? context?.mode
  return isChatMode(candidate) ? candidate : null
}

function classificationFromModeRouting(chatMode: ChatModeId): ClassificationResult {
  const modeRouting = AgentRouter.getModeRouting(chatMode)
  return {
    agent: modeRouting.agent as AgentType,
    confidence: modeRouting.confidence,
    reasoning: modeRouting.reasoning,
    tools: [...modeRouting.tools],
    classification: null,
    allIntents: [modeRouting.agent],
  }
}

/**
 * Classifies user intent and determines the appropriate agent and tools.
 * Uses LLM-based classification with keyword fallback.
 */
export async function classifyUserIntent(options: ClassifyOptions): Promise<ClassificationResult> {
  const { query, context } = options
  const isOnboardingPage = context?.page === 'onboarding'

  // Onboarding page only — product no longer has a global onboarding gate
  if (isOnboardingPage) {
    console.log('[Intent Classifier] Onboarding page detected, skipping LLM classification')
    return {
      agent: 'onboarding',
      confidence: 1.0,
      reasoning: 'Onboarding page context detected',
      tools: [],
      classification: null,
      allIntents: [],
    }
  }

  // Mode-aware chat — skip LLM classifier for dashboard SEO / GEO / Content lanes
  const chatMode = resolveChatMode(context)
  if (chatMode) {
    return classificationFromModeRouting(chatMode)
  }

  // Run keyword-based routing immediately (synchronous, 0ms) as a fallback
  const keywordRouting = AgentRouter.routeQuery(query, context)
  const CLASSIFICATION_TIMEOUT_MS = Number(process.env.INTENT_CLASSIFIER_TIMEOUT_MS || 3000)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new AbortError(`Intent classification timed out after ${CLASSIFICATION_TIMEOUT_MS}ms`))
  }, CLASSIFICATION_TIMEOUT_MS)

  try {
    const intentResult = await IntentToolRouter.classifyAndGetTools(query, controller.signal)

    console.log('[Intent Classifier] LLM Classification:', {
      primary: intentResult.classification.primaryIntent,
      secondary: intentResult.classification.secondaryIntents,
      recommendedAgent: intentResult.classification.recommendedAgent,
      confidence: intentResult.classification.confidence,
      toolsCount: intentResult.tools.length,
      reasoning: intentResult.classification.reasoning,
    })

    return {
      agent: intentResult.classification.recommendedAgent as AgentType,
      confidence: intentResult.classification.confidence,
      reasoning: intentResult.classification.reasoning,
      tools: intentResult.tools,
      classification: intentResult.classification,
      allIntents: intentResult.allIntents,
    }
  } catch (error) {
    const isTimeout = isTimeoutAbort(error)
    if (isTimeout) {
      console.warn('[Intent Classifier] LLM classification timed out; using mode or keyword router fallback')
    } else {
      console.error('[Intent Classifier] LLM classification failed, falling back to keyword routing:', error)
    }

    // On timeout, prefer the mode's compact tool set over the full AgentRouter list
    if (isTimeout && chatMode) {
      const modeFallback = classificationFromModeRouting(chatMode)
      return {
        ...modeFallback,
        confidence: 0.7,
        reasoning: 'Mode-based routing (LLM timeout fallback)',
      }
    }

    return {
      agent: keywordRouting.agent as AgentType,
      confidence: 0.7,
      reasoning: isTimeout ? 'Keyword-based routing (LLM timeout fallback)' : 'Keyword-based routing fallback',
      tools: keywordRouting.tools as string[],
      classification: null,
      allIntents: [keywordRouting.agent],
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

function isTimeoutAbort(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return error.name === 'AbortError'
    || error.message.includes('timed out')
    || error.message.includes('aborted')
}

function normalizeOnboardingStep(step?: number): OnboardingStep {
  if (step === 2 || step === 3 || step === 4 || step === 5 || step === 6) {
    return step
  }

  return 1
}

/**
 * Build system prompt for the selected agent with intent-specific addendum.
 */
export function buildAgentSystemPrompt(
  agent: AgentType,
  context: ClassifyOptions['context'],
  allIntents: string[]
): string {
  const isOnboardingPage = context?.page === 'onboarding'

  if (isOnboardingPage && context?.onboarding) {
    const onboardingContext = context.onboarding as {
      currentStep?: number
      data?: OnboardingData
    }
    const currentStep = normalizeOnboardingStep(onboardingContext.currentStep)
    const onboardingData = onboardingContext.data || {}
    return buildOnboardingSystemPrompt(currentStep, onboardingData)
  }

  let systemPrompt = AgentRouter.getAgentSystemPrompt(agent, context)

  // Add current date/time awareness
  const now = new Date()
  const datePrefix = `CURRENT DATE: ${now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} (${now.getFullYear()})\n\n`
  systemPrompt = datePrefix + systemPrompt

  // Add intent-specific guidance if we have classification
  if (allIntents.length > 0) {
    const intentAddendum = IntentToolRouter.getIntentSystemPromptAddendum(
      allIntents as Parameters<typeof IntentToolRouter.getIntentSystemPromptAddendum>[0]
    )
    if (intentAddendum) {
      systemPrompt = systemPrompt + '\n\n' + intentAddendum
    }
  }

  return systemPrompt + '\n\n' + RESPONSIVENESS_ADDENDUM
}

/**
 * Shared guidance appended to every agent prompt: keep the user informed
 * while tools run, open with a plan on first domain share, and recover
 * gracefully from failed tools.
 */
const RESPONSIVENESS_ADDENDUM = `RESPONSIVENESS RULES:
- When the user first shares their website or domain, open with a short plan before running heavy tools: 2-3 bullets covering what you understood about their situation and which checks you will run next. Keep it under 80 words.
- Never go silent while tools run. Before and between tool calls, narrate what you are checking and share preliminary analysis of results you already have.
- If a tool fails or times out, do not stop. Acknowledge it in one sentence, keep the insights from tools that succeeded, and continue with your best analysis. Offer to retry the failed check.
- Always end your reply with a concrete recommended next step.`

// _review
