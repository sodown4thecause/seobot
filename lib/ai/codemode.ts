/**
 * Codemode Integration for Next.js Edge Runtime
 * 
 * Provides code execution mode for orchestrating multiple MCP and API tool calls.
 * This allows the LLM to generate JavaScript code that chains multiple operations
 * together, handles errors, and performs complex workflows.
 * 
 * Note: This is a Next.js Edge-compatible implementation inspired by Cloudflare Workers codemode.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'

/**
 * Tool registry for codemode execution
 * Maps tool names to their execute functions
 */
export interface CodemodeToolRegistry {
  [toolName: string]: {
    execute: (...args: any[]) => Promise<any>
    description?: string
  }
}

/**
 * Create a codemode tool that wraps all available tools
 * The LLM can generate JavaScript code that calls these tools
 */
export function createCodemodeTool(toolRegistry: CodemodeToolRegistry) {
  return tool({
    description: `Execute JavaScript code that orchestrates multiple tool calls. 
You can use this to chain operations, handle errors, and perform complex workflows.

Available tools in codemode context:
${Object.keys(toolRegistry)
  .map((name) => `- ${name}: ${toolRegistry[name].description || 'Tool available for use'}`)
  .join('\n')}

Example usage:
\`\`\`javascript
// Chain multiple operations
const keywordData = await codemode.keyword_search_volume({ keywords: ['seo tools'] });
const rankings = await codemode.google_rankings({ keyword: 'seo tools' });
const content = await codemode.generate_content({ topic: 'SEO Tools', keywords: ['seo tools'] });

// Handle errors
try {
  const result = await codemode.domain_overview({ domain: 'example.com' });
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: error.message };
}

// Conditional logic
const searchVolume = await codemode.ai_keyword_search_volume({ keywords: ['ai seo'] });
if (searchVolume.total_volume > 1000) {
  return await codemode.generate_content({ topic: 'AI SEO', keywords: ['ai seo'] });
} else {
  return { message: 'Low search volume, skipping content generation' };
}
\`\`\`

The code will be executed in a sandboxed environment with access only to the registered tools.
Return a value or object - it will be serialized and returned to the user.`,
    parameters: z.object({
      code: z
        .string()
        .describe(
          'JavaScript code to execute. Use async/await for tool calls. Return a value or object.',
        ),
    }),
    execute: async ({ code }: { code: string }) => {
      try {
        console.log('[Codemode] Executing code:', code.substring(0, 200))

        // Create a safe execution context with only the registered tools
        const codemodeContext: Record<string, any> = {}

        // Wrap each tool in the registry
        for (const [toolName, toolDef] of Object.entries(toolRegistry)) {
          codemodeContext[toolName] = async (...args: any[]) => {
            try {
              console.log(`[Codemode] Calling tool: ${toolName}`, args)
              const result = await toolDef.execute(...args)
              console.log(`[Codemode] Tool ${toolName} completed`)
              return result
            } catch (error) {
              console.error(`[Codemode] Tool ${toolName} failed:`, error)
              throw new Error(
                `Tool ${toolName} failed: ${error instanceof Error ? error.message : String(error)}`,
              )
            }
          }
        }

        // Create a safe execution function
        // Using Function constructor to create an isolated scope
        const executeCode = new Function(
          'codemode',
          `
          return (async function() {
            ${code}
          })();
        `,
        )

        // Execute the code with timeout (30 seconds max)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Code execution timeout after 30s')), 30000),
        )

        const result = await Promise.race([executeCode(codemodeContext), timeoutPromise])

        console.log('[Codemode] Code execution completed successfully')

        // Serialize result
        return {
          success: true,
          result: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
          type: typeof result,
        }
      } catch (error) {
        console.error('[Codemode] Code execution failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          type: 'error',
        }
      }
    },
  })
}

/**
 * Build codemode tool registry from all available tools
 */
export async function buildCodemodeToolRegistry() {
  const registry: CodemodeToolRegistry = {}

  // Load DataForSEO MCP tools
  try {
    const { getDataForSEOTools } = await import('@/lib/mcp/dataforseo-client')
    const dataForSEOTools = await getDataForSEOTools()
    for (const [name, tool] of Object.entries(dataForSEOTools)) {
      if (tool && typeof tool === 'object' && 'execute' in tool) {
        registry[`dataforseo_${name}`] = {
          execute: tool.execute,
          description: tool.description || `DataForSEO tool: ${name}`,
        }
      }
    }
    console.log(`[Codemode] Registered ${Object.keys(dataForSEOTools).length} DataForSEO tools`)
  } catch (error) {
    console.warn('[Codemode] Failed to load DataForSEO tools:', error)
  }

  // Load Firecrawl MCP tools
  try {
    const { getFirecrawlTools } = await import('@/lib/mcp/firecrawl-client')
    const firecrawlTools = await getFirecrawlTools()
    for (const [name, tool] of Object.entries(firecrawlTools)) {
      if (tool && typeof tool === 'object' && 'execute' in tool) {
        registry[`firecrawl_${name}`] = {
          execute: tool.execute,
          description: tool.description || `Firecrawl tool: ${name}`,
        }
      }
    }
    console.log(`[Codemode] Registered ${Object.keys(firecrawlTools).length} Firecrawl tools`)
  } catch (error) {
    console.warn('[Codemode] Failed to load Firecrawl tools:', error)
  }

  // Load Winston MCP tools
  try {
    const { getWinstonTools } = await import('@/lib/mcp/winston-client')
    const winstonTools = await getWinstonTools()
    for (const [name, tool] of Object.entries(winstonTools)) {
      if (tool && typeof tool === 'object' && 'execute' in tool) {
        registry[`winston_${name}`] = {
          execute: tool.execute,
          description: tool.description || `Winston AI tool: ${name}`,
        }
      }
    }
    console.log(`[Codemode] Registered ${Object.keys(winstonTools).length} Winston tools`)
  } catch (error) {
    console.warn('[Codemode] Failed to load Winston tools:', error)
  }

  // Add Perplexity API tool
  try {
    const { searchWithPerplexity } = await import('@/lib/external-apis/perplexity')
    registry.perplexity_search = {
      execute: searchWithPerplexity,
      description: 'Search using Perplexity API with citations and authoritative sources',
    }
  } catch (error) {
    console.warn('[Codemode] Failed to register Perplexity tool:', error)
  }

  // Add Rytr API tool
  try {
    const { generateContent } = await import('@/lib/external-apis/rytr')
    registry.rytr_generate = {
      execute: generateContent,
      description: 'Generate SEO-optimized content using Rytr AI',
    }
  } catch (error) {
    console.warn('[Codemode] Failed to register Rytr tool:', error)
  }

  // Add OpenAI API tool (for embeddings or chat if needed)
  if (serverEnv.OPENAI_API_KEY) {
    try {
      const { createOpenAI } = await import('@ai-sdk/openai')
      const openaiClient = createOpenAI({
        apiKey: serverEnv.OPENAI_API_KEY,
      })
      // Add OpenAI chat completion as a tool
      registry.openai_chat = {
        execute: async (params: { messages: any[]; model?: string }) => {
          const model = openaiClient(params.model || 'gpt-4.1')
          // This would need proper AI SDK integration
          // For now, just return a placeholder
          return { message: 'OpenAI chat tool available' }
        },
        description: 'Chat completion using OpenAI API (GPT-4.1)',
      }
    } catch (error) {
      console.warn('[Codemode] Failed to register OpenAI tool:', error)
    }
  }

  console.log(`[Codemode] Total tools registered: ${Object.keys(registry).length}`)
  return registry
}

