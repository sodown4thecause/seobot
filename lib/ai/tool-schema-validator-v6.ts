/**
 * Tool Schema Validator for AI SDK 6 & Vercel Gateway Compatibility
 * 
 * Validates and sanitizes tool schemas to ensure they pass Vercel AI Gateway validation
 * and are compatible with AI SDK 6 requirements.
 * 
 * Note: AI SDK 6 uses 'parameters' property, but we support 'inputSchema' for backward compatibility
 */

import { z } from 'zod'
import type { Tool } from 'ai'

export interface ToolValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedTool?: Tool
}

export interface ToolValidationOptions {
  strictMode?: boolean
  fixInvalidSchemas?: boolean
  logErrors?: boolean
}

/**
 * Validates a tool schema against AI SDK 6 and Vercel Gateway requirements
 */
export function validateToolSchema(
  tool: Tool,
  options: ToolValidationOptions = {}
): ToolValidationResult {
  const { strictMode = false, fixInvalidSchemas = true, logErrors = true } = options
  const errors: string[] = []
  const warnings: string[] = []
  let sanitizedTool: Tool | undefined = undefined

  try {
    // Check basic tool structure
    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool must have a non-empty description string')
    }

    // Support both parameters (AI SDK 6) and inputSchema (Legacy/Custom)
    const schema = tool.parameters || (tool as any).inputSchema
    
    if (!schema) {
      errors.push('Tool must have parameters (or inputSchema) object')
    }

    // Validate schema structure
    if (schema) {
      // Check if we're validating parameters or inputSchema
      const isParameters = !!tool.parameters
      
      const schemaValidation = validateInputSchema(schema, strictMode)
      errors.push(...schemaValidation.errors)
      warnings.push(...schemaValidation.warnings)

      if (fixInvalidSchemas && schemaValidation.sanitizedSchema) {
        sanitizedTool = {
          ...tool,
          // Always set parameters for AI SDK 6 compatibility
          parameters: schemaValidation.sanitizedSchema,
          // If we found inputSchema, keep it for backward compatibility
          ...(!isParameters ? { inputSchema: schemaValidation.sanitizedSchema } : {})
        }
      }
    }

    // Check execute function (optional in AI SDK 6)
    if (tool.execute && typeof tool.execute !== 'function') {
      errors.push('Tool execute must be a function if provided')
    }

    const isValid = errors.length === 0

    if (logErrors && errors.length > 0) {
      console.error(`[Tool Validation] Tool "${tool.description?.slice(0, 50)}..." failed validation:`, errors)
    }

    if (logErrors && warnings.length > 0) {
      console.warn(`[Tool Validation] Tool "${tool.description?.slice(0, 50)}..." has warnings:`, warnings)
    }

    return {
      isValid,
      errors,
      warnings,
      sanitizedTool: sanitizedTool || (isValid ? tool : undefined)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error'
    errors.push(`Validation error: ${errorMessage}`)
    
    if (logErrors) {
      console.error(`[Tool Validation] Exception validating tool:`, error)
    }

    return {
      isValid: false,
      errors,
      warnings,
      sanitizedTool: undefined
    }
  }
}

/**
 * Validates and sanitizes a Zod inputSchema
 */
function validateInputSchema(
  schema: z.ZodSchema,
  strictMode: boolean
): { errors: string[]; warnings: string[]; sanitizedSchema?: z.ZodSchema } {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Try to get the JSON schema representation
    const jsonSchema = getJsonSchema(schema)
    
    // Validate root type is 'object'
    if (jsonSchema.type !== 'object') {
      if (strictMode) {
        errors.push(`Root schema type must be 'object', got '${jsonSchema.type}'`)
      } else {
        warnings.push(`Root schema type should be 'object', got '${jsonSchema.type}'. Will attempt to fix.`)
        
        // Try to wrap in object if it's not already
        const sanitizedSchema = wrapInObjectSchema(schema)
        return {
          errors,
          warnings,
          sanitizedSchema
        }
      }
    }

    // Validate properties exist for object schemas
    if (jsonSchema.type === 'object' && (!jsonSchema.properties || typeof jsonSchema.properties !== 'object')) {
      if (strictMode) {
        errors.push('Object schema must have properties')
      } else {
        warnings.push('Object schema should have properties')
      }
    }

    return {
      errors,
      warnings,
      sanitizedSchema: errors.length === 0 ? schema : undefined
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Schema parsing error'
    errors.push(`Failed to parse schema: ${errorMessage}`)
    return { errors, warnings }
  }
}

