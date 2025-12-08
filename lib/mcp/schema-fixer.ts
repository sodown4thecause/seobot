/**
 * MCP Tool Schema Fixer
 * 
 * Fixes MCP-generated tools to ensure they have proper object schemas
 * that are compatible with AI SDK 6 and Vercel AI Gateway
 */

import { z } from 'zod'
import type { Tool } from 'ai'

/**
 * Fixes MCP tool schemas to ensure they use proper object types
 * This addresses the "toolConfig.tools.0.toolSpec.inputSchema.json.type must be one of the following: object" error
 */
export function fixMCPToolSchemas(tools: Record<string, Tool>): Record<string, Tool> {
  const fixedTools: Record<string, Tool> = {}

  for (const [name, tool] of Object.entries(tools)) {
    try {
      const fixedTool = fixSingleToolSchema(tool, name)
      if (fixedTool) {
        fixedTools[name] = fixedTool
      } else {
        console.warn(`[Schema Fixer] Failed to fix tool: ${name}`)
      }
    } catch (error) {
      console.error(`[Schema Fixer] Error fixing tool ${name}:`, error)
    }
  }

  console.log(`[Schema Fixer] Fixed ${Object.keys(fixedTools).length}/${Object.keys(tools).length} tools`)
  return fixedTools
}

/**
 * Fixes a single tool's schema
 */
function fixSingleToolSchema(tool: Tool, toolName: string): Tool | null {
  try {
    if (!tool.parameters) {
      console.warn(`[Schema Fixer] Tool ${toolName} has no parameters`)
      return {
        ...tool,
        parameters: z.object({})
      }
    }

    // Check if parameters is already a proper Zod object schema
    const paramType = (tool.parameters as any)._def?.typeName
    
    if (paramType === 'ZodObject') {
      // Already a proper object schema
      return tool
    }

    // Try to extract and fix the schema
    let fixedParameters: z.ZodSchema

    if (paramType === 'ZodUnion') {
      // Handle union types by converting to object
      fixedParameters = convertUnionToObject(tool.parameters as any, toolName)
    } else if (paramType === 'ZodArray') {
      // Handle array types by wrapping in object
      fixedParameters = z.object({
        items: tool.parameters
      })
    } else if (paramType === 'ZodString' || paramType === 'ZodNumber' || paramType === 'ZodBoolean') {
      // Handle primitive types by wrapping in object
      fixedParameters = z.object({
        value: tool.parameters
      })
    } else {
      // For unknown types, try to wrap in object
      console.warn(`[Schema Fixer] Unknown parameter type ${paramType} for tool ${toolName}, wrapping in object`)
      fixedParameters = z.object({
        parameters: tool.parameters
      })
    }

    return {
      ...tool,
      parameters: fixedParameters
    }
  } catch (error) {
    console.error(`[Schema Fixer] Failed to fix schema for tool ${toolName}:`, error)
    return null
  }
}

/**
 * Converts union types to object schemas
 */
function convertUnionToObject(unionSchema: any, toolName: string): z.ZodSchema {
  try {
    const options = unionSchema._def?.options || []
    
    // If one of the options is already an object, use it
    for (const option of options) {
      if (option._def?.typeName === 'ZodObject') {
        return option
      }
    }

    // Otherwise, create a new object schema based on the union
    console.warn(`[Schema Fixer] Converting union to object for tool ${toolName}`)
    return z.object({
      value: unionSchema
    })
  } catch (error) {
    console.error(`[Schema Fixer] Failed to convert union to object for ${toolName}:`, error)
    return z.object({
      query: z.string().describe('Input parameter')
    })
  }
}

/**
 * Creates fallback schemas for specific tool types
 */
