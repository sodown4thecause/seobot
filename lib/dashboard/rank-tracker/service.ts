import { normalizeRankTrackerPayload } from '@/lib/dashboard/normalizers/rank-tracker'
import type { ProviderStatus } from '@/lib/dashboard/rank-tracker/types'
import { searchWithPerplexity } from '@/lib/external-apis/perplexity'
import { mcpDataforseoTools } from '@/lib/mcp/dataforseo'
import { mcpFirecrawlTools } from '@/lib/mcp/firecrawl'
import { mcpJinaTools } from '@/lib/mcp/jina'

type ToolContext = {
  abortSignal: AbortSignal
  toolCallId: string
  messages: unknown[]
}

type ToolLike = {
  execute?: unknown
}

type ExecutableTool = {
  execute: (input: Record<string, unknown>, options: ToolContext) => unknown
}

type ProviderResult = {
  status: ProviderStatus
  error?: string
}

type RankKeywordRow = {
  keyword: string
  currentPosition: number
  previousPosition: number
  change: number
}

export interface RunRankTrackerInput {
  domain: string
  userId: string
  competitors?: string[]
  keywordLimit?: number
  locationName?: string
  languageCode?: string
  serpDepth?: number
  firecrawlLimit?: number
  historicalKeywordLimit?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  )
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
  )
}

function isExecutableTool(value: unknown): value is ExecutableTool {
  return isRecord(value) && typeof value.execute === 'function'
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, Math.round(value)))
}

function normalizeDomain(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '')
  const withoutPath = withoutProtocol.split(/[/?#]/)[0]?.trim().toLowerCase() || ''
  const withoutPort = withoutPath.split(':')[0] || ''

  if (!withoutPort) {
    return null
  }

  try {
    const parsed = new URL(`https://${withoutPort}`)
    const hostname = parsed.hostname.toLowerCase()
    if (!hostname.includes('.') || hostname.includes('..')) {
      return null
    }

    const labels = hostname.split('.')
    if (
      labels.some(
        (label) =>
          !label ||
          label.startsWith('-') ||
          label.endsWith('-') ||
          !/^[a-z0-9-]+$/.test(label)
      )
    ) {
      return null
    }

    return hostname
  } catch {
    return null
  }
}

function toBaseUrl(domain: string): string {
  return `https://${domain}`
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return {}
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null
}

function getNested(value: unknown, path: string[]): unknown {
  let cursor: unknown = value

  for (const key of path) {
    const node = asRecord(cursor)
    if (!node || !(key in node)) {
      return undefined
    }
    cursor = node[key]
  }

  return cursor
}

function extractTaskItems(payload: unknown): Record<string, unknown>[] {
  const parsed = parseJsonLike(payload)
  const root = asRecord(parsed)

  if (!root) {
    return []
  }

  if (!Array.isArray(root.tasks)) {
    return []
  }

  const items: Record<string, unknown>[] = []

  for (const task of root.tasks) {
    const taskRecord = asRecord(task)
    if (!taskRecord || !Array.isArray(taskRecord.result)) {
      continue
    }

    for (const result of taskRecord.result) {
      const resultRecord = asRecord(result)
      if (!resultRecord) {
        continue
      }

      if (Array.isArray(resultRecord.items)) {
        for (const item of resultRecord.items) {
          const itemRecord = asRecord(item)
          if (itemRecord) {
            items.push(itemRecord)
          }
        }
      } else {
        items.push(resultRecord)
      }
    }
  }

  return items
}

function normalizeUrls(value: unknown): string[] {
  const parsed = parseJsonLike(value)

  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === 'string' && item.startsWith('http'))
  }

  const parsedRecord = asRecord(parsed)
  if (parsedRecord) {
    for (const key of ['urls', 'links', 'results']) {
      const candidate = parsedRecord[key]
      if (!Array.isArray(candidate)) {
        continue
      }

      return candidate.filter((item): item is string => typeof item === 'string' && item.startsWith('http'))
    }
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('http'))
  }

  return []
}

function sanitizePosition(value: number | null): number {
  if (value === null || value <= 0) {
    return 0
  }

  return Math.trunc(value)
}

