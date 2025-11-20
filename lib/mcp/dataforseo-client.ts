/**
 * DataForSEO MCP Client Configuration
 * 
 * Connects to the DataForSEO MCP server to access 40+ SEO tools
 * with simplified filter schema for LLM compatibility
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { mcpToAiSdk } from 'mcp-to-ai-sdk'
import { serverEnv } from '@/lib/config/env'

/**
 * Create Basic Auth header using Web APIs (Edge runtime compatible)
 */
function createBasicAuth(username: string, password: string): string {
  const preencoded = serverEnv.DATAFORSEO_BASIC_AUTH?.trim()
  if (preencoded) {
    return preencoded.startsWith('Basic ') ? preencoded : `Basic ${preencoded}`
  }

  // Use Web API btoa instead of Buffer (Edge runtime compatible)
  const credentials = `${username}:${password}`
  const encoded = btoa(credentials)
  return `Basic ${encoded}`
}

/**
 * Get MCP tools from DataForSEO MCP server using mcp-to-ai-sdk
 * 
 * The MCP server should be configured with DATAFORSEO_SIMPLE_FILTER=true
 * to enable simplified filter schemas that work better with LLMs.
 */
export async function getDataForSEOTools() {
  const mcpUrl = (serverEnv.DATAFORSEO_MCP_URL || 'http://localhost:3000/mcp').trim()

  console.log('[MCP] Connecting to DataForSEO MCP server at:', mcpUrl)

  try {
    const { tools } = await mcpToAiSdk({
        transport: {
          type: 'http',
          url: mcpUrl,
          headers: {
            'Authorization': createBasicAuth(serverEnv.DATAFORSEO_LOGIN, serverEnv.DATAFORSEO_PASSWORD),
          },
        },
    })

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] Loaded ${toolCount} tools from DataForSEO MCP server`)

    if (toolCount === 0) {
      console.warn('[MCP] Warning: No tools loaded from MCP server')
      throw new Error('No tools available from MCP server')
    }

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] Failed to load tools from MCP server:', {
      error: errorMessage,
      mcpUrl: serverEnv.DATAFORSEO_MCP_URL,
    })

    throw new Error(`MCP server unavailable: ${errorMessage}`)
  }
}

// Deprecated functions - kept as no-ops or removed
export async function getDataForSEOMCPClient() {
  return null
}

export async function closeDataForSEOMCPClient() {
  // No-op
}
