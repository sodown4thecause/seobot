import { z } from 'zod'
import type { Tool } from 'ai'
import type { ChatMode } from './modes'
import type { AgentType } from './intent-classifier'

export const STREAM_UI_NODE_TYPES = [
  'text',
  'tool-invocation',
  'data',
  'attachment',
  'artifact',
] as const

export type StreamUiNodeType = (typeof STREAM_UI_NODE_TYPES)[number]

export const GENERATIVE_UI_COMPONENTS = [
  'KeywordMetrics',
  'SerpResults',
  'DomainAnalytics',
  'AIPlatformMetrics',
  'AISearchMetrics',
  'ContentStrategy',
  'CitationRecommendations',
  'DomainKeywordProfile',
  'ContentGapMatrix',
] as const

export type GenerativeUiComponent = (typeof GENERATIVE_UI_COMPONENTS)[number]

export const ArtifactAttachmentSchema = z.object({
  name: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().nonnegative().optional(),
  url: z.string().url().optional(),
  storageId: z.string().min(1).optional(),
})

export const ArtifactEvidenceSchema = z.object({
  provider: z.string().min(1),
  source: z.string().min(1),
  freshness: z.string().min(1),
  confidence: z.enum(['low', 'medium', 'high']),
})

export const StreamUiNodeContractSchema = z.object({
  type: z.enum(STREAM_UI_NODE_TYPES),
  component: z.enum(GENERATIVE_UI_COMPONENTS).optional(),
  purpose: z.string().min(1),
})

export const ArtifactGenerationContractSchema = z.object({
  artifactId: z.string().min(1),
  mode: z.enum(['seo', 'geo', 'content']),
  intent: z.string().min(1),
  streamNodes: z.array(StreamUiNodeContractSchema).min(1),
  attachments: z.array(ArtifactAttachmentSchema).default([]),
  evidence: z.array(ArtifactEvidenceSchema).default([]),
  persistenceTarget: z.enum(['chat-message', 'library', 'artifact-store', 'report-path']),
})

export type ArtifactGenerationContract = z.infer<typeof ArtifactGenerationContractSchema>

export type ToolFacadeId =
  | 'keyword-universe'
  | 'serp-inspection'
  | 'domain-rank-intelligence'
  | 'technical-audit'
  | 'competitor-overlap'
  | 'backlink-summary'
  | 'ai-visibility'
  | 'citation-opportunities'
  | 'platform-mention-comparison'
  | 'answer-gap-analysis'
  | 'content-gap-matrix'
  | 'source-pack'
  | 'content-quality'
  | 'topical-authority'
  | 'general-research'

export interface ToolFacadeContract {
  id: ToolFacadeId
  label: string
  modes: ChatMode[]
  intentHints: string[]
  toolNames: readonly string[]
  uiComponents: readonly GenerativeUiComponent[]
}