function buildKeywordRow(item: Record<string, unknown>): RankKeywordRow | null {
  const keywordCandidates = [
    item.keyword,
    getNested(item, ['keyword_data', 'keyword']),
    getNested(item, ['keyword_info', 'keyword']),
  ]

  const keyword = keywordCandidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
  if (!keyword) {
    return null
  }

  const currentPosition = sanitizePosition(
    toNumber(item.current_position) ??
      toNumber(item.currentPosition) ??
      toNumber(getNested(item, ['ranked_serp_element', 'serp_item', 'rank_group'])) ??
      toNumber(getNested(item, ['ranked_serp_element', 'serp_item', 'rank_absolute'])) ??
      toNumber(getNested(item, ['serp_item', 'rank_group']))
  )

  const previousPosition = sanitizePosition(
    toNumber(item.previous_position) ??
      toNumber(item.previousPosition) ??
      toNumber(getNested(item, ['ranked_serp_element', 'serp_item', 'previous_rank_group'])) ??
      toNumber(getNested(item, ['ranked_serp_element', 'serp_item', 'previous_rank_absolute'])) ??
      toNumber(getNested(item, ['serp_item', 'previous_rank_group']))
  )

  const explicitChange = toNumber(item.change)
  const change = explicitChange ?? (currentPosition > 0 && previousPosition > 0 ? previousPosition - currentPosition : 0)

  return {
    keyword: keyword.trim(),
    currentPosition,
    previousPosition,
    change,
  }
}

function extractKeywordRows(payload: unknown): RankKeywordRow[] {
  return extractTaskItems(payload)
    .map((item) => buildKeywordRow(item))
    .filter((item): item is RankKeywordRow => item !== null)
}

function combineErrors(errors: Array<string | undefined>): string | undefined {
  const compact = errors.filter((error): error is string => typeof error === 'string' && error.trim().length > 0)
  return compact.length > 0 ? compact.join('; ') : undefined
}

function deriveAggregateStatus(statuses: ProviderStatus[]): ProviderStatus {
  if (statuses.length === 0) {
    return 'failed'
  }

  if (statuses.every((status) => status === 'ok')) {
    return 'ok'
  }

  if (statuses.every((status) => status === 'failed')) {
    return 'failed'
  }

  return 'partial'
}

async function executeTool<TArgs extends Record<string, unknown>>(
  tool: ToolLike | undefined,
  args: TArgs,
  toolCallId: string
): Promise<unknown> {
  if (!isExecutableTool(tool)) {
    throw new Error('Tool execute method not available')
  }

  const executionResult = tool.execute(args, {
    abortSignal: new AbortController().signal,
    toolCallId,
    messages: [],
  })

  const resolved = isPromiseLike(executionResult) ? await executionResult : executionResult

  if (typeof resolved === 'string') {
    return resolved
  }

  if (isAsyncIterable(resolved)) {
    let combined = ''
    for await (const chunk of resolved) {
      combined += typeof chunk === 'string' ? chunk : JSON.stringify(chunk)
    }
    return combined
  }

  return resolved
}

