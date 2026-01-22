/**
 * Tool Assembler Module
 * 
 * Handles loading and assembling tools based on agent type and intent classification.
 * Consolidates all tool loading logic from the chat route.
 */

import type { Tool } from 'ai'
import { tool } from 'ai'
import { z } from 'zod'
import { getDataForSEOTools } from '@/lib/mcp/dataforseo-client'
import { getFirecrawlTools } from '@/lib/mcp/firecrawl-client'
import { getJinaTools } from '@/lib/mcp/jina-client'
import { getWinstonTools } from '@/lib/mcp/winston-client'
import { loadToolsForAgent, loadToolsForIntents } from '@/lib/ai/tool-schema-validator-v6'
import { fixAllMCPTools } from '@/lib/mcp/schema-fixer'
import { getContentQualityTools } from '@/lib/ai/content-quality-tools'
import { getEnhancedContentQualityTools } from '@/lib/ai/content-quality-enhancements'
import { getAEOTools } from '@/lib/ai/aeo-tools'
import { getAEOPlatformTools } from '@/lib/ai/aeo-platform-tools'
import { searchWithPerplexity } from '@/lib/external-apis/perplexity'
import { researchAgentTool, competitorAgentTool, frameworkRagTool } from '@/lib/agents/tools'
import { onboardingTools } from '@/lib/onboarding/tools'
import { serverEnv } from '@/lib/config/env'
import type { AgentType } from './intent-classifier'

export interface ToolAssemblyOptions {
  agent: AgentType
  intentTools?: string[]
  userId?: string
  request?: Request
}

/**
 * Load MCP tools based on agent type.
 * Returns a record of tool name -> tool definition.
 */
export async function loadMCPTools(agent: AgentType): Promise<Record<string, Tool>> {
  const allMCPTools: Record<string, Tool> = {}

  // Load DataForSEO tools for SEO/AEO and content agents
  if (agent === 'seo-aeo' || agent === 'content') {
    try {
      const dataforSEOTools = await getDataForSEOTools()
      const fixedSEOTools = fixAllMCPTools(dataforSEOTools)
      Object.assign(allMCPTools, fixedSEOTools)
    } catch (error) {
      console.error('[Tool Assembler] Failed to load DataForSEO tools:', error)
    }
  }

  // Load Firecrawl tools for SEO/AEO and Content agents
  if (agent === 'seo-aeo' || agent === 'content') {
    try {
      const firecrawlMCPTools = await getFirecrawlTools()
      const fixedFirecrawlTools = fixAllMCPTools(firecrawlMCPTools)
      Object.assign(allMCPTools, fixedFirecrawlTools)
    } catch (error) {
      console.error('[Tool Assembler] Failed to load Firecrawl tools:', error)
    }
  }

  // Load Jina tools for Content agent
  if (agent === 'content') {
    try {
      const jinaMCPTools = await getJinaTools()
      const fixedJinaTools = fixAllMCPTools(jinaMCPTools)
      Object.assign(allMCPTools, fixedJinaTools)
    } catch (error) {
      console.error('[Tool Assembler] Failed to load Jina tools:', error)
    }
  }

  // Load Winston tools for Content agent (RAG feedback loop)
  if (agent === 'content') {
    try {
      const winstonTools = await getWinstonTools()
      const fixedWinstonTools = fixAllMCPTools(winstonTools)
      Object.assign(allMCPTools, fixedWinstonTools)
    } catch (error) {
      console.error('[Tool Assembler] Failed to load Winston tools:', error)
    }
  }

  return allMCPTools
}

/**
 * Create the N8N backlinks tool for SEO/AEO agent.
 */
