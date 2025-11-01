/**
 * DataForSEO MCP Client Configuration
 * 
 * Connects to the DataForSEO MCP server to access 40+ SEO tools
 * with simplified filter schema for LLM compatibility
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { serverEnv } from '@/lib/config/env'

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null

/**
 * Get or create the DataForSEO MCP client instance
 * Uses HTTP transport to connect to the MCP server
 */
export async function getDataForSEOMCPClient() {
  if (!mcpClient) {
    const mcpUrl = serverEnv.DATAFORSEO_MCP_URL || 'http://localhost:3000/mcp'
    
    console.log('[MCP] Connecting to DataForSEO MCP server at:', mcpUrl)
    
    mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: mcpUrl,
        // Basic auth using DataForSEO credentials
        headers: {
          'Authorization': `Basic ${Buffer.from(`${serverEnv.DATAFORSEO_LOGIN}:${serverEnv.DATAFORSEO_PASSWORD}`).toString('base64')}`,
        },
      },
    })
    
    console.log('[MCP] Connected to DataForSEO MCP server')
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
  const client = await getDataForSEOMCPClient()
  
  // Get tools from MCP server
  // The server will return simplified schemas if DATAFORSEO_SIMPLE_FILTER=true is set
  const tools = await client.tools()
  
  console.log(`[MCP] Loaded ${Object.keys(tools).length} tools from DataForSEO MCP server`)
  
  return tools
}

/**
 * Close the MCP client connection
 * Should be called when shutting down the application
 */
export async function closeDataForSEOMCPClient() {
  if (mcpClient) {
    await mcpClient.close()
    mcpClient = null
    console.log('[MCP] Closed DataForSEO MCP client connection')
  }
}

