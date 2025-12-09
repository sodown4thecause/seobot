/**
 * Cost estimation for AI model usage
 * Provides cost calculation based on provider, model, and token usage
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'vercel_gateway'

export interface CostEstimateParams {
  provider: AIProvider
  model?: string
  promptTokens: number
  completionTokens: number
  toolCalls?: number
  endpoint?: string
  metadata?: Record<string, any>
}

/**
 * Extract provider from model name
 */
export function extractProviderFromModel(model: string): AIProvider {
  const lowerModel = model.toLowerCase()
  
  if (lowerModel.includes('gemini') || lowerModel.includes('google/')) {
    return 'google'
  }
  if (lowerModel.includes('gpt') || lowerModel.includes('openai/')) {
    return 'openai'
  }
  if (lowerModel.includes('claude') || lowerModel.includes('anthropic/')) {
    return 'anthropic'
  }
  
  return 'vercel_gateway'
}

/**
 * Estimate cost based on provider, model, and token usage
 * 
 * Note: tool_calls parameter is currently not used in cost calculation
 * as most providers don't charge separately for tool calls - they're included
 * in the token count. This parameter is kept for future extensibility.
 */
export function estimateCost(params: CostEstimateParams): number {
  const { provider, model, promptTokens, completionTokens, toolCalls } = params
  
  // Convert tokens to thousands for pricing calculations
  const promptTokensK = promptTokens / 1000
  const completionTokensK = completionTokens / 1000
  
  let inputCost = 0
  let outputCost = 0
  
  if (provider === 'google') {
    // Google Gemini pricing (2025 rates)
    // Note: Rates vary by model - using average for common models
    const lowerModel = (model || '').toLowerCase()
    
    if (lowerModel.includes('flash-lite') || lowerModel.includes('gemini-1.5-flash-lite')) {
      // Gemini 1.5 Flash Lite: $0.0001/$0.0004 per 1K tokens
      inputCost = promptTokensK * 0.0001
      outputCost = completionTokensK * 0.0004
    } else if (lowerModel.includes('2.5-pro') || lowerModel.includes('gemini-2.5-pro')) {
      // Gemini 2.5 Pro: $0.00125/$0.01 per 1K tokens
      inputCost = promptTokensK * 0.00125
      outputCost = completionTokensK * 0.01
    } else if (lowerModel.includes('2.0-flash') || lowerModel.includes('gemini-2.0-flash')) {
      // Gemini 2.0 Flash: $0.000075/$0.0003 per 1K tokens
      inputCost = promptTokensK * 0.000075
      outputCost = completionTokensK * 0.0003
    } else {
      // Default Gemini 1.5 Flash/Pro: $0.000075/$0.0003 per 1K tokens (legacy rate, updated to current)
      // Updated to reflect 2025 rates - using Flash rates as default
      inputCost = promptTokensK * 0.0001
      outputCost = completionTokensK * 0.0004
    }
  } else if (provider === 'openai') {
    const lowerModel = (model || '').toLowerCase()
    
    if (lowerModel.includes('gpt-4-turbo')) {
      // GPT-4 Turbo: $0.01 per 1K input, $0.03 per 1K output
      inputCost = promptTokensK * 0.01
      outputCost = completionTokensK * 0.03
    } else if (lowerModel.includes('gpt-4o-mini')) {
      // GPT-4o Mini: $0.00015 per 1K input, $0.0006 per 1K output
      inputCost = promptTokensK * 0.00015
      outputCost = completionTokensK * 0.0006
    } else if (lowerModel.includes('gpt-4o')) {
      // GPT-4o: $0.0025 per 1K input, $0.01 per 1K output
      inputCost = promptTokensK * 0.0025
      outputCost = completionTokensK * 0.01
    } else {
      // Default OpenAI: $0.00015 per 1K input, $0.0006 per 1K output
      inputCost = promptTokensK * 0.00015
      outputCost = completionTokensK * 0.0006
    }
  } else if (provider === 'anthropic') {
    const lowerModel = (model || '').toLowerCase()
    
    if (lowerModel.includes('opus') || lowerModel.includes('claude-3-opus')) {
      // Claude 3 Opus: $0.015 per 1K input, $0.075 per 1K output
      inputCost = promptTokensK * 0.015
      outputCost = completionTokensK * 0.075
    } else if (lowerModel.includes('haiku') || lowerModel.includes('claude-3-haiku')) {
      // Claude 3 Haiku: $0.00025/$0.00125 per 1K tokens (standard)
      // Claude 3.5 Haiku: $0.0008/$0.004 per 1K tokens
      if (lowerModel.includes('3.5')) {
        inputCost = promptTokensK * 0.0008
        outputCost = completionTokensK * 0.004
      } else {
        inputCost = promptTokensK * 0.00025
        outputCost = completionTokensK * 0.00125
      }
    } else {
      // Default Claude Sonnet: $0.003 per 1K input, $0.015 per 1K output
      inputCost = promptTokensK * 0.003
      outputCost = completionTokensK * 0.015
    }
  } else {
    // Default/vercel_gateway: conservative estimate
    inputCost = promptTokensK * 0.001
    outputCost = completionTokensK * 0.002
  }
  
  // Note: tool_calls is not currently factored into cost calculation
  // Most providers include tool call overhead in token counts
  // This parameter is kept for future extensibility if needed
  
  return inputCost + outputCost
}