export function createBacklinksTool() {
  return tool({
    description: "Fetch backlinks data for a domain using the n8n webhook integration. Use this when the user asks for backlinks, referring domains, link profile, or link building opportunities for a specific domain or website.",
    inputSchema: z.object({
      domain: z.string().describe("The domain to fetch backlinks for (e.g., 'example.com' or 'flowintent.com')"),
    }),
    execute: async ({ domain }) => {
      try {
        const normalizeTargetDomain = (input: string): string | null => {
          const trimmed = input.trim()
          if (!trimmed) return null

          // If user pasted a full URL, extract the hostname.
          const hasScheme = /^https?:\/\//i.test(trimmed)
          const maybeUrl = hasScheme ? trimmed : `https://${trimmed}`
          try {
            const hostname = new URL(maybeUrl).hostname
            return hostname || null
          } catch {
            // Fallback: allow bare domains without scheme (but reject obvious invalids)
            const cleaned = trimmed
              .replace(/^\s+|\s+$/g, '')
              .replace(/^www\./i, '')
            if (!cleaned || cleaned.includes(' ') || !cleaned.includes('.')) return null
            return cleaned
          }
        }

        const normalizedDomain = normalizeTargetDomain(domain)
        if (!normalizedDomain) {
          return {
            status: 'error',
            success: false,
            domain,
            errorMessage: 'Invalid domain. Please provide a domain like example.com',
          }
        }

        console.log('[Tool Assembler] Fetching backlinks for domain via n8n:', {
          input: domain,
          normalized: normalizedDomain,
        })

        const baseUrl = serverEnv.N8N_BACKLINKS_WEBHOOK_URL || 'https://zuded9wg.rcld.app/webhook/domain'
        const webhookUrl = `${baseUrl}?domain=${encodeURIComponent(normalizedDomain)}`

        const response = await fetch(webhookUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[Tool Assembler] N8N backlinks webhook error:', response.status, errorText)
          return {
            status: 'error',
            success: false,
            errorMessage: `Failed to fetch backlinks: ${response.status} ${response.statusText}`,
            error: errorText,
          }
        }

        const data = await response.json()
        console.log('[Tool Assembler] N8N backlinks response received:', {
          domain,
          hasData: !!data,
          isArray: Array.isArray(data),
          dataKeys: data && !Array.isArray(data) && typeof data === 'object' ? Object.keys(data) : [],
          length: Array.isArray(data) ? data.length : undefined,
        })

        return normalizeBacklinksResponse(normalizedDomain, data)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch backlinks data'
        console.error('[Tool Assembler] N8N backlinks tool failed:', error)
        return {
          status: 'error',
          success: false,
          domain,
          errorMessage: message,
        }
      }
    }
  })
}

/**
 * Normalize backlinks response from various API formats.
 */
