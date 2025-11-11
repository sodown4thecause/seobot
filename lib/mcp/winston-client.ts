/**
 * Winston AI MCP Client Configuration
 * 
 * Connects to the Winston AI MCP server for plagiarism detection and content validation
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { serverEnv } from '@/lib/config/env'

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

/**
 * Get or create the Winston AI MCP client instance
 * Uses HTTP transport to connect to the MCP server
 */
export async function getWinstonMCPClient() {
  if (!mcpClient) {
    const mcpUrl = serverEnv.WINSTON_MCP_URL || 'https://api.gowinston.ai/mcp/v1'

    console.log('[MCP] Connecting to Winston AI MCP server at:', mcpUrl)

    try {
      mcpClient = await createMCPClient({
        transport: {
          type: 'http',
          url: mcpUrl,
          headers: {
            'Authorization': `Bearer ${serverEnv.WINSTON_AI_API_KEY}`,
          },
        },
      })

      console.log('[MCP] Connected to Winston AI MCP server')
    } catch (error) {
      console.error('[MCP] Failed to connect to Winston AI MCP server:', error)
      console.error('[MCP] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        url: mcpUrl,
      })
      mcpClient = null
      throw error
    }
  }

  return mcpClient
}

/**
 * Get MCP tools from Winston AI MCP server
 */
export async function getWinstonTools() {
  try {
    const client = await getWinstonMCPClient()

    const toolsPromise = client.tools()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Winston AI MCP server timeout after 10s')), 10000)
    )

    const tools = await Promise.race([toolsPromise, timeoutPromise]) as Record<string, any>

    const toolCount = Object.keys(tools).length
    console.log(`[MCP] Loaded ${toolCount} tools from Winston AI MCP server`)

    if (toolCount === 0) {
      console.warn('[MCP] Warning: No tools loaded from Winston AI MCP server')
      mcpClient = null
      throw new Error('No tools available from Winston AI MCP server')
    }

    return tools
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MCP] Failed to load tools from Winston AI MCP server:', {
      error: errorMessage,
    })

    mcpClient = null
    throw new Error(`Winston AI MCP server unavailable: ${errorMessage}`)
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

