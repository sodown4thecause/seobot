/**
 * Cost Estimator for AI Usage Events
 * Calculates estimated costs for various AI providers and tools
 */

export type AIProvider = 
  | 'vercel_gateway'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'gemini'
  | 'dataforseo'
  | 'firecrawl'
  | 'jina'
  | 'perplexity'

export interface CostEstimateParams {
  provider: AIProvider
  model?: string
  promptTokens?: number
  completionTokens?: number
  toolCalls?: number
  endpoint?: string // For DataForSEO, Firecrawl, etc.
  metadata?: Record<string, any>
}

/**
 * Pricing map (per 1K tokens for LLMs, per request for tools)
 * These are approximate costs - adjust based on actual pricing
 */
const PRICING_MAP: Record<string, Record<string, number>> = {
  // OpenAI models (via Gateway or direct)
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'openai/gpt-4o': { input: 0.0025, output: 0.01 },
  'openai/gpt-4-turbo': { input: 0.01, output: 0.03 },
  'openai/text-embedding-3-small': { input: 0.00002, output: 0 },
  'openai/text-embedding-3-large': { input: 0.00013, output: 0 },
  
  // Anthropic models (via Gateway)
  'anthropic/claude-haiku-4.5': { input: 0.00025, output: 0.00125 },
  'anthropic/claude-sonnet-4': { input: 0.003, output: 0.015 },
  'anthropic/claude-opus-4': { input: 0.015, output: 0.075 },
  'anthropic/claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  
  // Google/Gemini models
  'google/gemini-2.0-flash': { input: 0.000075, output: 0.0003 },
  'google/gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
  'google/gemini-3-pro-preview': { input: 0.000125, output: 0.0005 },
  'google/gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  
  // External tools (per request)
  'dataforseo': {
    'content_analysis_summary': 0.0025,
    'content_analysis_search': 0.0025,
    'serp_organic_live_advanced': 0.0025,
    'dataforseo_labs_search_intent': 0.001,
    'on_page_content_parsing': 0.001,
    'on_page_lighthouse': 0.001,
    'default': 0.002,
  },
  'firecrawl': {
    'scrape': 0.001,
    'crawl': 0.0005,
    'default': 0.001,
  },
  'jina': {
    'reader': 0.0001,
    'default': 0.0001,
  },
  'perplexity': {
    'sonar-pro': 0.003, // per 1K tokens
    'sonar-reasoning-pro': 0.005, // per 1K tokens
    'sonar': 0.001, // per 1K tokens
    'default': 0.002,
  },
}

/**
 * Estimate cost for an AI usage event
 */
export function estimateCost(params: CostEstimateParams): number {
  const { provider, model, promptTokens = 0, completionTokens = 0, toolCalls = 0, endpoint } = params

  // For LLM providers (OpenAI, Anthropic, Google)
  if (provider === 'vercel_gateway' || provider === 'openai' || provider === 'anthropic' || provider === 'google' || provider === 'gemini') {
    if (!model) {
      // Default to a conservative estimate if model unknown
      return (promptTokens / 1000) * 0.001 + (completionTokens / 1000) * 0.002
    }

    // Look up pricing for this specific model
    const modelKey = model.startsWith('openai/') || model.startsWith('anthropic/') || model.startsWith('google/')
      ? model
      : `${provider}/${model}`
    
    const pricing = PRICING_MAP[modelKey]
    if (pricing) {
      const inputCost = (promptTokens / 1000) * (pricing.input || 0)
      const outputCost = (completionTokens / 1000) * (pricing.output || 0)
      return inputCost + outputCost
    }

    // Fallback: use generic pricing based on provider
    if (provider === 'openai' || model.includes('gpt')) {
      return (promptTokens / 1000) * 0.00015 + (completionTokens / 1000) * 0.0006
    }
    if (provider === 'anthropic' || model.includes('claude')) {
      return (promptTokens / 1000) * 0.003 + (completionTokens / 1000) * 0.015
    }
    if (provider === 'google' || provider === 'gemini' || model.includes('gemini')) {
      return (promptTokens / 1000) * 0.000075 + (completionTokens / 1000) * 0.0003
    }
  }

  // For Perplexity (token-based)
  if (provider === 'perplexity') {
    const modelKey = model || 'default'
    const pricing = PRICING_MAP.perplexity[modelKey] || PRICING_MAP.perplexity.default
    const totalTokens = promptTokens + completionTokens
    return (totalTokens / 1000) * pricing
  }

  // For external tools (per-request pricing)
  if (provider === 'dataforseo') {
    const endpointKey = endpoint || 'default'
    const cost = PRICING_MAP.dataforseo[endpointKey] || PRICING_MAP.dataforseo.default
    return cost
  }

  if (provider === 'firecrawl') {
    const endpointKey = endpoint || 'default'
    const cost = PRICING_MAP.firecrawl[endpointKey] || PRICING_MAP.firecrawl.default
    return cost
  }

  if (provider === 'jina') {
    const endpointKey = endpoint || 'default'
    const cost = PRICING_MAP.jina[endpointKey] || PRICING_MAP.jina.default
    return cost
  }

  // Default: very conservative estimate
  return 0.001
}

/**
 * Extract provider from model ID
 */
export function extractProviderFromModel(modelId: string): AIProvider {
  if (modelId.startsWith('openai/')) return 'openai'
  if (modelId.startsWith('anthropic/')) return 'anthropic'
  if (modelId.startsWith('google/')) return 'google'
  if (modelId.includes('gemini')) return 'gemini'
  if (modelId.includes('claude')) return 'anthropic'
  if (modelId.includes('gpt')) return 'openai'
  return 'vercel_gateway' // Default to gateway if unknown
}
