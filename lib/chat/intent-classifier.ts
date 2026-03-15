/**
 * Intent Classification Module
 * 
 * Handles LLM-based intent classification for routing user queries
 * to the appropriate agent (seo-aeo, content, general, onboarding).
 */

import { IntentToolRouter, type IntentClassification } from '@/lib/agents/intent-tool-router'
import { AgentRouter } from '@/lib/agents/agent-router'

export type AgentType = 'seo-aeo' | 'content' | 'general' | 'onboarding' | 'image'

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
    onboarding?: unknown
    [key: string]: unknown
  }
}

/**
 * Classifies user intent and determines the appropriate agent and tools.
 * Uses LLM-based classification with keyword fallback.
 */
export async function classifyUserIntent(options: ClassifyOptions): Promise<ClassificationResult> {
  const { query, context } = options
  const isOnboarding = context?.page === 'onboarding' || !!context?.onboarding

  // Skip LLM classification for onboarding
  if (isOnboarding || AgentRouter.routeQuery(query, context).agent === 'onboarding') {
    console.log('[Intent Classifier] Onboarding detected, skipping LLM classification')
    return {
      agent: 'onboarding',
      confidence: 1.0,
      reasoning: 'Onboarding context detected',
      tools: [],
      classification: null,
      allIntents: [],
    }
  }

  // Run keyword-based routing immediately (synchronous, 0ms) as a fallback
  // This ensures we always have a result, even if the LLM classification times out
  const keywordRouting = AgentRouter.routeQuery(query, context)

  try {
    // Tier 1: LLM classifies intent AND recommends agent
    // Race against a 5s timeout — if the LLM is slow, use keyword routing immediately
    const CLASSIFICATION_TIMEOUT_MS = 5000
    const intentResult = await Promise.race([
      IntentToolRouter.classifyAndGetTools(query),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Intent classification timed out after 5s')), CLASSIFICATION_TIMEOUT_MS)
      ),
    ])

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
    const isTimeout = error instanceof Error && error.message.includes('timed out')
    if (isTimeout) {
      console.warn('[Intent Classifier] LLM classification timed out — using keyword router fallback')
    } else {
      console.error('[Intent Classifier] LLM classification failed, falling back to keyword routing:', error)
    }

    // Fallback to keyword-based routing (already computed above, zero cost here)
    return {
      agent: keywordRouting.agent as AgentType,
      confidence: 0.7,
      reasoning: isTimeout ? 'Keyword-based routing (LLM timeout fallback)' : 'Keyword-based routing fallback',
      tools: keywordRouting.tools as string[],
      classification: null,
      allIntents: [keywordRouting.agent],
    }
  }
}

/**
 * Build system prompt for the selected agent with intent-specific addendum.
 */
export function buildAgentSystemPrompt(
  agent: AgentType,
  context: ClassifyOptions['context'],
  allIntents: string[]
): string {
  // Import here to avoid circular dependency issues
  const { buildOnboardingSystemPrompt } = require('@/lib/onboarding/prompts')

  const isOnboarding = context?.page === 'onboarding' || !!context?.onboarding

  if (isOnboarding && context?.onboarding) {
    const onboardingContext = context.onboarding as {
      currentStep?: number
      data?: Record<string, unknown>
    }
    const currentStep = onboardingContext.currentStep || 1
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

  return systemPrompt
}