async function runDataForSeo(
  domain: string,
  input: RunRankTrackerInput,
  locationName: string,
  languageCode: string
): Promise<{
  provider: { status: ProviderStatus; keywords: RankKeywordRow[]; error?: string }
  keywords: RankKeywordRow[]
  diagnostics: Record<string, unknown>
}> {
  const keywordLimit = clampNumber(input.keywordLimit, 1, 100, 25)
  const serpDepth = clampNumber(input.serpDepth, 10, 100, 20)
  const historicalKeywordLimit = clampNumber(input.historicalKeywordLimit, 1, 5, 2)

  let rankedKeywordsRaw: unknown = null
  let rankedKeywordsError: string | undefined

  try {
    rankedKeywordsRaw = await executeTool(
      mcpDataforseoTools.dataforseo_labs_google_ranked_keywords,
      {
        target: domain,
        location_name: locationName,
        language_code: languageCode,
        limit: keywordLimit,
        include_subdomains: false,
      },
      `rank-tracker-dfs-ranked-keywords-${input.userId}`
    )
  } catch (error) {
    rankedKeywordsError = error instanceof Error ? error.message : 'dataforseo_labs_google_ranked_keywords failed'
  }

  if (rankedKeywordsError) {
    return {
      provider: {
        status: 'failed',
        keywords: [],
        error: rankedKeywordsError,
      },
      keywords: [],
      diagnostics: {
        rankedKeywords: { status: 'failed', error: rankedKeywordsError },
        serpLive: {
          status: 'skipped',
          reason: 'skipped_due_to_ranked_keywords_failure',
        },
        historicalRankOverview: {
          status: 'skipped',
          reason: 'skipped_due_to_ranked_keywords_failure',
        },
        historicalSerp: {
          status: 'skipped',
          reason: 'skipped_due_to_ranked_keywords_failure',
        },
        skippedDownstreamDataforseo: true,
        sampledKeywordCount: 0,
      },
    }
  }

  const keywords = rankedKeywordsRaw ? extractKeywordRows(rankedKeywordsRaw).slice(0, keywordLimit) : []
  const serpKeyword = keywords[0]?.keyword || domain.split('.')[0] || domain

  const [serpResult, historicalOverviewResult, historicalSerpResult] = await Promise.all([
    executeTool(
      mcpDataforseoTools.serp_organic_live_advanced,
      {
        search_engine: 'google',
        keyword: serpKeyword,
        location_name: locationName,
        language_code: languageCode,
        depth: serpDepth,
        max_crawl_pages: 1,
        device: 'desktop',
      },
      `rank-tracker-dfs-serp-live-${input.userId}`
    ).catch((error) => ({
      __error: error instanceof Error ? error.message : 'serp_organic_live_advanced failed',
    })),
    executeTool(
      mcpDataforseoTools.dataforseo_labs_google_historical_rank_overview,
      {
        target: domain,
        location_name: locationName,
        language_code: languageCode,
      },
      `rank-tracker-dfs-historical-overview-${input.userId}`
    ).catch((error) => ({
      __error: error instanceof Error ? error.message : 'dataforseo_labs_google_historical_rank_overview failed',
    })),
    executeTool(
      mcpDataforseoTools.dataforseo_labs_google_historical_serp,
      {
        keyword: serpKeyword,
        location_name: locationName,
        language_code: languageCode,
      },
      `rank-tracker-dfs-historical-serp-${input.userId}`
    ).catch((error) => ({
      __error: error instanceof Error ? error.message : 'dataforseo_labs_google_historical_serp failed',
    })),
  ])

  const serpError = asRecord(serpResult)?.__error
  const historicalOverviewError = asRecord(historicalOverviewResult)?.__error
  const historicalSerpError = asRecord(historicalSerpResult)?.__error

  const providerStatus: ProviderStatus =
    keywords.length === 0 || serpError || historicalOverviewError || historicalSerpError ? 'partial' : 'ok'

  const providerError = combineErrors([
    typeof serpError === 'string' ? serpError : undefined,
    typeof historicalOverviewError === 'string' ? historicalOverviewError : undefined,
    typeof historicalSerpError === 'string' ? historicalSerpError : undefined,
  ])

  return {
    provider: {
      status: providerStatus,
      keywords,
      error: providerError,
    },
    keywords,
    diagnostics: {
      rankedKeywords: { status: 'ok' },
      serpLive: typeof serpError === 'string' ? { status: 'failed', error: serpError } : { status: 'ok' },
      historicalRankOverview:
        typeof historicalOverviewError === 'string'
          ? { status: 'failed', error: historicalOverviewError }
          : { status: 'ok' },
      historicalSerp:
        typeof historicalSerpError === 'string' ? { status: 'failed', error: historicalSerpError } : { status: 'ok' },
      sampledKeywordCount: Math.min(keywords.length, historicalKeywordLimit),
    },
  }
}

async function runFirecrawl(
  baseUrl: string,
  domain: string,
  input: RunRankTrackerInput,
  competitors: string[]
): Promise<ProviderResult> {
  const mapLimit = clampNumber(input.firecrawlLimit, 1, 20, 6)
  let mapError: string | undefined
  let scrapeError: string | undefined
  let agentError: string | undefined

  const urls = new Set<string>([baseUrl])

  try {
    const mapResult = await executeTool(
      mcpFirecrawlTools.firecrawl_map,
      {
        url: baseUrl,
        limit: mapLimit,
        includeSubdomains: false,
      },
      `rank-tracker-firecrawl-map-${input.userId}`
    )

    for (const url of normalizeUrls(mapResult)) {
      urls.add(url)
    }
  } catch (error) {
    mapError = error instanceof Error ? error.message : 'firecrawl_map failed'
  }

  try {
    const scrapeTarget = Array.from(urls)[0] || baseUrl
    await executeTool(
      mcpFirecrawlTools.firecrawl_scrape,
      {
        url: scrapeTarget,
        formats: ['markdown', 'links'],
        maxAge: 3600000,
      },
      `rank-tracker-firecrawl-scrape-${input.userId}`
    )
  } catch (error) {
    scrapeError = error instanceof Error ? error.message : 'firecrawl_scrape failed'
  }

  if (competitors.length > 0) {
    try {
      await executeTool(
        mcpFirecrawlTools.firecrawl_agent,
        {
          task: `Compare page structure patterns for ${domain} against competitors: ${competitors.join(', ')}`,
          maxPages: Math.min(competitors.length + 1, 5),
          formats: ['markdown'],
        },
        `rank-tracker-firecrawl-agent-${input.userId}`
      )
    } catch (error) {
      agentError = error instanceof Error ? error.message : 'firecrawl_agent failed'
    }
  }

  const status = deriveAggregateStatus([
    mapError ? 'failed' : 'ok',
    scrapeError ? 'failed' : 'ok',
    competitors.length > 0 ? (agentError ? 'failed' : 'ok') : 'ok',
  ])

  return {
    status,
    error: combineErrors([mapError, scrapeError, agentError]),
  }
}

