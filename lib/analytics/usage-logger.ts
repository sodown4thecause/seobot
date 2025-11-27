/**
 * Usage Logger for AI Usage Events
 * Logs AI calls to ai_usage_events table with cost estimates
 */

import { createClient } from '@/lib/supabase/server'
import { estimateCost, extractProviderFromModel, type AIProvider } from './cost-estimator'

export interface UsageLogParams {
  userId: string | null | undefined
  conversationId?: string | null
  messageId?: string | null
  agentType?: string
  model: string
  promptTokens?: number
  completionTokens?: number
  toolCalls?: number
  provider?: AIProvider
  endpoint?: string
  metadata?: Record<string, any>
}

/**
 * Log an AI usage event to the database
 */
export async function logAIUsage(params: UsageLogParams): Promise<void> {
  try {
    if (!params.userId) {
      // Skip logging if no user ID (e.g., public endpoints)
      return
    }

    const supabase = await createClient()
    
    // Determine provider
    const provider = params.provider || extractProviderFromModel(params.model)
    
    // Estimate cost
    const costUsd = estimateCost({
      provider,
      model: params.model,
      promptTokens: params.promptTokens || 0,
      completionTokens: params.completionTokens || 0,
      toolCalls: params.toolCalls || 0,
      endpoint: params.endpoint,
      metadata: params.metadata,
    })

    // Prepare metadata with provider and cost
    const metadata = {
      ...params.metadata,
      provider,
      cost_usd: costUsd,
      endpoint: params.endpoint,
    }

    // Insert into ai_usage_events
    const { error } = await supabase.from('ai_usage_events').insert({
      user_id: params.userId,
      conversation_id: params.conversationId || null,
      message_id: params.messageId || null,
      agent_type: params.agentType || null,
      model: params.model,
      prompt_tokens: params.promptTokens || 0,
      completion_tokens: params.completionTokens || 0,
      tool_calls: params.toolCalls || 0,
      metadata,
    })

    if (error) {
      console.error('[Usage Logger] Failed to log AI usage:', error)
      // Don't throw - logging failures shouldn't break the app
    } else {
      console.log(`[Usage Logger] Logged ${provider} usage: ${params.model} (${costUsd.toFixed(4)} USD)`)
    }
  } catch (error) {
    console.error('[Usage Logger] Error logging AI usage:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Extract usage from AI SDK result
 */
export function extractUsageFromResult(result: any): {
  promptTokens: number
  completionTokens: number
  toolCalls: number
} {
  // AI SDK 6 format
  if (result.usage) {
    return {
      promptTokens: result.usage.promptTokens || 0,
      completionTokens: result.usage.completionTokens || 0,
      toolCalls: result.steps?.reduce((sum: number, step: any) => sum + (step.toolCalls?.length || 0), 0) || 0,
    }
  }

  // Fallback: try to extract from response
  if (result.response?.usage) {
    return {
      promptTokens: result.response.usage.promptTokens || 0,
      completionTokens: result.response.usage.completionTokens || 0,
      toolCalls: result.steps?.reduce((sum: number, step: any) => sum + (step.toolCalls?.length || 0), 0) || 0,
    }
  }

  // Default: return zeros (will use conservative estimate)
  return {
    promptTokens: 0,
    completionTokens: 0,
    toolCalls: 0,
  }
}

