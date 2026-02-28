import type { Workflow } from '@/lib/workflows/types'
import { WorkflowEngine } from '@/lib/workflows/engine'
import type { BrandDetectionPayload, TopicalMapProviderStatus } from '@/lib/audit/types'
import type { BuyerIntentPrompts } from '@/lib/audit/prompts'
import { getAuditSystemPrompt } from '@/lib/audit/prompts'
import { runGrokAdapter } from '@/lib/llm/adapters/grok'
import { runGeminiAdapter } from '@/lib/llm/adapters/gemini'
import { getDataforseoTopicalTopics } from '@/lib/mcp/dataforseo/topical-map'
import { getFirecrawlTopicalTopics } from '@/lib/mcp/firecrawl/topical-map'

export interface WorkflowCheckResult {
  key: 'perplexity_prompt_1' | 'perplexity_prompt_2' | 'perplexity_prompt_3' | 'grok_prompt_1' | 'gemini_prompt_1'
  prompt: string
  platform: 'perplexity' | 'grok' | 'gemini'
  rawResponse: string
  citationUrls: string[]
}

export interface WorkflowExecutionMeta {
  fallbackApplied: boolean
  citationAvailability: 'full' | 'degraded'
  message?: string
  fallbackDetails: string[]
}

export interface WorkflowExecutionResult {
  checks: WorkflowCheckResult[]
  meta: WorkflowExecutionMeta
  topicalMapInput: {
    dataforseo: { topics: Array<{ topic: string; intent: 'informational' | 'commercial' | 'transactional' | 'navigational'; youCoverage: number; competitorCoverage: number; evidenceDepth: number; sourceUrl: string }> }
    firecrawl: { topics: Array<{ topic: string; evidenceDepth: number; sourceUrl: string; lastIndexedAt: string }> }
    aiDiagnostics: { topics: Array<{ topic: string; aiMentions: number; citations: number; sourceUrl: string }> }
    providerStatus: TopicalMapProviderStatus
  }
}

export const AI_VISIBILITY_AUDIT_WORKFLOW_ID = 'ai-visibility-audit'

type WorkflowKey = WorkflowCheckResult['key']

interface ToolSuccessLike {
  success?: boolean
  data?: {
    answer?: string
    citations?: Array<{ url: string }>
  }
  error?: string
}

function buildMockResult(prompt: string, context: BrandDetectionPayload, platform: 'perplexity' | 'grok' | 'gemini', includeCitations = false): { answer: string; citations: Array<{ url: string }> } {
  const competitor = context.competitors[0] || 'competitor'
  const answer = [
    `1. ${competitor}`,
    `2. ${context.brand}`,
    `3. Another ${context.category} option`,
    `For ${context.icp}, ${context.brand} is a strong fit for workflow automation.`,
    `Prompt used: ${prompt}`,
  ].join('\n')

  const citations = includeCitations
    ? [
        { url: `https://${competitor.toLowerCase().replace(/\s+/g, '')}.com/blog/overview` },
        { url: 'https://www.g2.com/categories/seo-software' },
      ]
    : []

  return { answer, citations }
}

function buildFallbackAnswer(platform: string, prompt: string, reason?: string): string {
  const details = reason ? ` Reason: ${reason}` : ''
  return `Fallback response (${platform}) could not complete the prompt.${details}\nPrompt: ${prompt}`
}

function getToolResult(toolResults: Record<string, unknown>, key: WorkflowKey): ToolSuccessLike {
  return (toolResults[key] || {}) as ToolSuccessLike
}

function normalizeCheck(
  key: WorkflowKey,
  prompt: string,
  platform: 'perplexity' | 'grok' | 'gemini',
  toolResult: ToolSuccessLike,
  fallbackAnswer?: string
): WorkflowCheckResult {
  const answer = toolResult.success === false
    ? fallbackAnswer || buildFallbackAnswer(platform, prompt, toolResult.error)
    : toolResult.data?.answer || fallbackAnswer || buildFallbackAnswer(platform, prompt)

  const citationUrls =
    platform === 'perplexity'
      ? toolResult.success === false
        ? []
        : toolResult.data?.citations?.map((item) => item.url) || []
      : []

  return {
    key,
    prompt,
    platform,
    rawResponse: answer,
    citationUrls,
  }
}