/**
 * Attempts to get JSON schema from Zod schema
 */
function getJsonSchema(zodSchema: z.ZodSchema): any {
  try {
    // For AI SDK 6, we need to extract the schema structure
    const schemaType = (zodSchema as any)._def?.typeName
    
    if (schemaType === 'ZodObject') {
      return {
        type: 'object',
        properties: (zodSchema as any)._def?.shape || {},
        required: Object.keys((zodSchema as any)._def?.shape || {}),
        additionalProperties: false
      }
    }
    
    // For other types, assume they need to be wrapped
    return {
      type: schemaType?.toLowerCase().replace('zod', '') || 'unknown',
      additionalProperties: false
    }
  } catch (error) {
    throw new Error(`Failed to extract JSON schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Wraps a non-object schema in an object schema
 */
function wrapInObjectSchema(schema: z.ZodSchema): z.ZodSchema {
  // If it's already an object schema, return as-is
  if ((schema as any)._def?.typeName === 'ZodObject') {
    return schema
  }

  // Wrap in an object with a 'value' property
  return z.object({
    value: schema
  })
}

/**
 * Validates multiple tools and returns only valid ones
 */
export function validateToolsCollection(
  tools: Record<string, Tool>,
  options: ToolValidationOptions = {}
): {
  validTools: Record<string, Tool>
  invalidTools: string[]
  validationResults: Record<string, ToolValidationResult>
} {
  const validTools: Record<string, Tool> = {}
  const invalidTools: string[] = []
  const validationResults: Record<string, ToolValidationResult> = {}

  for (const [name, tool] of Object.entries(tools)) {
    const result = validateToolSchema(tool, options)
    validationResults[name] = result

    if (result.isValid && result.sanitizedTool) {
      validTools[name] = result.sanitizedTool
    } else {
      invalidTools.push(name)
      if (options.logErrors) {
        console.error(`[Tool Collection] Tool "${name}" is invalid:`, result.errors)
      }
    }
  }

  const validCount = Object.keys(validTools).length
  const totalCount = Object.keys(tools).length
  
  if (options.logErrors && invalidTools.length > 0) {
    console.warn(`[Tool Collection] ${validCount}/${totalCount} tools are valid. Invalid tools: ${invalidTools.join(', ')}`)
  }

  return {
    validTools,
    invalidTools,
    validationResults
  }
}

/**
 * Creates a safe tool wrapper that handles validation errors gracefully
 */
export function createSafeTool(
  tool: Tool,
  fallbackMessage: string = 'This tool is temporarily unavailable'
): Tool {
  const validation = validateToolSchema(tool, { fixInvalidSchemas: true, logErrors: false })
  
  if (validation.isValid && validation.sanitizedTool) {
    return validation.sanitizedTool
  }

  // Return a safe fallback tool
  return {
    description: tool.description || 'Fallback tool',
    parameters: z.object({
      query: z.string().describe('User query')
    }),
    execute: async () => {
      return fallbackMessage
    }
  }
}

/**
 * Essential tool names that should always be included
 */
export const ESSENTIAL_TOOL_NAMES = [
  'search_web',
  'read_url',
  'on_page_lighthouse',
  'keywords_data_google_ads_search_volume',
  'serp_organic_live_advanced',
  'firecrawl_scrape',
  'generate_researched_content',
  'client_ui',
  'perplexity_search'
] as const

/**
 * Loads only essential tools to avoid gateway limits
 */
export function loadEssentialTools(
  allTools: Record<string, Tool>,
  essentialNames: readonly string[] = ESSENTIAL_TOOL_NAMES
): Record<string, Tool> {
  const essentialTools: Record<string, Tool> = {}

  for (const name of essentialNames) {
    if (allTools[name]) {
      // We trust the tools are valid/fixed by this point (e.g. via fixAllMCPTools)
      // Avoid re-validating/sanitizing to prevent potential object spread issues
      essentialTools[name] = allTools[name]
    }
  }

  console.log(`[Essential Tools] Loaded ${Object.keys(essentialTools).length}/${essentialNames.length} essential tools`)
  
  return essentialTools
}
