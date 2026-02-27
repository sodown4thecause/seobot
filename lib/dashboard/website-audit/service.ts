import { normalizeWebsiteAuditPayload } from '@/lib/dashboard/normalizers/website-audit'
import { searchWithPerplexity } from '@/lib/external-apis/perplexity'
import { mcpDataforseoTools } from '@/lib/mcp/dataforseo'
import { mcpFirecrawlTools } from '@/lib/mcp/firecrawl'
import { mcpJinaTools } from '@/lib/mcp/jina'

type ProviderStatus = 'ok' | 'partial' | 'failed'

type ProviderIssue = {
  title: string
  severity: 'critical' | 'warning' | 'info'
}

type ProviderPayload = {
  status: ProviderStatus
  score?: number
  issues: ProviderIssue[]
  error?: string
}

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

export interface RunWebsiteAuditInput {
  domain: string
  userId: string
  maxUrls?: number
  firecrawlLimit?: number
  includeJinaScreenshot?: boolean
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

  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized || !/^-?\d+(\.\d+)?$/.test(normalized)) {
      return null
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, Math.round(value)))
}

function toBaseUrl(domain: string): string {
  const trimmed = domain.trim().replace(/^https?:\/\//i, '')
  const withoutPath = trimmed.split('/')[0]
  return `https://${withoutPath}`
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

function normalizeUrls(value: unknown): string[] {
  const parsed = parseJsonLike(value)

  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === 'string' && item.startsWith('http'))
  }

  if (isRecord(parsed)) {
    const candidates = [parsed.urls, parsed.links, parsed.results]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter(
          (item): item is string => typeof item === 'string' && item.startsWith('http')
        )
      }
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

function extractTaskItem(payload: unknown): Record<string, unknown> | null {
  const parsed = parseJsonLike(payload)
  const root = isRecord(parsed) ? parsed : null
  if (!root || !Array.isArray(root.tasks)) {
    return null
  }

  for (const task of root.tasks) {
    if (!isRecord(task) || !Array.isArray(task.result)) {
      continue
    }

    for (const result of task.result) {
      if (!isRecord(result)) {
        continue
      }

      if (Array.isArray(result.items) && result.items.length > 0 && isRecord(result.items[0])) {
        return result.items[0]
      }

      return result
    }
  }

  return null
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

async function runFirecrawl(baseUrl: string, input: RunWebsiteAuditInput): Promise<{ provider: ProviderPayload; urls: string[] }> {
  const issues: ProviderIssue[] = []
  const mapLimit = clampNumber(input.firecrawlLimit, 1, 50, 15)
  let mapFailed = false
  let crawlFailed = false
  let mapError: string | undefined
  let crawlError: string | undefined

  const urls = new Set<string>([baseUrl])

  try {
    const mapped = await executeTool(
      mcpFirecrawlTools.firecrawl_map,
      { url: baseUrl, limit: mapLimit },
      `website-audit-firecrawl-map-${input.userId}`
    )

    for (const url of normalizeUrls(mapped)) {
      urls.add(url)
    }
  } catch (error) {
    mapFailed = true
    mapError = error instanceof Error ? error.message : 'firecrawl_map failed'
    issues.push({ title: 'Failed to map site URLs with Firecrawl', severity: 'warning' })
  }

  try {
    await executeTool(
      mcpFirecrawlTools.firecrawl_crawl,
      {
        url: baseUrl,
        limit: Math.min(5, mapLimit),
        maxDiscoveryDepth: 1,
        allowSubdomains: false,
        sitemap: 'include',
      },
      `website-audit-firecrawl-crawl-${input.userId}`
    )
  } catch (error) {
    crawlFailed = true
    crawlError = error instanceof Error ? error.message : 'firecrawl_crawl failed'
    issues.push({ title: 'Firecrawl crawl job could not start', severity: 'info' })
  }

  const discoveredUrls = Array.from(urls)
  if (discoveredUrls.length < 2) {
    issues.push({ title: 'Limited crawl coverage detected', severity: 'warning' })
  }

  const score = Math.min(100, 40 + discoveredUrls.length * 12)
  let status: ProviderStatus = 'ok'
  if (mapFailed || crawlFailed) {
    status = discoveredUrls.length > 1 ? 'partial' : 'failed'
  }

  const combinedError = [
    mapError ? `Map error: ${mapError}` : null,
    crawlError ? `Crawl error: ${crawlError}` : null,
  ]
    .filter((value): value is string => value !== null)
    .join('; ')

  return {
    provider: {
      status,
      score,
      issues,
      error: status === 'ok' ? undefined : combinedError || undefined,
    },
    urls: discoveredUrls,
  }
}

async function runDataforseo(urls: string[], input: RunWebsiteAuditInput): Promise<{
  dataforseo: ProviderPayload
  lighthouse: ProviderPayload
}> {
  const targetUrl = urls[0]
  const dataforseoIssues: ProviderIssue[] = []
  const lighthouseIssues: ProviderIssue[] = []

  let dataforseoStatus: ProviderStatus = 'ok'
  let lighthouseStatus: ProviderStatus = 'ok'
  let dataforseoScore = 0
  let lighthouseScore = 0
  let dataforseoError: string | undefined
  let lighthouseError: string | undefined

  const [instantPagesResult, contentParsingResult, lighthouseResult] = await Promise.all([
    executeTool(
      mcpDataforseoTools.on_page_instant_pages,
      { url: targetUrl, enable_javascript: true },
      `website-audit-dfs-instant-${input.userId}`
    ).catch((error) => {
      dataforseoStatus = 'partial'
      dataforseoError = error instanceof Error ? error.message : 'on_page_instant_pages failed'
      dataforseoIssues.push({ title: 'Instant page metrics unavailable', severity: 'warning' })
      return null
    }),
    executeTool(
      mcpDataforseoTools.on_page_content_parsing,
      { url: targetUrl, enable_javascript: true },
      `website-audit-dfs-content-${input.userId}`
    ).catch((error) => {
      dataforseoStatus = 'partial'
      dataforseoError = error instanceof Error ? error.message : 'on_page_content_parsing failed'
      dataforseoIssues.push({ title: 'Content parsing unavailable', severity: 'info' })
      return null
    }),
    executeTool(
      mcpDataforseoTools.on_page_lighthouse,
      { url: targetUrl, enable_javascript: true },
      `website-audit-dfs-lighthouse-${input.userId}`
    ).catch((error) => {
      lighthouseStatus = 'failed'
      lighthouseError = error instanceof Error ? error.message : 'on_page_lighthouse failed'
      lighthouseIssues.push({ title: 'Lighthouse data unavailable', severity: 'warning' })
      return null
    }),
  ])

  const instantItem = extractTaskItem(instantPagesResult)
  if (instantItem) {
    const onPageScore = toNumber(instantItem.onpage_score)
    if (onPageScore !== null) {
      dataforseoScore = Math.max(0, Math.min(100, Math.round(onPageScore)))
    }

    if (instantItem.broken_links === true) {
      dataforseoIssues.push({ title: 'Broken links found', severity: 'warning' })
    }
    if (instantItem.broken_resources === true) {
      dataforseoIssues.push({ title: 'Broken resources found', severity: 'warning' })
    }
    if (instantItem.duplicate_title === true) {
      dataforseoIssues.push({ title: 'Duplicate title tag detected', severity: 'warning' })
    }

    const statusCode = toNumber(instantItem.status_code)
    if (statusCode !== null && statusCode >= 400) {
      dataforseoIssues.push({ title: 'Page returned an error status code', severity: 'critical' })
    }
  } else if (dataforseoStatus === 'ok') {
    dataforseoStatus = 'partial'
    dataforseoIssues.push({ title: 'No DataForSEO instant page payload returned', severity: 'info' })
  }

  const parsedItem = extractTaskItem(contentParsingResult)
  if (!parsedItem && dataforseoStatus === 'ok') {
    dataforseoStatus = 'partial'
  }

  const lighthouseItem = extractTaskItem(lighthouseResult)
  const lighthouseRoot = isRecord(lighthouseItem?.lighthouse_result)
    ? (lighthouseItem.lighthouse_result as Record<string, unknown>)
    : null
  const categories = isRecord(lighthouseRoot?.categories)
    ? (lighthouseRoot.categories as Record<string, unknown>)
    : null

  const categoryScores = ['performance', 'accessibility', 'seo', 'best-practices']
    .map((key) => {
      if (!categories || !isRecord(categories[key])) {
        return null
      }

      const category = categories[key]
      if (!isRecord(category)) {
        return null
      }

      const score = toNumber(category.score)
      return score === null ? null : Math.max(0, Math.min(100, Math.round(score * 100)))
    })
    .filter((score): score is number => score !== null)

  if (categoryScores.length > 0) {
    lighthouseScore = Math.round(
      categoryScores.reduce((total, score) => total + score, 0) / categoryScores.length
    )
    if (lighthouseScore < 70) {
      lighthouseIssues.push({ title: 'Low Lighthouse score', severity: 'critical' })
    } else if (lighthouseScore < 85) {
      lighthouseIssues.push({ title: 'Lighthouse score needs improvement', severity: 'warning' })
    }
  } else if (lighthouseStatus === 'ok') {
    lighthouseStatus = 'partial'
    lighthouseIssues.push({ title: 'Lighthouse categories missing in response', severity: 'info' })
  }

  return {
    dataforseo: {
      status: dataforseoStatus,
      score: dataforseoScore,
      issues: dataforseoIssues,
      error: dataforseoError,
    },
    lighthouse: {
      status: lighthouseStatus,
      score: lighthouseScore,
      issues: lighthouseIssues,
      error: lighthouseError,
    },
  }
}

async function runJina(baseUrl: string, input: RunWebsiteAuditInput): Promise<{ status: ProviderStatus; error?: string }> {
  try {
    await executeTool(
      mcpJinaTools.read_url,
      { url: baseUrl, withAllLinks: true },
      `website-audit-jina-read-${input.userId}`
    )

    if (input.includeJinaScreenshot) {
      await executeTool(
        mcpJinaTools.capture_screenshot_url,
        { url: baseUrl, firstScreenOnly: true, return_url: true },
        `website-audit-jina-screenshot-${input.userId}`
      )
    }

    return { status: 'ok' }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Jina read_url failed',
    }
  }
}

async function runPerplexity(domain: string): Promise<{ status: ProviderStatus; error?: string }> {
  try {
    const result = await searchWithPerplexity({
      query: `Perform a brief technical SEO risk scan for ${domain}. Focus on crawlability, indexing, and page quality risks.`,
      searchRecencyFilter: 'month',
      returnCitations: true,
    })

    if (!result.success) {
      return { status: 'failed', error: result.error || 'Perplexity request failed' }
    }

    return { status: 'ok' }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Perplexity search failed',
    }
  }
}