function buildTopicalMapInput(
  context: BrandDetectionPayload,
  checks: WorkflowCheckResult[],
  providerStatus: TopicalMapProviderStatus,
  providerTopics?: {
    dataforseo: WorkflowExecutionResult['topicalMapInput']['dataforseo']['topics']
    firecrawl: WorkflowExecutionResult['topicalMapInput']['firecrawl']['topics']
  }
): WorkflowExecutionResult['topicalMapInput'] {
  const primaryCompetitor = context.competitors[0] || 'competitor'
  const prompts = checks.map((check) => check.prompt)

  const baseTopics = prompts.length
    ? prompts.slice(0, 3).map((prompt, idx) => ({
        topic: prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || `topic-${idx + 1}`,
        intent: idx === 2 ? 'transactional' as const : 'informational' as const,
        youCoverage: idx === 0 ? 58 : 44,
        competitorCoverage: idx === 0 ? 71 : 63,
        evidenceDepth: idx === 0 ? 64 : 48,
        sourceUrl: `https://${context.brand.toLowerCase().replace(/\s+/g, '')}.com/${idx + 1}`,
      }))
    : [
        {
          topic: `${context.category.toLowerCase()} strategy`,
          intent: 'informational' as const,
          youCoverage: 42,
          competitorCoverage: 67,
          evidenceDepth: 45,
          sourceUrl: `https://${context.brand.toLowerCase().replace(/\s+/g, '')}.com/overview`,
        },
      ]

  const dataforseoTopics = providerTopics?.dataforseo.length ? providerTopics.dataforseo : baseTopics
  const firecrawlTopics = providerTopics?.firecrawl.length
    ? providerTopics.firecrawl
    : baseTopics.map((topic) => ({
        topic: topic.topic,
        evidenceDepth: Math.min(100, topic.evidenceDepth + 8),
        sourceUrl: topic.sourceUrl,
        lastIndexedAt: new Date().toISOString(),
      }))

  return {
    dataforseo: {
      topics: dataforseoTopics,
    },
    firecrawl: {
      topics: firecrawlTopics,
    },
    aiDiagnostics: {
      topics: baseTopics.map((topic) => ({
        topic: topic.topic,
        aiMentions: checks.filter((check) => check.rawResponse.toLowerCase().includes(context.brand.toLowerCase())).length,
        citations: checks.filter((check) => check.citationUrls.length > 0).length,
        sourceUrl: `https://${primaryCompetitor.toLowerCase().replace(/\s+/g, '')}.com/compare`,
      })),
    },
    providerStatus,
  }
}

async function collectTopicalProviderData(context: BrandDetectionPayload): Promise<{
  providerStatus: TopicalMapProviderStatus
  providerTopics: {
    dataforseo: WorkflowExecutionResult['topicalMapInput']['dataforseo']['topics']
    firecrawl: WorkflowExecutionResult['topicalMapInput']['firecrawl']['topics']
  }
}> {
  const domain = `${context.brand.toLowerCase().replace(/\s+/g, '')}.com`
  const providerStatus: TopicalMapProviderStatus = {
    dataforseo: 'ok',
    firecrawl: 'ok',
    aiDiagnostics: 'ok',
  }

  let dataforseoTopics: WorkflowExecutionResult['topicalMapInput']['dataforseo']['topics'] = []
  let firecrawlTopics: WorkflowExecutionResult['topicalMapInput']['firecrawl']['topics'] = []

  try {
    dataforseoTopics = await getDataforseoTopicalTopics({
      domain,
      brand: context.brand,
      category: context.category,
    })
    if (!dataforseoTopics.length) {
      providerStatus.dataforseo = 'partial'
    }
  } catch {
    providerStatus.dataforseo = 'failed'
  }

  try {
    firecrawlTopics = await getFirecrawlTopicalTopics({
      domain,
      brand: context.brand,
    })
    if (!firecrawlTopics.length) {
      providerStatus.firecrawl = 'partial'
    }
  } catch {
    providerStatus.firecrawl = 'failed'
  }

  return {
    providerStatus,
    providerTopics: {
      dataforseo: dataforseoTopics,
      firecrawl: firecrawlTopics,
    },
  }
}

