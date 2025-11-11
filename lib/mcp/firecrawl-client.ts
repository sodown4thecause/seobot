/**
 * Firecrawl MCP Client Configuration
 * 
 * Connects to the Firecrawl MCP server for web scraping and content extraction
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { serverEnv } from '@/lib/config/env'

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

/**
 * Get or create the Firecrawl MCP client instance
 * Uses HTTP transport to connect to the MCP server
 */
export async function getFirecrawlMCPClient() {
  if (!mcpClient) {
    // Construct MCP URL: https://mcp.firecrawl.dev/{FIRECRAWL_API_KEY}/v2/mcp
    const apiKey = serverEnv.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required for Firecrawl MCP')
    }

    const mcpUrl = serverEnv.FIRECRAWL_MCP_URL || `https://mcp.firecrawl.dev/${apiKey}/v2/mcp`

    console.log('[MCP] Connecting to Firecrawl MCP server at:', mcpUrl.replace(apiKey, '***'))

    try {
      mcpClient = await createMCPClient({
        transport: {
          type: 'http',
          url: mcpUrl,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        },
      })

      console.log('[MCP] Connected to Firecrawl MCP server')
    } catch (error) {
      console.error('[MCP] Failed to connect to Firecrawl MCP server:', error)
      console.error('[MCP] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        url: mcpUrl.replace(apiKey, '***'),
      })
      mcpClient = null
      throw error
    }
  }

  return mcpClient
}

/**
 * Get MCP tools from Firecrawl MCP server
 */
export async function getFirecrawlTools() {
  try {
    const client = await getFirecrawlMCPClient()

    const toolsPromise = client.tools()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firecrawl MCP server timeout after 10s')), 10000)
    )

    const tools = await Promise.race([toolsPromise, timeoutPromise]) as Record<string, any>

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] Loaded ${toolCount} tools from Firecrawl MCP server`)

    if (toolCount === 0) {
      console.warn('[MCP] Warning: No tools loaded from Firecrawl MCP server')
      mcpClient = null
      throw new Error('No tools available from Firecrawl MCP server')
    }

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] Failed to load tools from Firecrawl MCP server:', {
      error: errorMessage,
    })

    mcpClient = null
    throw new Error(`Firecrawl MCP server unavailable: ${errorMessage}`)
  }
}

/**
 * Close the Firecrawl MCP client connection
 */
export async function closeFirecrawlMCPClient() {
  if (mcpClient) {
    try {
      await mcpClient.close()
      mcpClient = null
      console.log('[MCP] Closed Firecrawl MCP client connection')
    } catch (error) {
      console.error('[MCP] Error closing Firecrawl client:', error)
    }
  }
}

