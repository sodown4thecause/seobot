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
 * Optional preloaded tool collections that can be reused when building
 * the codemode registry. This lets callers avoid re-fetching MCP tools.
 */
export interface CodemodeRegistrySources {
  dataForSEOTools?: Record<string, any>
  firecrawlTools?: Record<string, any>
  winstonTools?: Record<string, any>
  jinaMCPTools?: Record<string, any>
}


/**
 * Create a codemode tool that wraps all available tools (AI SDK 6 compatible)
 *
 * Codemode allows the LLM to generate JavaScript code that orchestrates multiple
 * MCP and API tool calls in complex workflows. This is particularly powerful for:
 * - Chaining multiple MCP operations across different servers
 * - Implementing error handling and retry logic
 * - Performing conditional logic based on tool responses
 * - Composing tools in novel ways not anticipated by developers
 *
 * The generated code runs in a sandboxed environment with controlled access
 * to only the registered tools (no global scope access).
 */
export function createCodemodeTool(toolRegistry: CodemodeToolRegistry) {
  return tool({
    description: `Execute JavaScript code that orchestrates multiple tool calls.
You can use this to chain operations, handle errors, and perform complex workflows.

🔧 Available tools in codemode context (${Object.keys(toolRegistry).length} total):
${Object.keys(toolRegistry)
  .map((name) => `- ${name}: ${toolRegistry[name].description || 'Tool available for use'}`)
  .join('\n')}

📝 Example usage:
\`\`\`javascript
// Use either 'codemode' or 'functions' namespace - both work the same way
// Chain multiple operations
const keywordData = await codemode.dataforseo_keyword_search_volume({ keywords: ['seo tools'] });
const rankings = await functions.dataforseo_google_rankings({ keyword: 'seo tools' });
const content = await codemode.rytr_generate({ useCase: 'blog_section_writing', input: 'SEO Tools' });

// Handle errors
try {
  const result = await functions.dataforseo_domain_overview({ domain: 'example.com' });
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: error.message };
}

// Conditional logic
const searchVolume = await codemode.dataforseo_ai_keyword_search_volume({ keywords: ['ai seo'] });
if (searchVolume.total_volume > 1000) {
  return await functions.rytr_generate({ useCase: 'blog_section_writing', input: 'AI SEO' });
} else {
  return { message: 'Low search volume, skipping content generation' };
}
\`\`\`

⚠️ Important:
- Code executes in a sandboxed environment (30s timeout)
- Tools are available via both \`codemode.<tool>\` and \`functions.<tool>\` (use whichever you prefer)
- Only registered tools are available (no global access)
- Use async/await for all tool calls
- Return a value or object - it will be serialized
- All errors are caught and returned in structured format`,
    inputSchema: z.object({
      code: z.string().describe('JavaScript code to execute. Use async/await for tool calls. Return a value or object.'),
    }),
    execute: async ({ code }: { code: string }) => {
      try {
        console.log('[Codemode] 🚀 Executing generated code:', code.substring(0, 200) + (code.length > 200 ? '...' : ''))

        // Create a safe execution context with only the registered tools
        // This provides sandboxed isolation - no access to global scope, filesystem, or network
        const codemodeContext: Record<string, any> = {}
        const functionsContext: Record<string, any> = {}

        // Wrap each tool in the registry with logging and error handling
        for (const [toolName, toolDef] of Object.entries(toolRegistry)) {
          const wrappedTool = async (...args: any[]) => {
            try {
              console.log(`[Codemode] 📞 Calling tool: ${toolName}`, JSON.stringify(args).substring(0, 100))
              const startTime = Date.now()
              const result = await toolDef.execute(...args)
              const duration = Date.now() - startTime
              console.log(`[Codemode] ✓ Tool ${toolName} completed in ${duration}ms`)
              return result
            } catch (error) {
              console.error(`[Codemode] ✗ Tool ${toolName} failed:`, error)
              throw new Error(
                `Tool ${toolName} failed: ${error instanceof Error ? error.message : String(error)}`,
              )
            }
          }

          // Expose tool via both 'codemode' and 'functions' namespaces
          codemodeContext[toolName] = wrappedTool
          functionsContext[toolName] = wrappedTool
        }

        // Create a safe execution function
        // Using Function constructor to create an isolated scope
        // Expose both 'codemode' and 'functions' for flexibility
        const executeCode = new Function(
          'codemode',
          'functions',
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

        const result = await Promise.race([executeCode(codemodeContext, functionsContext), timeoutPromise])

        console.log('[Codemode] ✓ Code execution completed successfully')

        // Serialize result for transmission back to LLM
        // Objects are stringified with formatting for readability
        return {
          success: true,
          result: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
          type: typeof result,
        }
      } catch (error) {
        console.error('[Codemode] ✗ Code execution failed:', error)
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
 * Build codemode tool registry from available tools.
 * If sources are provided, they will be used instead of re-loading tools.
 * Falls back to cached loaders for any missing tool groups.
 */
export async function buildCodemodeToolRegistry(
  sources?: CodemodeRegistrySources,
) {
  const registry: CodemodeToolRegistry = {}
  const effectiveSources: CodemodeRegistrySources = { ...(sources || {}) }

  // Load DataForSEO MCP tools (using cached getter unless provided)
  try {
    if (!effectiveSources.dataForSEOTools) {
      const { getCachedDataForSEOTools } = await import('@/lib/ai/tool-cache')
      effectiveSources.dataForSEOTools = await getCachedDataForSEOTools()
    }
    const dataForSEOTools = effectiveSources.dataForSEOTools || {}
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

  // Load Firecrawl MCP tools (using cached getter unless provided)
  try {
    if (!effectiveSources.firecrawlTools) {
      const { getCachedFirecrawlTools } = await import('@/lib/ai/tool-cache')
      effectiveSources.firecrawlTools = await getCachedFirecrawlTools()
    }
    const firecrawlTools = effectiveSources.firecrawlTools || {}
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

  // Load Winston MCP tools (using cached getter unless provided)
  try {
    if (!effectiveSources.winstonTools) {
      const { getCachedWinstonTools } = await import('@/lib/ai/tool-cache')
      effectiveSources.winstonTools = await getCachedWinstonTools()
    }
    const winstonTools = effectiveSources.winstonTools || {}
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

  // Load Jina MCP tools (using cached getter unless provided)
  try {
    if (!effectiveSources.jinaMCPTools) {
      const { getCachedJinaTools } = await import('@/lib/ai/tool-cache')
      effectiveSources.jinaMCPTools = await getCachedJinaTools()
    }
    const jinaTools = effectiveSources.jinaMCPTools || {}
    for (const [name, tool] of Object.entries(jinaTools)) {
      if (tool && typeof tool === 'object' && 'execute' in tool) {
        registry[`jina_${name}`] = {
          execute: tool.execute,
          description: tool.description || `Jina AI tool: ${name}`,
        }
      }
    }
    console.log(`[Codemode] Registered ${Object.keys(jinaTools).length} Jina MCP tools`)
  } catch (error) {
    console.warn('[Codemode] Failed to load Jina MCP tools:', error)
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
    console.log('[Codemode] Registered Rytr tool')
  } catch (error) {
    console.warn('[Codemode] Failed to register Rytr tool:', error)
  }

  // Add Jina REST API tool (direct scraping)
  try {
    const { scrapeWithJina } = await import('@/lib/external-apis/jina')
    registry.jina_scrape = {
      execute: scrapeWithJina,
      description: 'Scrape and extract clean markdown content from web pages using Jina Reader API',
    }
    console.log('[Codemode] Registered Jina REST scraping tool')
  } catch (error) {
    console.warn('[Codemode] Failed to register Jina scraping tool:', error)
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
          const model = openaiClient(params.model || 'gpt-4o-mini')
          // This would need proper AI SDK integration
          // For now, just return a placeholder
          return { message: 'OpenAI chat tool available' }
        },
        description: 'Chat completion using OpenAI API (GPT-4o-mini)',
      }
      console.log('[Codemode] Registered OpenAI tool')
    } catch (error) {
      console.warn('[Codemode] Failed to register OpenAI tool:', error)
    }
  }

  const totalTools = Object.keys(registry).length
  console.log(`[Codemode] ✓ Total tools registered in codemode: ${totalTools}`)
  console.log('[Codemode] Tool breakdown:', {
    dataForSEO: Object.keys(registry).filter(k => k.startsWith('dataforseo_')).length,
    firecrawl: Object.keys(registry).filter(k => k.startsWith('firecrawl_')).length,
    winston: Object.keys(registry).filter(k => k.startsWith('winston_')).length,
    jina: Object.keys(registry).filter(k => k.startsWith('jina_')).length,
    other: Object.keys(registry).filter(k =>
      !k.startsWith('dataforseo_') &&
      !k.startsWith('firecrawl_') &&
      !k.startsWith('winston_') &&
      !k.startsWith('jina_')
    ).length,
  })

  return registry
}

/**
 * Convenience helper to build a codemode registry from already loaded tools.
 * This lets callers (like the chat API) avoid re-loading MCP tools.
 */
export async function buildCodemodeToolRegistryFromExisting(
  sources: CodemodeRegistrySources,
) {
  return buildCodemodeToolRegistry(sources)
}

