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
 * 
 * Default URL includes API key in path: https://mcp.firecrawl.dev/{API_KEY}/v2/mcp
 */
export async function getFirecrawlMCPClient() {
  if (!mcpClient) {
    // Get API key from environment
    const apiKey = serverEnv.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required for Firecrawl MCP')
    }

    // Use environment override or construct default URL with embedded API key
    // Default format: https://mcp.firecrawl.dev/fc-{key}/v2/mcp
    const mcpUrl = serverEnv.FIRECRAWL_MCP_URL || `https://mcp.firecrawl.dev/${apiKey}/v2/mcp`

    // Sanitize URL for logging (mask API key)
    const sanitizedUrl = mcpUrl.includes('firecrawl.dev') 
      ? mcpUrl.replace(/\/fc-[a-zA-Z0-9]+\//, '/fc-****/') 
      : mcpUrl.replace(apiKey, '****')
    
    console.log('[MCP] Connecting to Firecrawl MCP server at:', sanitizedUrl)
    console.log('[MCP] API key configured:', apiKey ? '✓ Yes' : '✗ No')

    try {
      mcpClient = await createMCPClient({
        transport: {
          type: 'http',
          url: mcpUrl,
          headers: {
            // Firecrawl uses Bearer token authentication
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      })

      console.log('[MCP] ✓ Connected to Firecrawl MCP server')
    } catch (error) {
      console.error('[MCP] ✗ Failed to connect to Firecrawl MCP server:', error)
      console.error('[MCP] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        url: sanitizedUrl,
        hasApiKey: !!apiKey,
      })
      // Reset client on failure so next attempt creates a new connection
      mcpClient = null
      throw error
    }
  }

  return mcpClient
}

/**
 * Get MCP tools from Firecrawl MCP server
 * Implements 10-second timeout to prevent hanging
 */
export async function getFirecrawlTools() {
  try {
    const client = await getFirecrawlMCPClient()

    // Load tools with timeout protection
    const toolsPromise = client.tools()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firecrawl MCP server timeout after 10s')), 10000)
    )

    const tools = await Promise.race([toolsPromise, timeoutPromise]) as Record<string, any>

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] ✓ Loaded ${toolCount} tools from Firecrawl MCP server`)

    // Verify we got tools
    if (toolCount === 0) {
      console.warn('[MCP] ⚠️ Warning: No tools loaded from Firecrawl MCP server')
      console.warn('[MCP] This may indicate:')
      console.warn('[MCP]   - Incorrect API key in URL path')
      console.warn('[MCP]   - Server not responding with tool definitions')
      console.warn('[MCP]   - Authentication failure')
      // Reset client and throw to trigger fallback
      mcpClient = null
      throw new Error('No tools available from Firecrawl MCP server')
    }

    // Log available tool names for debugging
    console.log('[MCP] Firecrawl tools:', Object.keys(tools).join(', '))

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] ✗ Failed to load tools from Firecrawl MCP server:', {
      error: errorMessage,
      suggestion: 'Check FIRECRAWL_API_KEY and FIRECRAWL_MCP_URL in .env.local',
    })

    // Reset client on failure
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

