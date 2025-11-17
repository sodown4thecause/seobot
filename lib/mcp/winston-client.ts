/**
 * Winston AI MCP Client Configuration
 * 
 * Connects to the Winston AI MCP server for plagiarism detection and content validation.
 * 
 * IMPORTANT: Winston AI uses JSON-RPC 2.0 protocol. The API key is NOT passed in headers,
 * but rather as an "apiKey" parameter in each tool call. The connection itself requires
 * no authentication.
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { serverEnv } from '@/lib/config/env'

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

/**
 * Get or create the Winston AI MCP client instance
 * Uses HTTP transport (JSON-RPC 2.0) to connect to the MCP server
 * 
 * Winston AI's MCP server requires API key per tool invocation, not at connection time.
 */
export async function getWinstonMCPClient() {
  if (!mcpClient) {
    const mcpUrl = serverEnv.WINSTON_MCP_URL || 'https://api.gowinston.ai/mcp/v1'

    // Verify API key is configured (needed for tool calls, not connection)
    const apiKey = serverEnv.WINSTON_AI_API_KEY
    if (!apiKey) {
      throw new Error('WINSTON_AI_API_KEY is required for Winston AI MCP tools')
    }

    console.log('[MCP] Connecting to Winston AI MCP server at:', mcpUrl)
    console.log('[MCP] API key configured:', apiKey ? '✓ Yes' : '✗ No')
    console.log('[MCP] Note: Winston uses JSON-RPC 2.0 - API key passed per tool call')

    try {
      mcpClient = await createMCPClient({
        transport: {
          type: 'http',
          url: mcpUrl,
          // NO Authorization header - Winston passes API key in tool arguments
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      })

      console.log('[MCP] ✓ Connected to Winston AI MCP server')
    } catch (error) {
      console.error('[MCP] ✗ Failed to connect to Winston AI MCP server:', error)
      console.error('[MCP] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        url: mcpUrl,
        hasApiKey: !!apiKey,
      })
      // Reset client on failure
      mcpClient = null
      throw error
    }
  }

  return mcpClient
}

/**
 * Get MCP tools from Winston AI MCP server
 * Implements 10-second timeout to prevent hanging
 * 
 * Tools returned will expect an "apiKey" argument in their parameters.
 * The API key should be injected by the calling code (codemode or chat handler).
 */
export async function getWinstonTools() {
  try {
    const client = await getWinstonMCPClient()

    // Load tools with timeout protection
    const toolsPromise = client.tools()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Winston AI MCP server timeout after 10s')), 10000)
    )

    const tools = await Promise.race([toolsPromise, timeoutPromise]) as Record<string, any>

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] ✓ Loaded ${toolCount} tools from Winston AI MCP server`)

    // Verify we got tools
    if (toolCount === 0) {
      console.warn('[MCP] ⚠️ Warning: No tools loaded from Winston AI MCP server')
      console.warn('[MCP] This may indicate:')
      console.warn('[MCP]   - Server not responding with tool definitions')
      console.warn('[MCP]   - JSON-RPC protocol mismatch')
      console.warn('[MCP]   - Network connectivity issues')
      // Reset client and throw to trigger fallback
      mcpClient = null
      throw new Error('No tools available from Winston AI MCP server')
    }

    // Log available tool names for debugging
    console.log('[MCP] Winston AI tools:', Object.keys(tools).join(', '))
    console.log('[MCP] Note: Each tool requires "apiKey" parameter from WINSTON_AI_API_KEY')

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] ✗ Failed to load tools from Winston AI MCP server:', {
      error: errorMessage,
      suggestion: 'Check WINSTON_AI_API_KEY in .env.local and verify server is accessible',
    })

    // Reset client on failure
    mcpClient = null
    
    // Return empty tools object instead of throwing - allows app to continue without Winston
    console.log('[MCP] ⚠️ Winston AI unavailable - continuing without Winston tools')
    return {}
  }
}

/**
 * Close the Winston AI MCP client connection
 */
export async function closeWinstonMCPClient() {
  if (mcpClient) {
    try {
      await mcpClient.close()
      mcpClient = null
      console.log('[MCP] Closed Winston AI MCP client connection')
    } catch (error) {
      console.error('[MCP] Error closing Winston client:', error)
    }
  }
}