export const STATIC_TOOL_FACADES: readonly ToolFacadeContract[] = [
  {
    id: 'keyword-universe',
    label: 'Keyword universe',
    modes: ['seo', 'content'],
    intentHints: ['keyword_research', 'research'],
    toolNames: [
      'keywords_data_google_ads_search_volume',
      'dataforseo_labs_google_keyword_ideas',
      'dataforseo_labs_google_keyword_suggestions',
      'dataforseo_labs_google_related_keywords',
      'dataforseo_labs_search_intent',
    ],
    uiComponents: ['KeywordMetrics', 'ContentStrategy'],
  },
  {
    id: 'serp-inspection',
    label: 'SERP inspection',
    modes: ['seo'],
    intentHints: ['serp_analysis', 'competitor_analysis'],
    toolNames: [
      'serp_organic_live_advanced',
      'dataforseo_labs_google_serp_competitors',
      'dataforseo_labs_google_relevant_pages',
    ],
    uiComponents: ['SerpResults'],
  },
  {
    id: 'domain-rank-intelligence',
    label: 'Domain and rank intelligence',
    modes: ['seo'],
    intentHints: ['domain_metrics', 'competitor_analysis'],
    toolNames: [
      'dataforseo_labs_google_domain_rank_overview',
      'dataforseo_labs_google_ranked_keywords',
      'dataforseo_labs_bulk_traffic_estimation',
      'domain_analytics_technologies_domain_technologies',
    ],
    uiComponents: ['DomainAnalytics', 'DomainKeywordProfile'],
  },
  {
    id: 'technical-audit',
    label: 'Technical audit',
    modes: ['seo'],
    intentHints: ['technical_seo'],
    toolNames: ['on_page_lighthouse', 'on_page_instant_pages', 'on_page_content_parsing'],
    uiComponents: ['DomainAnalytics'],
  },
  {
    id: 'competitor-overlap',
    label: 'Competitor overlap',
    modes: ['seo', 'content'],
    intentHints: ['competitor_analysis'],
    toolNames: [
      'dataforseo_labs_google_competitors_domain',
      'dataforseo_labs_google_domain_intersection',
      'dataforseo_labs_google_page_intersection',
      'firecrawl_scrape',
    ],
    uiComponents: ['ContentGapMatrix', 'DomainAnalytics'],
  },
  {
    id: 'backlink-summary',
    label: 'Backlink summary',
    modes: ['seo'],
    intentHints: ['backlinks'],
    toolNames: ['n8n_backlinks'],
    uiComponents: ['DomainAnalytics'],
  },
  {
    id: 'ai-visibility',
    label: 'AI visibility',
    modes: ['geo'],
    intentHints: ['ai_platforms', 'research'],
    toolNames: [
      'ai_optimization_keyword_data_search_volume',
      'ai_optimization_keyword_data_locations_and_languages',
      'perplexity_search',
    ],
    uiComponents: ['AIPlatformMetrics', 'AISearchMetrics'],
  },
  {
    id: 'citation-opportunities',
    label: 'Citation opportunities',
    modes: ['geo', 'content'],
    intentHints: ['ai_platforms', 'content_optimization', 'research'],
    toolNames: ['content_analysis_search', 'content_analysis_summary', 'search_web', 'read_url'],
    uiComponents: ['CitationRecommendations'],
  },
  {
    id: 'platform-mention-comparison',
    label: 'Platform mention comparison',
    modes: ['geo'],
    intentHints: ['ai_platforms', 'competitor_analysis'],
    toolNames: ['perplexity_search', 'search_web', 'dataforseo_labs_google_competitors_domain'],
    uiComponents: ['AIPlatformMetrics', 'AISearchMetrics'],
  },
  {
    id: 'answer-gap-analysis',
    label: 'Answer gap analysis',
    modes: ['geo'],
    intentHints: ['ai_platforms', 'content_optimization'],
    toolNames: ['perplexity_search', 'content_analysis_search', 'firecrawl_search'],
    uiComponents: ['AISearchMetrics', 'ContentGapMatrix'],
  },
  {
    id: 'content-gap-matrix',
    label: 'Content gap matrix',
    modes: ['content'],
    intentHints: ['content_optimization', 'competitor_analysis', 'keyword_research'],
    toolNames: [
      'content_analysis_search',
      'content_analysis_summary',
      'dataforseo_labs_google_keyword_ideas',
      'dataforseo_labs_search_intent',
      'firecrawl_scrape',
    ],
    uiComponents: ['ContentGapMatrix', 'ContentStrategy'],
  },
  {
    id: 'source-pack',
    label: 'Source pack',
    modes: ['content'],
    intentHints: ['research', 'web_scraping'],
    toolNames: ['perplexity_search', 'search_web', 'read_url', 'firecrawl_scrape'],
    uiComponents: ['CitationRecommendations', 'ContentStrategy'],
  },
  {
    id: 'content-quality',
    label: 'Content quality',
    modes: ['content'],
    intentHints: ['content_optimization'],
    toolNames: ['content_analysis_summary', 'content_analysis_phrase_trends'],
    uiComponents: ['ContentStrategy'],
  },
  {
    id: 'topical-authority',
    label: 'Topical authority',
    modes: ['seo', 'content'],
    intentHints: ['keyword_research', 'content_optimization'],
    toolNames: [
      'dataforseo_labs_google_related_keywords',
      'dataforseo_labs_google_keyword_ideas',
      'content_analysis_search',
    ],
    uiComponents: ['ContentStrategy', 'ContentGapMatrix'],
  },
  {
    id: 'general-research',
    label: 'General research',
    modes: ['seo', 'geo', 'content'],
    intentHints: ['general', 'research', 'web_scraping'],
    toolNames: ['perplexity_search', 'search_web', 'read_url'],
    uiComponents: ['CitationRecommendations'],
  },
] as const

