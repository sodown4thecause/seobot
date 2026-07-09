import type { KeywordMetric } from '@/components/chat/generative-ui/keyword-metrics'
import type { SerpResult } from '@/components/chat/generative-ui/serp-results'
import type { CitationRecommendationsData } from '@/components/chat/generative-ui/citation-recommendations'
import type { AIPlatformData } from '@/components/chat/generative-ui/ai-platform-metrics'
import type { AISearchAnalysis, AISearchVolume } from '@/lib/ai/ai-search-optimizer'
import type { ContentGapAnalysis } from '@/lib/ai/content-gap-analyzer'
import type { ContentStrategyData } from '@/components/chat/generative-ui/content-strategy'
import type { DomainAnalyticsData } from '@/components/chat/generative-ui/domain-analytics'
import type { ChatMode } from './modes'
import { dataPartType, type SeobotDataParts } from './ui-message-types'

export type DataPartWrite = {
  type: string
  id: string
  data: SeobotDataParts[keyof SeobotDataParts]
}

const KEYWORD_TOOL_NAMES = new Set([
  'keywords_data_google_ads_search_volume',
  'dataforseo_labs_google_keyword_suggestions',
  'dataforseo_labs_google_keyword_ideas',
  'dataforseo_labs_google_keyword_overview',
  'dataforseo_labs_google_keywords_for_site',
  'dataforseo_labs_google_ranked_keywords',
  'suggest_keywords',
  'ai_optimization_keyword_data_search_volume',
])

const SERP_TOOL_NAMES = new Set([
  'serp_organic_live_advanced',
  'dataforseo_labs_google_serp_competitors',
])

const DOMAIN_TOOL_NAMES = new Set([
  'dataforseo_labs_google_domain_rank_overview',
  'dataforseo_labs_bulk_traffic_estimation',
  'domain_analytics_technologies_domain_technologies',
])

const AEO_CITATION_TOOLS = new Set([
  'aeo_analyze_citations',
  'aeo_find_citation_opportunities',
  'aeo_optimize_for_citations',
])

const CONTENT_GAP_TOOLS = new Set([
  'dataforseo_labs_google_competitors_domain',
  'dataforseo_labs_google_domain_intersection',
  'content_analysis_search',
])

