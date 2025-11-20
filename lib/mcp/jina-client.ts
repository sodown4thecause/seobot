/**
 * Jina MCP Client Configuration
 * 
 * Connects to the Jina AI MCP server for web search and content processing
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { mcpJinaTools } from './jina/index'

/**
 * Get MCP tools from Jina MCP server using generated mcp-to-ai-sdk wrapper
 */
export async function getJinaTools() {
  // Check if API key is configured to avoid connection errors
  // The generated client will handle the connection
  return mcpJinaTools;
}

// Deprecated functions
export async function getJinaMCPClient() {
  return null
}

export async function closeJinaMCPClient() {
  // No-op
}
