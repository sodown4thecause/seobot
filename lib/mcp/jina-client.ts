/**
 * Jina AI MCP Client Configuration
 * 
 * Connects to the Jina AI MCP server using SSE (Server-Sent Events) transport
 * for real-time tool access and web content extraction capabilities.
 * 
 * Note: This is separate from the direct Jina Reader REST API integration
 * in lib/external-apis/jina.ts. Both can coexist:
 * - REST API: Direct markdown scraping via https://r.jina.ai
 * - MCP Server: Structured tool access via https://mcp.jina.ai/sse
 * 
 * Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { serverEnv } from '@/lib/config/env'

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

/**
 * Get or create the Jina AI MCP client instance
 * Uses SSE (Server-Sent Events) transport to connect to the MCP server
 * 
 * SSE is a persistent HTTP connection that allows the server to push
 * updates to the client in real-time.
 */
export async function getJinaMCPClient() {
  if (!mcpClient) {
    // Get MCP URL from environment or use default
    const mcpUrl = serverEnv.JINA_MCP_URL || 'https://mcp.jina.ai/sse'
    
    // Require API key
    const apiKey = serverEnv.JINA_API_KEY
    if (!apiKey) {
      throw new Error('JINA_API_KEY is required for Jina MCP')
    }

    // Sanitize URL for logging (no secrets)
    const sanitizedUrl = mcpUrl
    
    console.log('[MCP] Connecting to Jina AI MCP server at:', sanitizedUrl)
    console.log('[MCP] Transport type: SSE (Server-Sent Events)')
    console.log('[MCP] API key configured:', apiKey ? '✓ Yes' : '✗ No')

    try {
      mcpClient = await createMCPClient({
        transport: {
          type: 'sse', // SSE transport for real-time communication
          url: mcpUrl,
          headers: {
            // Jina AI uses Bearer token authentication
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      })

      console.log('[MCP] ✓ Connected to Jina AI MCP server')
    } catch (error) {
      console.error('[MCP] ✗ Failed to connect to Jina AI MCP server:', error)
      console.error('[MCP] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        url: sanitizedUrl,
        transport: 'sse',
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
 * Get MCP tools from Jina AI MCP server
 * Implements 10-second timeout to prevent hanging
 */
export async function getJinaTools() {
  try {
    const client = await getJinaMCPClient()

    // Load tools with timeout protection
    const toolsPromise = client.tools()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Jina AI MCP server timeout after 10s')), 10000)
    )

    const tools = await Promise.race([toolsPromise, timeoutPromise]) as Record<string, any>

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] ✓ Loaded ${toolCount} tools from Jina AI MCP server`)

    // Verify we got tools
    if (toolCount === 0) {
      console.warn('[MCP] ⚠️ Warning: No tools loaded from Jina AI MCP server')
      console.warn('[MCP] This may indicate:')
      console.warn('[MCP]   - Incorrect API key')
      console.warn('[MCP]   - Server not responding with tool definitions')
      console.warn('[MCP]   - SSE connection failure')
      // Reset client and throw to trigger fallback
      mcpClient = null
      throw new Error('No tools available from Jina AI MCP server')
    }

    // Log available tool names for debugging
    console.log('[MCP] Jina AI tools:', Object.keys(tools).join(', '))

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] ✗ Failed to load tools from Jina AI MCP server:', {
      error: errorMessage,
      suggestion: 'Check JINA_API_KEY and JINA_MCP_URL in .env.local',
    })

    // Reset client on failure
    mcpClient = null
    throw new Error(`Jina AI MCP server unavailable: ${errorMessage}`)
  }
}

/**
 * Close the Jina AI MCP client connection
 * Should be called when shutting down the application
 */
export async function closeJinaMCPClient() {
  if (mcpClient) {
    try {
      await mcpClient.close()
      mcpClient = null
      console.log('[MCP] Closed Jina AI MCP client connection')
    } catch (error) {
      console.error('[MCP] Error closing Jina client:', error)
    }
  }
}

