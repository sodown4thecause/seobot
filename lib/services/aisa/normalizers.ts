import type { AisaUsageSummary, DataForSeoResponse } from './schemas'

export interface NormalizedDataForSeoResponse {
  ok: boolean
  usage: AisaUsageSummary
  firstError?: {
    statusCode?: number
    statusMessage: string
  }
  raw: DataForSeoResponse
}

export interface NormalizedAiProbeResult {
  taskId?: string
  modelName?: string
  responseText?: string
  citedUrls: string[]
  citedDomains: string[]
  inputTokens?: number
  outputTokens?: number
  moneySpent?: number
  datetime?: string
}

export interface NormalizedGoogleAiOverviewResult {
  taskId?: string
  keyword?: string
  checkUrl?: string
  datetime?: string
  markdown?: string
  citedUrls: string[]
  citedDomains: string[]
  itemTypes: string[]
}

export interface NormalizedBacklinkSummary {
  target?: string
  backlinks?: number
  referringDomains?: number
  referringPages?: number
  referringIps?: number
  referringSubnets?: number
  brokenBacklinks?: number
  brokenPages?: number
  firstSeen?: string
  lostBacklinks?: number
  newBacklinks?: number
  spamScore?: number
}

export interface NormalizedBacklinkItem {
  sourceUrl?: string
  targetUrl?: string
  sourceDomain?: string
  targetDomain?: string
  anchorText?: string
  linkType: 'dofollow' | 'nofollow' | 'unknown'
  rank?: number
  spamScore?: number
  firstSeen?: string
  isNew?: boolean
  isLost?: boolean
}

export interface NormalizedBacklinkCollection {
  target?: string
  totalCount: number
  itemsCount: number
  items: NormalizedBacklinkItem[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

function extractUrlsFromRecords(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (!isRecord(item)) return []
    const url = getString(item.url)
    return url ? [url] : []
  })
}

export function normalizeDataForSeoResponse(
  endpoint: string,
  response: DataForSeoResponse,
): NormalizedDataForSeoResponse {
  const tasks = response.tasks ?? []
  const taskCosts = tasks.reduce((sum, task) => sum + (task.cost ?? 0), 0)
  const costUsd = response.cost ?? taskCosts
  const erroredTask = tasks.find(task => task.status_code !== undefined && task.status_code !== 20000)
  const topLevelError = response.status_code !== undefined && response.status_code !== 20000

  return {
    ok: !topLevelError && !erroredTask && (response.tasks_error ?? 0) === 0,
    usage: {
      provider: 'aisa',
      endpoint,
      statusCode: response.status_code,
      statusMessage: response.status_message,
      tasksCount: response.tasks_count ?? tasks.length,
      tasksError: response.tasks_error ?? (erroredTask ? 1 : 0),
      costUsd,
      taskIds: tasks.map(task => task.id).filter((id): id is string => Boolean(id)),
    },
    firstError: topLevelError || erroredTask
      ? {
          statusCode: erroredTask?.status_code ?? response.status_code,
          statusMessage: erroredTask?.status_message ?? response.status_message ?? 'AIsa/DataForSEO request failed',
        }
      : undefined,
    raw: response,
  }
}

export function normalizeAiProbeResult(response: DataForSeoResponse): NormalizedAiProbeResult | null {
  const task = response.tasks?.[0]
  const result = task?.result?.[0]
  if (!isRecord(result)) return null

  const message = isRecord(result.message) ? result.message : null
  const messageSections = message && Array.isArray(message.sections) ? message.sections : []
  const items = Array.isArray(result.items) ? result.items : []
  const extractSectionTexts = (sections: unknown[]) => sections.flatMap((section) => {
    if (!isRecord(section)) return []
    const text = getString(section.text)
    return text ? [text] : []
  })
  const messageTexts = [
    ...extractSectionTexts(messageSections),
    ...items.flatMap((item) => {
      if (!isRecord(item)) return []
      const sections = Array.isArray(item.sections) ? item.sections : []
      return extractSectionTexts(sections)
    }),
  ]

  const messageAnnotations = messageSections.flatMap((section) => {
    if (!isRecord(section) || !Array.isArray(section.annotations)) return []
    return section.annotations.flatMap((annotation) => {
      if (!isRecord(annotation)) return []
      const url = getString(annotation.url)
      return url ? [url] : []
    })
  })

  const itemCitations = items.flatMap((item) => {
    if (!isRecord(item)) return []
    const sections = Array.isArray(item.sections) ? item.sections : []
    return [
      ...extractUrlsFromRecords(item.annotations),
      ...extractUrlsFromRecords(item.references),
      ...extractUrlsFromRecords(item.citations),
      ...sections.flatMap(section => isRecord(section) ? extractUrlsFromRecords(section.annotations) : []),
    ]
  })

  const citedUrls = Array.from(new Set([
    ...messageAnnotations,
    ...itemCitations,
    ...items.flatMap((item) => {
      if (!isRecord(item)) return []
      return [
        ...extractUrlsFromRecords(item.references),
        ...extractUrlsFromRecords(item.citations),
      ]
    }),
  ]))
  const citedDomains = Array.from(new Set(citedUrls.map(extractDomain).filter((domain): domain is string => Boolean(domain))))

  return {
    taskId: task?.id,
    modelName: getString(result.model_name),
    responseText: messageTexts.join('\n\n') || getString(result.message) || getString(result.text),
    citedUrls,
    citedDomains,
    inputTokens: getNumber(result.input_tokens),
    outputTokens: getNumber(result.output_tokens),
    moneySpent: getNumber(result.money_spent),
    datetime: getString(result.datetime),
  }
}