function normalizeBacklinksResponse(domain: string, data: unknown) {
  // DataForSEO-style responses can return HTTP 200 with an error in-body.
  // Treat those as errors so the UI doesn't silently show "0 backlinks".
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>
    const topStatus = typeof obj.status_code === 'number' ? obj.status_code : undefined
    const tasksError = typeof obj.tasks_error === 'number' ? obj.tasks_error : undefined
    if ((topStatus && topStatus !== 20000) || (tasksError && tasksError > 0)) {
      const firstTask = Array.isArray(obj.tasks) ? (obj.tasks[0] as Record<string, unknown> | undefined) : undefined
      const taskMessage = typeof firstTask?.status_message === 'string' ? firstTask.status_message : undefined
      const taskStatus = typeof firstTask?.status_code === 'number' ? firstTask.status_code : undefined

      return {
        status: 'error',
        success: false,
        domain,
        errorMessage: taskMessage || 'Backlinks provider returned an error',
        providerStatusCode: topStatus,
        providerTaskStatusCode: taskStatus,
      }
    }
  }

  const normalizeUrlHostname = (value: unknown): string | null => {
    if (typeof value !== 'string' || value.trim().length === 0) return null
    const raw = value.trim()
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    try {
      return new URL(withScheme).hostname || null
    } catch {
      return null
    }
  }

  const normalizeBacklinkItem = (item: Record<string, unknown>) => {
    const sourceUrl =
      item?.source_url ??
      item?.sourceUrl ??
      item?.from_url ??
      item?.fromUrl ??
      item?.url_from ??
      item?.referring_url ??
      item?.referringUrl ??
      item?.source ??
      item?.url ??
      null

    const targetUrl =
      item?.target_url ??
      item?.targetUrl ??
      item?.to_url ??
      item?.toUrl ??
      item?.url_to ??
      item?.destination_url ??
      item?.destinationUrl ??
      item?.target ??
      null

    const anchorText = item?.anchor_text ?? item?.anchorText ?? item?.anchor ?? item?.text ?? null
    const referringDomain =
      item?.referring_domain ??
      item?.referringDomain ??
      item?.source_domain ??
      item?.sourceDomain ??
      normalizeUrlHostname(sourceUrl) ??
      null

    const type = item?.dofollow === true ? 'dofollow' : (typeof item?.type === 'string' ? item?.type : 'nofollow')

    return { sourceUrl, targetUrl, anchorText, referringDomain, type }
  }

  const extractBacklinksArray = (payload: unknown): Record<string, unknown>[] => {
    if (Array.isArray(payload)) return payload
    if (!payload || typeof payload !== 'object') return []

    const obj = payload as Record<string, unknown>
    const candidates = [
      obj.backlinks,
      obj.links,
      obj.items,
      obj.results,
      obj.data,
      obj.result,
      obj.backlinkData,
    ]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate
    }

    // Deep DataForSEO candidates (tasks -> result -> items)
    if (Array.isArray(obj.tasks)) {
      for (const task of obj.tasks as Record<string, unknown>[]) {
        if (Array.isArray(task.result)) {
          for (const res of task.result as Record<string, unknown>[]) {
            if (Array.isArray(res.items)) return res.items
          }
        }
        const taskResult = task.result as Record<string, unknown> | undefined
        if (taskResult && Array.isArray(taskResult.items)) return taskResult.items
      }
    }

    return []
  }

  const backlinksRaw = extractBacklinksArray(data)
  const backlinks = backlinksRaw.map(normalizeBacklinkItem)
  const backlinksCount = backlinks.length

  const dataObj = (data && typeof data === 'object' && !Array.isArray(data))
    ? data as Record<string, unknown>
    : null

  let explicitRefDomainsCount: number | undefined = undefined
  if (dataObj) {
    if (typeof dataObj.referringDomainsCount === 'number') {
      explicitRefDomainsCount = dataObj.referringDomainsCount
    } else if (typeof dataObj.referring_domains_count === 'number') {
      explicitRefDomainsCount = dataObj.referring_domains_count
    } else if (typeof dataObj.ref_domains_count === 'number') {
      explicitRefDomainsCount = dataObj.ref_domains_count
    } else if (Array.isArray(dataObj.tasks) && dataObj.tasks.length > 0) {
      // DataForSEO Nested format
      const task = dataObj.tasks[0] as Record<string, unknown>
      if (Array.isArray(task?.result) && task.result.length > 0) {
        const res = task.result[0] as Record<string, unknown>
        if (typeof res?.referring_domains_count === 'number') {
          explicitRefDomainsCount = res.referring_domains_count
        }
      }
    }
  }

  const derivedRefDomains = new Set<string>()
  for (const b of backlinks) {
    if (b?.referringDomain) derivedRefDomains.add(String(b.referringDomain))
  }
  const referringDomainsCount = explicitRefDomainsCount ?? derivedRefDomains.size

  const exampleBacklinks = backlinks.slice(0, 10).map((b) => ({
    sourceUrl: b.sourceUrl,
    targetUrl: b.targetUrl,
    anchorText: b.anchorText,
    referringDomain: b.referringDomain,
  }))

  if (Array.isArray(data)) {
    return {
      status: 'success',
      success: true,
      domain,
      backlinks,
      backlinksCount,
      referringDomainsCount,
      exampleBacklinks,
    }
  }

  return {
    status: 'success',
    success: true,
    domain,
    backlinks,
    backlinksCount,
    referringDomainsCount,
    exampleBacklinks,
    ...(data && typeof data === 'object' ? data : {}),
  }
}

/**
 * Create the Perplexity search tool.
 */
export function createPerplexityTool() {
  return tool({
    description: "Search the web using Perplexity AI via Vercel AI Gateway. Use this for specific research queries.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      return await searchWithPerplexity({ query })
    },
  })
}

/**
 * Create the keyword suggestion tool (mock data for now).
 */