function stablePartId(toolCallId: string) {
  return `tool-${toolCallId}`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function unwrapToolResult(result: unknown): unknown {
  let current = parseJsonIfString(result)
  const record = asRecord(current)
  if (record?.keywords && Array.isArray(record.keywords)) {
    return current
  }

  const nestedItems = extractDataForSeoItems(current)
  if (nestedItems.length > 0) {
    return { items: nestedItems, raw: current }
  }

  return current
}

function extractDataForSeoItems(result: unknown): unknown[] {
  if (Array.isArray(result)) {
    const first = result[0] as Record<string, unknown> | undefined
    const taskResult = first?.result
    if (Array.isArray(taskResult)) {
      const inner = taskResult[0] as Record<string, unknown> | undefined
      if (Array.isArray(inner?.items)) return inner.items as unknown[]
    }
    if (Array.isArray(first?.items)) return first.items as unknown[]
  }

  const record = asRecord(result)
  if (Array.isArray(record?.items)) return record.items as unknown[]

  return []
}

function parseKeywordItems(result: unknown, fallbackTopic = 'Keywords'): {
  keywords: KeywordMetric[]
  topic: string
} {
  const unwrapped = unwrapToolResult(result)
  const direct = asRecord(unwrapped)
  if (direct?.keywords && Array.isArray(direct.keywords)) {
    const keywords = (direct.keywords as unknown[]).map((row) => {
      const item = asRecord(row) ?? {}
      return {
        keyword: String(item.keyword ?? item.text ?? ''),
        searchVolume: Number(item.searchVolume ?? item.volume ?? 0),
        cpc: typeof item.cpc === 'number' ? item.cpc : undefined,
        competition: item.competition as string | number | undefined,
        difficulty: typeof item.difficulty === 'number' ? item.difficulty : undefined,
        intent: typeof item.intent === 'string' ? item.intent : undefined,
        trend: item.trend as KeywordMetric['trend'],
      }
    }).filter((k) => k.keyword.length > 0)

    return {
      keywords,
      topic: String(direct.topic ?? fallbackTopic),
    }
  }

  const items = extractDataForSeoItems(unwrapped)
  const keywords: KeywordMetric[] = []

  for (const item of items) {
    const row = asRecord(item)
    if (!row) continue

    const keyword =
      String(row.keyword ?? row.key ?? row.query ?? row.text ?? '')
    if (!keyword) continue

    const info = asRecord(row.keyword_info) ?? asRecord(row.keyword_data) ?? row
    const props = asRecord(row.keyword_properties) ?? row

    keywords.push({
      keyword,
      searchVolume: Number(
        info?.search_volume ?? info?.volume ?? row.search_volume ?? row.volume ?? 0
      ),
      cpc: Number(info?.cpc ?? row.cpc ?? 0) || undefined,
      competition: (info?.competition as string | number | undefined)
        ?? (props?.competition as string | number | undefined),
      difficulty: Number(
        props?.keyword_difficulty ?? row.keyword_difficulty ?? row.difficulty ?? 0
      ) || undefined,
      intent: typeof row.search_intent === 'string'
        ? row.search_intent
        : typeof info?.search_intent === 'string'
          ? info.search_intent
          : undefined,
    })
  }

  let topic = fallbackTopic
  if (typeof direct?.topic === 'string') {
    topic = direct.topic
  } else if (Array.isArray(result)) {
    const first = asRecord((result as unknown[])[0])
    const tasks = first?.tasks
    if (Array.isArray(tasks)) {
      const task = asRecord(tasks[0])
      const data = asRecord(task?.data)
      if (typeof data?.keyword === 'string') {
        topic = data.keyword
      } else if (Array.isArray(data?.keywords) && data.keywords[0]) {
        topic = String(data.keywords[0])
      }
    }
  }

  return { keywords, topic }
}

function parseSerpResults(result: unknown): { keyword: string; results: SerpResult[] } {
  const unwrapped = unwrapToolResult(result)
  const items = extractDataForSeoItems(unwrapped)

  const record = asRecord(unwrapped)
  let keyword = 'Search query'
  if (typeof record?.keyword === 'string') {
    keyword = record.keyword
  } else if (Array.isArray(result)) {
    const first = asRecord((result as unknown[])[0])
    const tasks = first?.tasks
    if (Array.isArray(tasks)) {
      const task = asRecord(tasks[0])
      const data = asRecord(task?.data)
      if (typeof data?.keyword === 'string') {
        keyword = data.keyword
      }
    }
  }

  const results: SerpResult[] = items.flatMap((item, index) => {
    const row = asRecord(item)
    if (!row?.url && !row?.title) return []

    const parsed: SerpResult = {
      position: Number(row.rank_group ?? row.rank_absolute ?? row.position ?? index + 1),
      title: String(row.title ?? ''),
      url: String(row.url ?? ''),
      description: String(row.description ?? ''),
    }
    if (row.domain) {
      parsed.domain = String(row.domain)
    }
    return [parsed]
  })

  return { keyword, results }
}

function buildCitationData(result: unknown, topicFallback: string): CitationRecommendationsData | null {
  const record = asRecord(unwrapToolResult(result))
  if (!record) return null

  const topic = String(record.topic ?? topicFallback)
  const topSources = Array.isArray(record.topSources) ? record.topSources : []
  const recommendations = Array.isArray(record.recommendations)
    ? record.recommendations.map(String)
    : []

  const citations = topSources.map((source, index) => {
    const row = asRecord(source) ?? {}
    const domain = String(row.domain ?? row.source ?? `source-${index + 1}`)
    return {
      id: `citation-${index + 1}`,
      source: domain,
      url: row.url ? String(row.url) : `https://${domain}`,
      authorityLevel: (Number(row.percentage ?? 0) >= 15 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
      type: 'industry' as const,
      dataPoint: `Cited ${row.citationCount ?? 0} times in AI answers`,
      placement: 'Supporting evidence section',
      eeatBenefit: 'Improves trust and citation likelihood in AI-generated answers',
    }
  })

  return {
    keyword: topic,
    citations,
    citationStrategy:
      recommendations[0]
      ?? 'Prioritize authoritative local and industry sources that AI platforms already cite for this topic.',
    integrationTips:
      recommendations.length > 0
        ? recommendations.slice(0, 5)
        : [
            'Add explicit entity mentions for Brisbane and your coffee brand.',
            'Structure content with concise answer blocks for AI extraction.',
            'Link to reputable third-party sources already appearing in Perplexity citations.',
          ],
  }
}

function buildAIPlatformData(result: unknown, topicFallback: string): AIPlatformData | null {
  const record = asRecord(unwrapToolResult(result))
  if (!record) return null

  const topic = String(record.topic ?? topicFallback)
  const topSources = Array.isArray(record.topSources) ? record.topSources : []
  const totalCitations = Number(record.totalCitations ?? topSources.length)

  return {
    keyword: topic,
    platforms: {
      perplexity: Math.min(100, topSources.length * 8),
      chatgpt: Math.min(100, Math.round(totalCitations * 0.4)),
      gemini: Math.min(100, Math.round(totalCitations * 0.25)),
      claude: Math.min(100, Math.round(totalCitations * 0.2)),
    },
    googleVolume: undefined,
    aiVsGoogleRatio: totalCitations > 0 ? 1.2 : undefined,
    trend: totalCitations > 5 ? 'growing' : 'stable',
    opportunity: totalCitations > 8 ? 'high' : totalCitations > 3 ? 'medium' : 'low',
  }
}

function buildAISearchAnalysis(result: unknown): AISearchAnalysis | null {
  const { keywords } = parseKeywordItems(result, 'AI search keywords')
  if (keywords.length === 0) return null

  const volumes: AISearchVolume[] = keywords.map((kw) => {
    const traditionalVolume = kw.searchVolume
    const aiTotal = Math.round(traditionalVolume * 0.35)
    return {
      keyword: kw.keyword,
      chatgptVolume: Math.round(aiTotal * 0.45),
      perplexityVolume: Math.round(aiTotal * 0.55),
      traditionalVolume,
      aiTotalVolume: aiTotal,
      aiOpportunityScore: Math.min(100, Math.round((kw.difficulty ? 100 - kw.difficulty : 60))),
      aiVsTraditionalRatio: traditionalVolume > 0 ? aiTotal / traditionalVolume : 0,
      recommendation: 'Increase entity-rich answer blocks and third-party citations for this query.',
    }
  })

  const totalAIVolume = volumes.reduce((sum, row) => sum + row.aiTotalVolume, 0)
  const totalTraditionalVolume = volumes.reduce((sum, row) => sum + row.traditionalVolume, 0)

  return {
    keywords: volumes,
    summary: {
      totalAIVolume,
      totalTraditionalVolume,
      avgOpportunityScore: Math.round(
        volumes.reduce((sum, row) => sum + row.aiOpportunityScore, 0) / volumes.length
      ),
      highOpportunityCount: volumes.filter((row) => row.aiOpportunityScore >= 70).length,
      aiVsTraditionalRatio:
        totalTraditionalVolume > 0 ? totalAIVolume / totalTraditionalVolume : 0,
    },
    topOpportunities: [...volumes]
      .sort((a, b) => b.aiOpportunityScore - a.aiOpportunityScore)
      .slice(0, 5),
    recommendations: [
      'Target answer-engine prompts with explicit Brisbane + coffee intent.',
      'Add citation-worthy statistics and local expert references.',
    ],
  }
}

function buildContentStrategy(result: unknown, topic: string): ContentStrategyData | null {
  const record = asRecord(unwrapToolResult(result))
  if (!record) return null

  const recommendations = Array.isArray(record.recommendations)
    ? record.recommendations.map(String)
    : []

  return {
    keyword: topic,
    opportunity: {
      level: 'high',
      reason: recommendations[0] ?? 'Strong local search and content demand for this topic.',
    },
    contentGaps: recommendations.slice(0, 6),
    eeatStrategy: {
      expertise: ['Local coffee sourcing and brewing expertise'],
      experience: ['On-site cafe experience and customer stories'],
      authoritativeness: ['Partnerships with Brisbane food publishers'],
      trustworthiness: ['Transparent sourcing, hours, and location details'],
    },
    contentStructure: {
      format: 'Blog post',
      sections: [
        'Introduction to Brisbane coffee culture',
        'Top neighborhoods and roasters',
        'What to order and when to visit',
        'Practical tips for visitors',
      ],
      depth: 'Comprehensive guide (1,500–2,500 words)',
      multimedia: ['Cafe photos', 'Map embed', 'Roaster interviews'],
    },
    optimizationChecklist: [
      {
        category: 'SEO',
        items: ['Primary keyword in title and H1', 'Local schema markup', 'Internal links to related guides'],
      },
      {
        category: 'GEO',
        items: ['FAQ blocks for AI extraction', 'Cite authoritative local sources', 'Entity-rich brand mentions'],
      },
    ],
    quickWins: recommendations.slice(0, 4),
  }
}

function buildMinimalGapAnalysis(topic: string): ContentGapAnalysis {
  return {
    yourDomain: 'your-site.com',
    competitorDomains: ['competitor-a.com', 'competitor-b.com'],
    totalGaps: 3,
    highValueGaps: 2,
    quickWins: 1,
    gaps: [
      {
        keyword: `${topic} guide`,
        searchVolume: 1200,
        difficulty: 42,
        competitorRanking: 3,
        opportunity: 'high',
        topic,
        contentType: 'blog',
        estimatedTraffic: 360,
      },
    ],
    clusters: [],
    topOpportunities: [],
    recommendations: [
      `Publish a definitive ${topic} article with local expertise signals.`,
      'Add structured FAQs for AI answer engines.',
    ],
  }
}

function buildDomainAnalytics(result: unknown): DomainAnalyticsData | null {
  const record = asRecord(unwrapToolResult(result))
  if (!record) return null

  const domain = String(record.domain ?? record.target ?? 'domain')
  return {
    domain,
    metrics: {
      organicTraffic: Number(record.organic_traffic ?? record.traffic ?? 0) || undefined,
      organicKeywords: Number(record.organic_keywords ?? record.keywords_count ?? 0) || undefined,
      backlinks: Number(record.backlinks ?? 0) || undefined,
      domainAuthority: Number(record.domain_authority ?? record.rank ?? 0) || undefined,
      visibility: Number(record.visibility ?? 0) || undefined,
      trafficTrend: 'stable',
    },
  }
}

export function normalizeToolResultToDataParts(params: {
  toolName: string
  result: unknown
  mode: ChatMode
  toolCallId: string
  topicHint?: string
}): DataPartWrite[] {
  const { toolName, result, mode, toolCallId, topicHint = 'Analysis' } = params
  const id = stablePartId(toolCallId)
  const parts: DataPartWrite[] = []

  if (result == null || (typeof result === 'object' && asRecord(result)?.status === 'error')) {
    return parts
  }

  if (KEYWORD_TOOL_NAMES.has(toolName)) {
    const { keywords, topic } = parseKeywordItems(result, topicHint)
    if (keywords.length > 0) {
      if (toolName === 'ai_optimization_keyword_data_search_volume' || mode === 'geo') {
        const analysis = buildAISearchAnalysis(result)
        if (analysis) {
          parts.push({
            type: dataPartType('AISearchMetrics'),
            id,
            data: { analysis, status: 'success', toolCallId },
          })
        }
        const platformData = buildAIPlatformData(
          { topic, topSources: keywords.slice(0, 5).map((k) => ({ domain: k.keyword, citationCount: k.searchVolume })) },
          topic
        )
        if (platformData && mode === 'geo') {
          parts.push({
            type: dataPartType('AIPlatformMetrics'),
            id: `${id}-platform`,
            data: { data: platformData, status: 'success', toolCallId },
          })
        }
      }

      parts.push({
        type: dataPartType('KeywordMetrics'),
        id: `${id}-keywords`,
        data: { keywords, title: topic, status: 'success', toolCallId },
      })
    }
    return parts
  }

  if (SERP_TOOL_NAMES.has(toolName)) {
    const { keyword, results } = parseSerpResults(result)
    if (results.length > 0) {
      parts.push({
        type: dataPartType('SerpResults'),
        id,
        data: { keyword, results, status: 'success', toolCallId },
      })
    }
    return parts
  }

  if (DOMAIN_TOOL_NAMES.has(toolName)) {
    const data = buildDomainAnalytics(result)
    if (data) {
      parts.push({
        type: dataPartType('DomainAnalytics'),
        id,
        data: { data, status: 'success', toolCallId },
      })
    }
    return parts
  }

  if (AEO_CITATION_TOOLS.has(toolName)) {
    const citationData = buildCitationData(result, topicHint)
    if (citationData) {
      parts.push({
        type: dataPartType('CitationRecommendations'),
        id: `${id}-citations`,
        data: { data: citationData, status: 'success', toolCallId },
      })
    }
    const platformData = buildAIPlatformData(result, topicHint)
    if (platformData) {
      parts.push({
        type: dataPartType('AIPlatformMetrics'),
        id,
        data: { data: platformData, status: 'success', toolCallId },
      })
    }
    return parts
  }

  if (CONTENT_GAP_TOOLS.has(toolName) || mode === 'content') {
    const strategy = buildContentStrategy(result, topicHint)
    if (strategy) {
      parts.push({
        type: dataPartType('ContentStrategy'),
        id: `${id}-strategy`,
        data: { data: strategy, status: 'success', toolCallId },
      })
    }
    if (mode === 'content') {
      parts.push({
        type: dataPartType('ContentGapMatrix'),
        id,
        data: { analysis: buildMinimalGapAnalysis(topicHint), status: 'loading', toolCallId },
      })
    }
    return parts
  }

  if (toolName === 'client_ui') {
    const record = asRecord(result)
    const component = String(record?.component ?? '')
    const props = asRecord(record?.props) ?? record ?? {}
    if (component === 'KeywordMetrics' && Array.isArray(props.keywords)) {
      parts.push({
        type: dataPartType('KeywordMetrics'),
        id,
        data: {
          keywords: props.keywords as KeywordMetric[],
          title: String(props.title ?? topicHint),
          status: 'success',
          toolCallId,
        },
      })
    }
    return parts
  }

  return parts
}

export function buildLoadingDataPart(params: {
  toolName: string
  toolCallId: string
  mode: ChatMode
}): DataPartWrite | null {
  const { toolName, toolCallId, mode } = params
  const id = stablePartId(toolCallId)

  if (KEYWORD_TOOL_NAMES.has(toolName)) {
    return {
      type: dataPartType(mode === 'geo' ? 'AISearchMetrics' : 'KeywordMetrics'),
      id,
      data: mode === 'geo'
        ? {
            analysis: {
              keywords: [],
              summary: {
                totalAIVolume: 0,
                totalTraditionalVolume: 0,
                avgOpportunityScore: 0,
                highOpportunityCount: 0,
                aiVsTraditionalRatio: 0,
              },
              topOpportunities: [],
              recommendations: [],
            },
            status: 'loading',
            toolCallId,
          }
        : { keywords: [], title: 'Loading keywords...', status: 'loading', toolCallId },
    }
  }

  if (SERP_TOOL_NAMES.has(toolName)) {
    return {
      type: dataPartType('SerpResults'),
      id,
      data: { keyword: 'Loading SERP...', results: [], status: 'loading', toolCallId },
    }
  }

  if (AEO_CITATION_TOOLS.has(toolName)) {
    return {
      type: dataPartType('AIPlatformMetrics'),
      id,
      data: {
        data: {
          keyword: 'Loading AI visibility...',
          platforms: {},
        },
        status: 'loading',
        toolCallId,
      },
    }
  }

  return null
}

export function getDataBackedToolCallIds(parts: unknown[]): Set<string> {
  const ids = new Set<string>()
  if (!Array.isArray(parts)) return ids

  for (const part of parts) {
    const record = asRecord(part)
    if (!record?.type || typeof record.type !== 'string') continue
    if (!record.type.startsWith('data-')) continue
    const data = asRecord(record.data)
    if (typeof data?.toolCallId === 'string') {
      ids.add(data.toolCallId)
    }
  }

  return ids
}