export function normalizeGoogleAiOverviewResult(response: DataForSeoResponse): NormalizedGoogleAiOverviewResult | null {
  const task = response.tasks?.[0]
  const result = task?.result?.[0]
  if (!isRecord(result)) return null

  const items = Array.isArray(result.items) ? result.items : []
  const aiOverview = items.find((item): item is Record<string, unknown> =>
    isRecord(item) && item.type === 'ai_overview',
  )
  if (!aiOverview) return null

  const references = Array.isArray(aiOverview.references) ? aiOverview.references : []
  const urls = references.flatMap((reference) => {
    if (!isRecord(reference)) return []
    const url = getString(reference.url)
    return url ? [url] : []
  })
  const markdown = getString(aiOverview.markdown) ?? getString(aiOverview.text)

  return {
    taskId: task?.id,
    keyword: getString(result.keyword),
    checkUrl: getString(result.check_url),
    datetime: getString(result.datetime),
    markdown,
    citedUrls: urls,
    citedDomains: Array.from(new Set(urls.map(extractDomain).filter((domain): domain is string => Boolean(domain)))),
    itemTypes: getStringArray(result.item_types),
  }
}

function firstDataForSeoResult(response: DataForSeoResponse): Record<string, unknown> | null {
  const result = response.tasks?.[0]?.result?.[0]
  return isRecord(result) ? result : null
}

export function normalizeBacklinkSummary(response: DataForSeoResponse): NormalizedBacklinkSummary | null {
  const result = firstDataForSeoResult(response)
  if (!result) return null

  return {
    target: getString(result.target),
    backlinks: getNumber(result.backlinks),
    referringDomains: getNumber(result.referring_domains),
    referringPages: getNumber(result.referring_pages),
    referringIps: getNumber(result.referring_ips),
    referringSubnets: getNumber(result.referring_subnets),
    brokenBacklinks: getNumber(result.broken_backlinks),
    brokenPages: getNumber(result.broken_pages),
    firstSeen: getString(result.first_seen),
    lostBacklinks: getNumber(result.lost_backlinks),
    newBacklinks: getNumber(result.new_backlinks),
    spamScore: getNumber(result.backlinks_spam_score) ?? getNumber(result.spam_score),
  }
}

export function normalizeBacklinkCollection(response: DataForSeoResponse): NormalizedBacklinkCollection | null {
  const result = firstDataForSeoResult(response)
  if (!result) return null

  const rawItems = Array.isArray(result.items) ? result.items : []
  const items = rawItems.flatMap((item): NormalizedBacklinkItem[] => {
    if (!isRecord(item)) return []
    const nofollow = item.dofollow === false || item.nofollow === true
    const dofollow = item.dofollow === true

    return [{
      sourceUrl: getString(item.url_from),
      targetUrl: getString(item.url_to),
      sourceDomain: getString(item.domain_from) ?? getString(item.domain),
      targetDomain: getString(item.domain_to),
      anchorText: getString(item.anchor),
      linkType: dofollow ? 'dofollow' : nofollow ? 'nofollow' : 'unknown',
      rank: getNumber(item.rank),
      spamScore: getNumber(item.backlink_spam_score) ?? getNumber(item.backlinks_spam_score),
      firstSeen: getString(item.first_seen),
      isNew: typeof item.is_new === 'boolean' ? item.is_new : undefined,
      isLost: typeof item.is_lost === 'boolean' ? item.is_lost : undefined,
    }]
  })

  return {
    target: getString(result.target),
    totalCount: getNumber(result.total_count) ?? items.length,
    itemsCount: getNumber(result.items_count) ?? items.length,
    items,
  }
}
