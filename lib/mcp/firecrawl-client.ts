/**
 * Firecrawl MCP Client Configuration
 * 
 * Connects to the Firecrawl MCP server for web scraping and content extraction
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { mcpFirecrawlTools } from './firecrawl/index'

/**
 * Get MCP tools from Firecrawl MCP server using generated mcp-to-ai-sdk wrapper
 */
export async function getFirecrawlTools() {
  return mcpFirecrawlTools;
}

// Deprecated functions
export async function getFirecrawlMCPClient() {
  return null
}

export async function closeFirecrawlMCPClient() {
  // No-op
}
