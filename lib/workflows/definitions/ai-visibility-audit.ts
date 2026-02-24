import type { Workflow } from '@/lib/workflows/types'
import { WorkflowEngine } from '@/lib/workflows/engine'
import type { BrandDetectionPayload } from '@/lib/audit/types'
import type { BuyerIntentPrompts } from '@/lib/audit/prompts'
import { getAuditSystemPrompt } from '@/lib/audit/prompts'

export interface WorkflowCheckResult {
  key: 'perplexity_prompt_1' | 'perplexity_prompt_2' | 'perplexity_prompt_3' | 'grok_prompt_1' | 'gemini_prompt_1'
  prompt: string
  platform: 'perplexity' | 'grok' | 'gemini'
  rawResponse: string
  citationUrls: string[]
}

export const AI_VISIBILITY_AUDIT_WORKFLOW_ID = 'ai-visibility-audit'

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
}): Promise<WorkflowCheckResult[]> {
  if (input.mockSafe) {
    return [
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
  const toolResults = stepResult?.toolResults || {}

  const normalized: WorkflowCheckResult[] = [
    {
      key: 'perplexity_prompt_1',
      prompt: input.prompts.prompt1,
      platform: 'perplexity',
      rawResponse: toolResults.perplexity_prompt_1?.data?.answer || '',
      citationUrls:
        toolResults.perplexity_prompt_1?.data?.citations?.map((item: { url: string }) => item.url) || [],
    },
    {
      key: 'perplexity_prompt_2',
      prompt: input.prompts.prompt2,
      platform: 'perplexity',
      rawResponse: toolResults.perplexity_prompt_2?.data?.answer || '',
      citationUrls:
        toolResults.perplexity_prompt_2?.data?.citations?.map((item: { url: string }) => item.url) || [],
    },
    {
      key: 'perplexity_prompt_3',
      prompt: input.prompts.prompt3,
      platform: 'perplexity',
      rawResponse: toolResults.perplexity_prompt_3?.data?.answer || '',
      citationUrls:
        toolResults.perplexity_prompt_3?.data?.citations?.map((item: { url: string }) => item.url) || [],
    },
    {
      key: 'grok_prompt_1',
      prompt: input.prompts.prompt1,
      platform: 'grok',
      rawResponse: toolResults.grok_prompt_1?.data?.answer || '',
      citationUrls: [],
    },
    {
      key: 'gemini_prompt_1',
      prompt: input.prompts.prompt1,
      platform: 'gemini',
      rawResponse: toolResults.gemini_prompt_1?.data?.answer || '',
      citationUrls: [],
    },
  ]

  return normalized
}