const MODE_DEFAULT_FACADES: Record<ChatMode, ToolFacadeId[]> = {
  seo: ['keyword-universe', 'serp-inspection', 'domain-rank-intelligence', 'technical-audit'],
  geo: ['ai-visibility', 'citation-opportunities', 'platform-mention-comparison', 'answer-gap-analysis'],
  content: ['content-gap-matrix', 'source-pack', 'content-quality', 'topical-authority'],
}

const AGENT_MODE_FALLBACK: Record<AgentType, ChatMode> = {
  'seo-aeo': 'seo',
  content: 'content',
  general: 'seo',
  onboarding: 'seo',
  image: 'content',
}

export const MAX_MODEL_FACING_FACADE_TOOLS = 12

export function resolveHarnessMode(mode: ChatMode | undefined, agent: AgentType): ChatMode {
  return mode ?? AGENT_MODE_FALLBACK[agent] ?? 'seo'
}

export function selectFacadesForHarness(params: {
  mode: ChatMode
  intentHints?: string[]
}): ToolFacadeContract[] {
  const { mode, intentHints = [] } = params
  const defaults = new Set(MODE_DEFAULT_FACADES[mode])
  const defaultFacades = STATIC_TOOL_FACADES.filter((facade) => defaults.has(facade.id))
  const hintedFacades = STATIC_TOOL_FACADES.filter((facade) =>
    facade.modes.includes(mode)
    && facade.intentHints.some((hint) => intentHints.includes(hint))
  )

  if (hintedFacades.length > 0) {
    const facadesById = new Map<ToolFacadeId, ToolFacadeContract>()
    for (const facade of [...defaultFacades, ...hintedFacades]) {
      facadesById.set(facade.id, facade)
    }
    return Array.from(facadesById.values())
  }

  return defaultFacades
}

export function getHarnessToolNames(params: {
  mode: ChatMode
  intentToolNames?: string[]
  intentHints?: string[]
}): string[] {
  const { mode, intentToolNames = [], intentHints = [] } = params
  const selected = new Set<string>()

  for (const facade of selectFacadesForHarness({ mode, intentHints })) {
    for (const toolName of facade.toolNames) {
      selected.add(toolName)
    }
  }

  for (const toolName of intentToolNames) {
    selected.add(toolName)
  }

  return Array.from(selected).slice(0, MAX_MODEL_FACING_FACADE_TOOLS)
}

export function filterToolsByHarnessContract(
  allTools: Record<string, Tool>,
  allowedToolNames: string[]
): Record<string, Tool> {
  const selectedTools: Record<string, Tool> = {}

  for (const toolName of allowedToolNames) {
    if (allTools[toolName]) {
      selectedTools[toolName] = allTools[toolName]
    }
  }

  return selectedTools
}

export function buildHarnessSystemAddendum(params: {
  mode: ChatMode
  intentHints?: string[]
}): string {
  const facades = selectFacadesForHarness(params)
  const components = Array.from(new Set(facades.flatMap((facade) => facade.uiComponents)))

  return `HARNESS RUNTIME MODE: ${params.mode.toUpperCase()}

Use the static facade contract for this run. Do not ask for or enumerate raw MCP endpoint catalogs. Treat configured provider tools as fixed backend capabilities and call only the tools exposed in this conversation.

Artifact contract:
- Declare the artifact mode as "${params.mode}" when producing structured results.
- Map structured UI data to these components when relevant: ${components.join(', ') || 'standard text response'}.
- Use AI SDK 6 stream parts intentionally: text for narrative, tool-invocation for tool progress/results, data for component payloads, attachment for downloadable files, and artifact for durable saved outputs.
- Prefer \`client_ui\` with a generative component name (${components.join(', ')}) and matching props when you need a structured dashboard-style block in chat.
- For live-data claims, include provider/source/freshness/confidence or label the claim as an inference.`
}