export function createFallbackSchemas(): Record<string, z.ZodSchema> {
  return {
    // Search tools
    search_web: z.object({
      query: z.union([z.string(), z.array(z.string())]).describe('Search query or array of queries'),
      num: z.number().default(30).describe('Number of results'),
      location: z.string().optional().describe('Location for search'),
      tbs: z.string().optional().describe('Time-based search parameter')
    }),
    
    read_url: z.object({
      url: z.string().describe('URL to read'),
      include_links: z.boolean().optional().describe('Include links in response')
    }),

    // SEO tools
    on_page_lighthouse: z.object({
      url: z.string().describe('URL to analyze'),
      enable_javascript: z.boolean().optional().describe('Enable JavaScript rendering'),
      custom_user_agent: z.string().optional().describe('Custom User-Agent header')
    }),

    keywords_data_google_ads_search_volume: z.object({
      keywords: z.array(z.string()).describe('Keywords to analyze'),
      location: z.string().optional().describe('Location for data'),
      language: z.string().optional().describe('Language code')
    }),

    serp_organic_live_advanced: z.object({
      keyword: z.string().describe('Search keyword'),
      location: z.string().optional().describe('Location for SERP'),
      language: z.string().optional().describe('Language code')
    }),

    // Firecrawl tools
    firecrawl_scrape: z.object({
      url: z.string().describe('URL to scrape'),
      formats: z.array(z.string()).optional().describe('Output formats'),
      includeTags: z.array(z.string()).optional().describe('HTML tags to include')
    }),

    firecrawl_search: z.object({
      query: z.string().describe('Search query'),
      limit: z.number().optional().describe('Number of results')
    }),

    // Generic fallback
    default: z.object({
      query: z.string().describe('Input query or parameter')
    })
  }
}

/**
 * Applies fallback schemas to tools that fail to fix
 */
export function applyFallbackSchemas(
  tools: Record<string, Tool>,
  fallbackSchemas: Record<string, z.ZodSchema> = createFallbackSchemas()
): Record<string, Tool> {
  const fixedTools: Record<string, Tool> = {}

  for (const [name, tool] of Object.entries(tools)) {
    try {
      // First try the normal fix
      const fixedTool = fixSingleToolSchema(tool, name)
      
      if (fixedTool) {
        fixedTools[name] = fixedTool
      } else {
        // Apply fallback schema
        const fallbackSchema = fallbackSchemas[name] || fallbackSchemas.default
        fixedTools[name] = {
          ...tool,
          parameters: fallbackSchema
        }
        console.log(`[Schema Fixer] Applied fallback schema for tool: ${name}`)
      }
    } catch (error) {
      // Last resort: use default schema
      console.error(`[Schema Fixer] Failed to fix tool ${name}, using default schema:`, error)
      fixedTools[name] = {
        ...tool,
        parameters: fallbackSchemas.default
      }
    }
  }

  return fixedTools
}

/**
 * Validates that all tools have proper object schemas
 */
export function validateFixedTools(tools: Record<string, Tool>): {
  valid: string[]
  invalid: string[]
} {
  const valid: string[] = []
  const invalid: string[] = []

  for (const [name, tool] of Object.entries(tools)) {
    const paramType = (tool.parameters as any)?._def?.typeName
    
    if (paramType === 'ZodObject') {
      valid.push(name)
    } else {
      invalid.push(name)
      console.error(`[Schema Validator] Tool ${name} still has invalid schema type: ${paramType}`)
    }
  }

  console.log(`[Schema Validator] ${valid.length}/${Object.keys(tools).length} tools have valid object schemas`)
  
  return { valid, invalid }
}

/**
 * Main function to fix all MCP tools
 */
export function fixAllMCPTools(
  allTools: Record<string, Tool>,
  useStrictValidation = false
): Record<string, Tool> {
  console.log(`[Schema Fixer] Starting to fix ${Object.keys(allTools).length} MCP tools`)

  // Step 1: Try to fix existing schemas
  const fixedTools = fixMCPToolSchemas(allTools)

  // Step 2: Apply fallbacks for any that failed
  // IMPORTANT: Pass original allTools so tools that failed in step 1 can receive fallback schemas
  let finalTools = fixedTools
  if (!useStrictValidation) {
    finalTools = applyFallbackSchemas(allTools)
  }

  // Step 3: Validate results
  const validation = validateFixedTools(finalTools)

  if (validation.invalid.length > 0) {
    console.error(`[Schema Fixer] ${validation.invalid.length} tools still have invalid schemas:`, validation.invalid)
  }

  return finalTools
}