export async function runWebsiteAudit(input: RunWebsiteAuditInput) {
  const normalizedDomain = normalizeDomain(input.domain)
  if (!normalizedDomain) {
    return normalizeWebsiteAuditPayload({
      providers: {
        firecrawl: {
          status: 'failed',
          score: 0,
          issues: [{ title: 'Invalid domain format provided', severity: 'critical' }],
          error: `Invalid domain: ${input.domain}`,
        },
        dataforseo: {
          status: 'failed',
          score: 0,
          issues: [{ title: 'Website audit skipped due to invalid domain', severity: 'warning' }],
          error: 'Invalid domain prevented DataForSEO audit',
        },
        lighthouse: {
          status: 'failed',
          score: 0,
          issues: [{ title: 'Lighthouse audit skipped due to invalid domain', severity: 'warning' }],
          error: 'Invalid domain prevented Lighthouse audit',
        },
      },
    })
  }

  const maxUrls = clampNumber(input.maxUrls, 1, 10, 3)
  const baseUrl = toBaseUrl(normalizedDomain)

  const firecrawlResult = await runFirecrawl(baseUrl, input)
  const targetUrls = firecrawlResult.urls.slice(0, maxUrls)

  const [dataforseoResult, jinaResult, perplexityResult] = await Promise.all([
    runDataforseo(targetUrls.length > 0 ? targetUrls : [baseUrl], input),
    runJina(baseUrl, input),
    runPerplexity(normalizedDomain),
  ])

  return normalizeWebsiteAuditPayload({
    providers: {
      firecrawl: firecrawlResult.provider,
      dataforseo: dataforseoResult.dataforseo,
      lighthouse: dataforseoResult.lighthouse,
    },
    diagnostics: {
      jina: jinaResult,
      perplexity: perplexityResult,
    },
  })
}
