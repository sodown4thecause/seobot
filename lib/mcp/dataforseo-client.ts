/**
 * DataForSEO MCP Client Configuration
 * 
 * Connects to the DataForSEO MCP server to access 40+ SEO tools
 * with simplified filter schema for LLM compatibility
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { serverEnv } from '@/lib/config/env'

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

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
 * Get or create the DataForSEO MCP client instance
 * Uses HTTP transport to connect to the MCP server
 */
export async function getDataForSEOMCPClient() {
  if (!mcpClient) {
    const mcpUrl = (serverEnv.DATAFORSEO_MCP_URL || 'http://localhost:3000/mcp').trim()

    console.log('[MCP] Connecting to DataForSEO MCP server at:', mcpUrl)

    try {
      mcpClient = await createMCPClient({
        transport: {
          type: 'http', // Use HTTP transport (POST /mcp is recommended for Cloudflare Workers)
          url: mcpUrl,
          // Basic auth using DataForSEO credentials (Edge runtime compatible)
          headers: {
            'Authorization': createBasicAuth(serverEnv.DATAFORSEO_LOGIN, serverEnv.DATAFORSEO_PASSWORD),
          },
        },
      })

      console.log('[MCP] Connected to DataForSEO MCP server')
    } catch (error) {
      console.error('[MCP] Failed to connect to MCP server:', error)
      console.error('[MCP] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        url: mcpUrl,
      })
      // Reset client on failure
      mcpClient = null
      throw error
    }
  }

  return mcpClient
}

/**
 * Get MCP tools from DataForSEO MCP server
 * 
 * The MCP server should be configured with DATAFORSEO_SIMPLE_FILTER=true
 * to enable simplified filter schemas that work better with LLMs.
 * The server will automatically return simplified schemas if configured.
 */
export async function getDataForSEOTools() {
  try {
    const client = await getDataForSEOMCPClient()

    // Get tools from MCP server with timeout
    // The server will return simplified schemas if DATAFORSEO_SIMPLE_FILTER=true is set
    const toolsPromise = client.tools()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MCP server timeout after 10s')), 10000)
    )

    const tools = await Promise.race([toolsPromise, timeoutPromise]) as Record<string, any>

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] Loaded ${toolCount} tools from DataForSEO MCP server`)

    if (toolCount === 0) {
      console.warn('[MCP] Warning: No tools loaded from MCP server')
      // Reset client and throw to trigger fallback
      mcpClient = null
      throw new Error('No tools available from MCP server')
    }

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] Failed to load tools from MCP server:', {
      error: errorMessage,
      mcpUrl: serverEnv.DATAFORSEO_MCP_URL,
    })

    // Reset client on failure so next attempt creates a new connection
    mcpClient = null

    // Rethrow with more context
    throw new Error(`MCP server unavailable: ${errorMessage}`)
  }
}

/**
 * Close the MCP client connection
 * Should be called when shutting down the application
 */
export async function closeDataForSEOMCPClient() {
  if (mcpClient) {
    try {
      await mcpClient.close()
      mcpClient = null
      console.log('[MCP] Closed DataForSEO MCP client connection')
    } catch (error) {
      console.error('[MCP] Error closing client:', error)
    }
  }
}

