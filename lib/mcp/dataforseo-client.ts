/**
 * DataForSEO MCP Client Configuration
 * 
 * Connects to the DataForSEO MCP server to access 40+ SEO tools
 * with simplified filter schema for LLM compatibility
 * 
 * Note: Compatible with Edge runtime - uses Web APIs instead of Node.js APIs
 */

import { mcpDataforseoTools } from './dataforseo/index'

/**
 * Get MCP tools from DataForSEO MCP server using generated mcp-to-ai-sdk wrapper
 */
export async function getDataForSEOTools() {
  return mcpDataforseoTools;
}