async function runJina(baseUrl: string, input: RunRankTrackerInput): Promise<ProviderResult> {
  try {
    await executeTool(
      mcpJinaTools.read_url,
      {
        url: baseUrl,
        withAllLinks: true,
      },
      `rank-tracker-jina-read-${input.userId}`
    )
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'read_url failed',
    }
  }

  try {
    await executeTool(
      mcpJinaTools.capture_screenshot_url,
      {
        url: baseUrl,
        firstScreenOnly: true,
        return_url: true,
      },
      `rank-tracker-jina-snapshot-${input.userId}`
    )
  } catch (error) {
    return {
      status: 'partial',
      error: error instanceof Error ? error.message : 'capture_screenshot_url failed',
    }
  }

  return { status: 'ok' }
}

async function runPerplexity(
  domain: string,
  competitors: string[]
): Promise<ProviderResult & { summary?: string }> {
  const competitorText = competitors.length > 0 ? ` Competitors: ${competitors.join(', ')}.` : ''

  try {
    const result = await searchWithPerplexity({
      query: `Create a concise SEO rank-tracking strategy note for ${domain}.${competitorText} Focus on opportunities, quick wins, and risks.`,
      searchRecencyFilter: 'month',
      returnCitations: true,
    })

    if (!result.success) {
      return {
        status: 'failed',
        error: result.error || 'Perplexity request failed',
      }
    }

    return {
      status: 'ok',
      summary: result.answer,
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Perplexity search failed',
    }
  }
}

export async function runRankTracker(input: RunRankTrackerInput) {
  const normalizedDomain = normalizeDomain(input.domain)
  if (!normalizedDomain) {
    return normalizeRankTrackerPayload({
      providers: {
        dataforseo: {
          status: 'failed',
          keywords: [],
          error: `Invalid domain: ${input.domain}`,
        },
        googleSearchConsole: {
          status: 'failed',
          keywords: [],
          error: 'Invalid domain prevented rank tracker orchestration',
        },
      },
    })
  }

  const locationName = input.locationName?.trim() || 'United States'
  const languageCode = input.languageCode?.trim() || 'en'
  const baseUrl = toBaseUrl(normalizedDomain)
  const competitors = (input.competitors || [])
    .map((domain) => normalizeDomain(domain))
    .filter((domain): domain is string => typeof domain === 'string')
    .slice(0, 5)

  const [dataForSeoResult, firecrawlResult, jinaResult, perplexityResult] = await Promise.all([
    runDataForSeo(normalizedDomain, input, locationName, languageCode),
    runFirecrawl(baseUrl, normalizedDomain, input, competitors),
    runJina(baseUrl, input),
    runPerplexity(normalizedDomain, competitors),
  ])

  const secondaryStatus = deriveAggregateStatus([
    firecrawlResult.status,
    jinaResult.status,
    perplexityResult.status,
  ])

  return normalizeRankTrackerPayload({
    providers: {
      dataforseo: dataForSeoResult.provider,
      googleSearchConsole: {
        status: secondaryStatus,
        keywords: dataForSeoResult.keywords,
        error: combineErrors([firecrawlResult.error, jinaResult.error, perplexityResult.error]),
      },
    },
    keywords: dataForSeoResult.keywords,
    diagnostics: {
      dataforseo: dataForSeoResult.diagnostics,
      firecrawl: firecrawlResult,
      jina: jinaResult,
      perplexity: perplexityResult,
    },
  })
}