export function createKeywordSuggestionTool() {
  return tool({
    description: "Suggest related keywords with metrics (volume, difficulty, CPC). Use this when the user asks for keyword suggestions, keyword ideas, or related terms.",
    inputSchema: z.object({
      topic: z.string().describe("The main topic to generate keywords for"),
    }),
    execute: async ({ topic }) => {
      console.log('[Tool Assembler] Generating keyword suggestions for:', topic)

      const baseVolume = topic.length * 1000
      return {
        status: 'success',
        topic,
        keywords: [
          { keyword: `${topic} tools`, volume: baseVolume * 1.5, difficulty: 65, cpc: 2.50, intent: 'Commercial' },
          { keyword: `best ${topic}`, volume: baseVolume * 1.2, difficulty: 72, cpc: 3.20, intent: 'Commercial' },
          { keyword: `how to do ${topic}`, volume: baseVolume * 3.0, difficulty: 45, cpc: 1.10, intent: 'Informational' },
          { keyword: `${topic} strategy`, volume: baseVolume * 0.8, difficulty: 55, cpc: 4.50, intent: 'Informational' },
          { keyword: `${topic} services`, volume: baseVolume * 0.5, difficulty: 80, cpc: 8.50, intent: 'Transactional' },
          { keyword: `cheap ${topic}`, volume: baseVolume * 0.4, difficulty: 30, cpc: 1.50, intent: 'Transactional' },
          { keyword: `${topic} guide`, volume: baseVolume * 0.9, difficulty: 40, cpc: 0.80, intent: 'Informational' },
          { keyword: `${topic} software`, volume: baseVolume * 0.7, difficulty: 75, cpc: 5.00, intent: 'Commercial' },
        ]
      }
    }
  })
}

/**
 * Assemble all tools for a given agent and intent classification.
 * This is the main entry point for tool assembly.
 */
export async function assembleTools(options: ToolAssemblyOptions): Promise<Record<string, Tool>> {
  const { agent, intentTools } = options

  console.log(`[Tool Assembler] Loading tools for ${agent} agent`)

  // Load MCP tools
  const allMCPTools = await loadMCPTools(agent)

  // Load content quality tools for content agent
  let contentQualityTools: Record<string, Tool> = {}
  let enhancedContentTools: Record<string, Tool> = {}
  if (agent === 'content') {
    contentQualityTools = getContentQualityTools() as Record<string, Tool>
    enhancedContentTools = getEnhancedContentQualityTools() as Record<string, Tool>
  }

  // Assemble final tool set
  const tools: Record<string, Tool> = {
    // High-level Agent Tools - ONLY for Content and General agents
    // For SEO/AEO, we want the LLM to use DataForSEO tools directly
    ...(agent !== 'seo-aeo' ? {
      research_agent: researchAgentTool,
      competitor_analysis: competitorAgentTool,
      consult_frameworks: frameworkRagTool,
    } : {}),

    // Onboarding Tools
    ...onboardingTools,

    // Perplexity search tool
    perplexity_search: createPerplexityTool(),

    // Web search for competitors (legacy alias)
    web_search_competitors: competitorAgentTool,

    // Keyword suggestion tool
    suggest_keywords: createKeywordSuggestionTool(),

    // Agent specific tools
    ...(agent === 'content' ? { ...contentQualityTools, ...enhancedContentTools } : {}),

    // N8N Backlinks - Available for SEO/AEO agent OR when backlinks intent is detected
    ...((agent === 'seo-aeo' || intentTools?.includes('n8n_backlinks')) ? { n8n_backlinks: createBacklinksTool() } : {}),

    // AEO Tools - Only for SEO/AEO agent (citation analysis, EEAT detection, platform optimization)
    ...(agent === 'seo-aeo' ? { ...getAEOTools(), ...getAEOPlatformTools() } : {}),

    // MCP Tools - Use intent-based filtering for SEO/AEO, otherwise load by agent type
    ...(intentTools && intentTools.length > 0
      ? loadToolsForIntents(intentTools, allMCPTools)
      : loadToolsForAgent(agent, allMCPTools)),
  }

  // Filter out any undefined tools
  const validatedTools = Object.fromEntries(
    Object.entries(tools).filter(([_, v]) => v !== undefined)
  )

  console.log('[Tool Assembler] Final validated tools:', {
    count: Object.keys(validatedTools).length,
    tools: Object.keys(validatedTools),
  })

  return validatedTools
}
