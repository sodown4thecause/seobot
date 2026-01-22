import { serverEnv } from '@/lib/config/env'

/**
 * N8N Webhook API Client
 * 
 * Provides a reusable interface for calling n8n webhooks,
 * primarily used for backlink analysis workflows.
 */

// Default webhook URL (fallback if not configured in env)
const DEFAULT_WEBHOOK_BASE_URL = 'https://zuded9wg.rcld.app/webhook'

export type N8nWebhookEndpoint = 'backlinks' | 'domain' | 'analyze'

export interface N8nWebhookResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errorMessage?: string
}

export interface BacklinksData {
  domain: string
  backlinks: BacklinkItem[]
  total?: number
  total_backlinks?: number
  referring_domains?: number
}

export interface BacklinkItem {
  url: string
  domain: string
  anchor: string
  type: 'dofollow' | 'nofollow'
  domain_authority?: number
  relevance?: string
}

/**
 * Get the base URL for n8n webhooks
 */
function getWebhookBaseUrl(): string {
  return serverEnv.N8N_BACKLINKS_WEBHOOK_URL || `${DEFAULT_WEBHOOK_BASE_URL}/domain`
}

/**
 * Build the full webhook URL for a given endpoint
 */
function buildWebhookUrl(endpoint: N8nWebhookEndpoint, params?: Record<string, string>): string {
  // For the backlinks endpoint, we use the configured webhook URL directly
  if (endpoint === 'backlinks' || endpoint === 'domain') {
    const baseUrl = getWebhookBaseUrl()
    if (params?.domain) {
      return `${baseUrl}?domain=${encodeURIComponent(params.domain)}`
    }
    return baseUrl
  }
  
  // For other endpoints, construct the URL
  const baseUrl = serverEnv.N8N_BACKLINKS_WEBHOOK_URL?.replace(/\/domain$/, '') || DEFAULT_WEBHOOK_BASE_URL
  const url = new URL(`${baseUrl}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return url.toString()
}

/**
 * Call an n8n webhook endpoint
 * 
 * @param endpoint - The webhook endpoint to call
 * @param data - The data to send to the webhook
 * @returns The webhook response
 * 
 * @example
 * ```ts
 * const result = await callN8nWebhook('backlinks', { 
 *   domain: 'example.com',
 *   action: 'analyze' 
 * })
 * if (result.success) {
 *   console.log(result.data.backlinks)
 * }
 * ```
 */
export async function callN8nWebhook<T = BacklinksData>(
  endpoint: N8nWebhookEndpoint,
  data: { domain: string; action?: string }
): Promise<N8nWebhookResponse<T>> {
  try {
    // Use GET request with query parameters (as per n8n webhook configuration)
    const url = buildWebhookUrl(endpoint, { domain: data.domain })
    
    console.log('[N8N API] Calling webhook:', { endpoint, domain: data.domain, url })
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[N8N API] Webhook error:', response.status, errorText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        errorMessage: errorText || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    
    console.log('[N8N API] Webhook response received:', {
      endpoint,
      hasData: !!responseData,
      isArray: Array.isArray(responseData),
    })

    // Normalize response - handle both array and object responses
    const normalizedData = normalizeWebhookResponse<T>(data.domain, responseData)
    
    return {
      success: true,
      data: normalizedData,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[N8N API] Webhook call failed:', error)
    return {
      success: false,
      error: message,
      errorMessage: `Failed to call n8n webhook: ${message}`,
    }
  }
}

/**
 * Normalize webhook response to a consistent format
 */
function normalizeWebhookResponse<T>(domain: string, data: unknown): T {
  // If it's already in the expected format with backlinks array
  if (data && typeof data === 'object' && 'backlinks' in data) {
    return data as T
  }
  
  // If the response is an array, wrap it in a backlinks object
  if (Array.isArray(data)) {
    return {
      domain,
      backlinks: data,
      total: data.length,
      total_backlinks: data.length,
    } as T
  }
  
  // If it's an object with a data property containing backlinks
  if (data && typeof data === 'object' && 'data' in data) {
    const innerData = (data as { data: unknown }).data
    if (innerData && typeof innerData === 'object' && 'backlinks' in innerData) {
      return innerData as T
    }
  }
  
  // Return as-is for other formats
  return data as T
}

/**
 * Check if the n8n webhook is configured and reachable
 */
export async function checkN8nWebhookHealth(): Promise<{
  configured: boolean
  reachable: boolean
  url: string
  error?: string
}> {
  const url = getWebhookBaseUrl()
  const configured = !!serverEnv.N8N_BACKLINKS_WEBHOOK_URL
  
  try {
    // Make a simple GET request to check if the webhook is reachable
    const response = await fetch(`${url}?domain=healthcheck.test`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
    
    return {
      configured,
      reachable: response.ok,
      url,
    }
  } catch (error) {
    return {
      configured,
      reachable: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