async function runTextFallback(
  platform: 'grok' | 'gemini',
  params: { systemPrompt: string; userPrompt: string }
): Promise<{ answer: string; error?: string }> {
  try {
    if (platform === 'grok') {
      const result = await runGrokAdapter(params)
      return { answer: result.rawText }
    }

    const result = await runGeminiAdapter(params)
    return { answer: result.rawText }
  } catch (error) {
    return {
      answer: buildFallbackAnswer(platform, params.userPrompt, error instanceof Error ? error.message : 'Unknown error'),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function buildAiVisibilityAuditWorkflow(
  prompts: BuyerIntentPrompts,
  context: BrandDetectionPayload
): Workflow {
  const systemPrompt = getAuditSystemPrompt(context)

  return {
    id: AI_VISIBILITY_AUDIT_WORKFLOW_ID,
    name: 'AI Visibility Audit (5 checks)',
    description: 'Runs 3 Perplexity prompts + Prompt 1 on Grok and Gemini in parallel.',
    category: 'audit',
    tags: ['ai-visibility', 'lead-magnet', 'competitive'],
    steps: [
      {
        id: 'run-five-checks',
        name: 'Run fixed five checks',
        parallel: true,
        tools: [
          {
            id: 'perplexity_prompt_1',
            name: 'perplexity_search',
            params: {
              query: prompts.prompt1,
              search_recency_filter: 'month',
              return_citations: true,
            },
            required: true,
          },
          {
            id: 'perplexity_prompt_2',
            name: 'perplexity_search',
            params: {
              query: prompts.prompt2,
              search_recency_filter: 'month',
              return_citations: true,
            },
            required: true,
          },
          {
            id: 'perplexity_prompt_3',
            name: 'perplexity_search',
            params: {
              query: prompts.prompt3,
              search_recency_filter: 'month',
              return_citations: true,
            },
            required: true,
          },
          {
            id: 'grok_prompt_1',
            name: 'grok_text',
            params: {
              systemPrompt,
              userPrompt: prompts.prompt1,
            },
            required: true,
          },
          {
            id: 'gemini_prompt_1',
            name: 'gemini_text',
            params: {
              systemPrompt,
              userPrompt: prompts.prompt1,
            },
            required: true,
          },
        ],
      },
    ],
  }
}

export async function executeAiVisibilityAuditWorkflow(input: {
  prompts: BuyerIntentPrompts
  context: BrandDetectionPayload
  mockSafe?: boolean
  simulatePerplexityFailure?: boolean
  simulateGrokFailure?: boolean
}): Promise<WorkflowExecutionResult> {
  const meta: WorkflowExecutionMeta = {
    fallbackApplied: false,
    citationAvailability: 'full',
    fallbackDetails: [],
  }

  if (input.mockSafe) {
    const providerData = await collectTopicalProviderData(input.context)
    const checks: WorkflowCheckResult[] = [
        {
          key: 'perplexity_prompt_1',
          prompt: input.prompts.prompt1,
          platform: 'perplexity',
          rawResponse: buildMockResult(input.prompts.prompt1, input.context, 'perplexity', true).answer,
          citationUrls: buildMockResult(input.prompts.prompt1, input.context, 'perplexity', true).citations.map((item) => item.url),
        },
        {
          key: 'perplexity_prompt_2',
          prompt: input.prompts.prompt2,
          platform: 'perplexity',
          rawResponse: buildMockResult(input.prompts.prompt2, input.context, 'perplexity', true).answer,
          citationUrls: buildMockResult(input.prompts.prompt2, input.context, 'perplexity', true).citations.map((item) => item.url),
        },
        {
          key: 'perplexity_prompt_3',
          prompt: input.prompts.prompt3,
          platform: 'perplexity',
          rawResponse: buildMockResult(input.prompts.prompt3, input.context, 'perplexity', true).answer,
          citationUrls: buildMockResult(input.prompts.prompt3, input.context, 'perplexity', true).citations.map((item) => item.url),
        },
        {
          key: 'grok_prompt_1',
          prompt: input.prompts.prompt1,
          platform: 'grok',
          rawResponse: buildMockResult(input.prompts.prompt1, input.context, 'grok').answer,
          citationUrls: [],
        },
        {
          key: 'gemini_prompt_1',
          prompt: input.prompts.prompt1,
          platform: 'gemini',
          rawResponse: buildMockResult(input.prompts.prompt1, input.context, 'gemini').answer,
          citationUrls: [],
        },
      ]

    if (input.simulatePerplexityFailure) {
      meta.fallbackApplied = true
      meta.citationAvailability = 'degraded'
      meta.message = 'Citation depth is temporarily limited because Perplexity fallback mode was used for one or more checks.'
      meta.fallbackDetails.push('perplexity_prompt_1: simulated outage rerouted to Grok')
      meta.fallbackDetails.push('perplexity_prompt_2: simulated outage rerouted to Grok')
      meta.fallbackDetails.push('perplexity_prompt_3: simulated outage rerouted to Grok')

      checks[0].citationUrls = []
      checks[1].citationUrls = []
      checks[2].citationUrls = []
      checks[0].rawResponse = buildMockResult(input.prompts.prompt1, input.context, 'grok').answer
      checks[1].rawResponse = buildMockResult(input.prompts.prompt2, input.context, 'grok').answer
      checks[2].rawResponse = buildMockResult(input.prompts.prompt3, input.context, 'grok').answer
    }

    if (input.simulateGrokFailure) {
      meta.fallbackApplied = true
      meta.fallbackDetails.push('grok_prompt_1: simulated outage rerouted to Gemini')
      checks[3].rawResponse = buildMockResult(input.prompts.prompt1, input.context, 'gemini').answer
    }

    const providerStatus: TopicalMapProviderStatus = {
      ...providerData.providerStatus,
      aiDiagnostics: meta.citationAvailability === 'degraded' ? 'partial' : 'ok',
    }

    return {
      checks,
      meta,
      topicalMapInput: buildTopicalMapInput(
        input.context,
        checks,
        providerStatus,
        providerData.providerTopics
      ),
    }
  }

  const workflow = buildAiVisibilityAuditWorkflow(input.prompts, input.context)
  const engine = new WorkflowEngine(
    workflow,
    {
      previousStepResults: {},
      userQuery: `Run ${AI_VISIBILITY_AUDIT_WORKFLOW_ID}`,
      cache: new Map(),
    },
    `audit-${Date.now()}`,
    'public-audit'
  )

  const execution = await engine.execute()
  const stepResult = execution.stepResults.find((step) => step.stepId === 'run-five-checks')
  const toolResults = (stepResult?.toolResults || {}) as Record<string, unknown>

  const systemPrompt = getAuditSystemPrompt(input.context)

  if (input.simulatePerplexityFailure) {
    toolResults.perplexity_prompt_1 = { success: false, error: 'Simulated Perplexity outage' }
    toolResults.perplexity_prompt_2 = { success: false, error: 'Simulated Perplexity outage' }
    toolResults.perplexity_prompt_3 = { success: false, error: 'Simulated Perplexity outage' }
  }

  if (input.simulateGrokFailure) {
    toolResults.grok_prompt_1 = { success: false, error: 'Simulated Grok outage' }
  }

  const perplexityKeys: Array<{ key: WorkflowKey; prompt: string }> = [
    { key: 'perplexity_prompt_1', prompt: input.prompts.prompt1 },
    { key: 'perplexity_prompt_2', prompt: input.prompts.prompt2 },
    { key: 'perplexity_prompt_3', prompt: input.prompts.prompt3 },
  ]

  const perplexityFallbacks = new Map<WorkflowKey, string>()
  for (const item of perplexityKeys) {
    const baseResult = getToolResult(toolResults, item.key)
    if (baseResult.success === false) {
      meta.fallbackApplied = true
      meta.citationAvailability = 'degraded'
      meta.fallbackDetails.push(`${item.key}: rerouted from Perplexity due to ${baseResult.error || 'provider failure'}`)

      const grokFallback = await runTextFallback('grok', {
        systemPrompt,
        userPrompt: item.prompt,
      })

      if (grokFallback.error) {
        const geminiFallback = await runTextFallback('gemini', {
          systemPrompt,
          userPrompt: item.prompt,
        })
        perplexityFallbacks.set(item.key, geminiFallback.answer)
        meta.fallbackDetails.push(`${item.key}: Grok fallback also failed, rerouted to Gemini`)        
      } else {
        perplexityFallbacks.set(item.key, grokFallback.answer)
      }
    }
  }

  const grokResult = getToolResult(toolResults, 'grok_prompt_1')
  let grokFallbackAnswer: string | undefined
  if (grokResult.success === false) {
    meta.fallbackApplied = true
    meta.fallbackDetails.push(`grok_prompt_1: rerouted to Gemini due to ${grokResult.error || 'provider failure'}`)
    const geminiFallback = await runTextFallback('gemini', {
      systemPrompt,
      userPrompt: input.prompts.prompt1,
    })
    grokFallbackAnswer = geminiFallback.answer
  }

  if (meta.citationAvailability === 'degraded') {
    meta.message = 'Citation depth is temporarily limited because Perplexity fallback mode was used for one or more checks.'
  }

  const checks: WorkflowCheckResult[] = [
    normalizeCheck(
      'perplexity_prompt_1',
      input.prompts.prompt1,
      'perplexity',
      getToolResult(toolResults, 'perplexity_prompt_1'),
      perplexityFallbacks.get('perplexity_prompt_1')
    ),
    normalizeCheck(
      'perplexity_prompt_2',
      input.prompts.prompt2,
      'perplexity',
      getToolResult(toolResults, 'perplexity_prompt_2'),
      perplexityFallbacks.get('perplexity_prompt_2')
    ),
    normalizeCheck(
      'perplexity_prompt_3',
      input.prompts.prompt3,
      'perplexity',
      getToolResult(toolResults, 'perplexity_prompt_3'),
      perplexityFallbacks.get('perplexity_prompt_3')
    ),
    normalizeCheck('grok_prompt_1', input.prompts.prompt1, 'grok', grokResult, grokFallbackAnswer),
    normalizeCheck('gemini_prompt_1', input.prompts.prompt1, 'gemini', getToolResult(toolResults, 'gemini_prompt_1')),
  ]

  const providerData = await collectTopicalProviderData(input.context)

  const providerStatus: TopicalMapProviderStatus = {
    ...providerData.providerStatus,
    aiDiagnostics: meta.citationAvailability === 'degraded' ? 'partial' : 'ok',
  }

  return {
    checks,
    meta,
    topicalMapInput: buildTopicalMapInput(
      input.context,
      checks,
      providerStatus,
      providerData.providerTopics
    ),
  }
}
