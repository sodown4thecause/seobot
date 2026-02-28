import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireUserId } from '@/lib/auth/clerk'
import { serverEnv } from '@/lib/config/env'

export const runtime = 'nodejs'

const requestSchema = z.object({
  domain: z.string().trim().min(1),
  limit: z.number().int().min(1).max(200).optional(),
})

interface BacklinkItemRecord {
  source_url?: string
  sourceUrl?: string
  from_url?: string
  fromUrl?: string
  referring_url?: string
  referringUrl?: string
  domain_from?: string
  source_domain?: string
  sourceDomain?: string
  referring_domain?: string
  referringDomain?: string
  url_from?: string
  target_url?: string
  targetUrl?: string
  to_url?: string
  toUrl?: string
  url_to?: string
  domain_to?: string
  domainTo?: string
  type?: string
  dofollow?: boolean
  follow?: boolean
  nofollow?: boolean
  domainRank?: number
  domain_from_rank?: number
  domain_authority?: number
  authority?: number
  da?: number
  backlink_spam_score?: number
  spam_score?: number
  spamScore?: number
  first_seen?: string
  created_at?: string
  createdAt?: string
  discovered_at?: string
  discoveredAt?: string
  last_seen?: string
  updated_at?: string
  updatedAt?: string
  is_new?: boolean
  isNew?: boolean
  is_lost?: boolean
  isLost?: boolean
}

interface BacklinkResponseItem {
  sourceDomain: string
  sourceUrl: string
  targetUrl: string
  type: string
  domainRank: number
  spamScore: number
  firstSeen: string
  lastSeen: string
  isNew: boolean
  isLost: boolean
}

interface ReferringDomainRow {
  domain: string
  count: number
}

interface BacklinksPayloadLike {
  status_code?: number
  tasks_error?: number
  total_backlinks?: number
  backlinks_count?: number
  backlinksCount?: number
  referring_domains_count?: number
  referringDomainsCount?: number
  ref_domains_count?: number
  domain_rank?: number
  domainRank?: number
  backlinks_spam_score?: number
  spam_score?: number
  spamScore?: number
  backlinks?: unknown[]
  links?: unknown[]
  items?: unknown[]
  results?: unknown[]
  data?: unknown[]
  result?: unknown[]
  backlinkData?: unknown[]
  tasks?: Array<Record<string, unknown>>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .toLowerCase()
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function toBoolean(value: unknown): boolean {
  return value === true
}

function toHostname(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return ''
  }

  const raw = value.trim()
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    return new URL(withScheme).hostname
  } catch {
    return ''
  }
}

function extractBacklinkRows(raw: unknown): BacklinkItemRecord[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is BacklinkItemRecord => isRecord(item))
  }

  if (!isRecord(raw)) {
    return []
  }

  const payload = raw as BacklinksPayloadLike

  const directCandidates = [
    payload.backlinks,
    payload.links,
    payload.items,
    payload.results,
    payload.data,
    payload.result,
    payload.backlinkData,
  ]

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is BacklinkItemRecord => isRecord(item))
    }
  }

  const rows: BacklinkItemRecord[] = []

  if (Array.isArray(payload.tasks)) {
    for (const task of payload.tasks) {
      if (!isRecord(task)) {
        continue
      }

      const taskResult = task.result
      if (!Array.isArray(taskResult)) {
        continue
      }

      for (const resultEntry of taskResult) {
        if (isRecord(resultEntry) && Array.isArray(resultEntry.items)) {
          for (const item of resultEntry.items) {
            if (isRecord(item)) {
              rows.push(item as BacklinkItemRecord)
            }
          }
          continue
        }

        if (isRecord(resultEntry)) {
          rows.push(resultEntry as BacklinkItemRecord)
        }
      }
    }
  }

  return rows
}

function buildReferringDomains(backlinks: BacklinkResponseItem[]): ReferringDomainRow[] {
  const counts = new Map<string, number>()

  for (const backlink of backlinks) {
    if (!backlink.sourceDomain) {
      continue
    }

    const current = counts.get(backlink.sourceDomain) ?? 0
    counts.set(backlink.sourceDomain, current + 1)
  }

  return Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 50)
}

function normalizeBacklink(item: BacklinkItemRecord): BacklinkResponseItem {
  const sourceUrl =
    toStringValue(item.source_url) ||
    toStringValue(item.sourceUrl) ||
    toStringValue(item.from_url) ||
    toStringValue(item.fromUrl) ||
    toStringValue(item.referring_url) ||
    toStringValue(item.referringUrl) ||
    toStringValue(item.url_from)

  const targetUrl =
    toStringValue(item.target_url) ||
    toStringValue(item.targetUrl) ||
    toStringValue(item.to_url) ||
    toStringValue(item.toUrl) ||
    toStringValue(item.url_to)

  const sourceDomain =
    toStringValue(item.referring_domain) ||
    toStringValue(item.referringDomain) ||
    toStringValue(item.source_domain) ||
    toStringValue(item.sourceDomain) ||
    toStringValue(item.domain_from) ||
    toHostname(sourceUrl)

  const firstSeen =
    toStringValue(item.first_seen) ||
    toStringValue(item.created_at) ||
    toStringValue(item.createdAt) ||
    toStringValue(item.discovered_at) ||
    toStringValue(item.discoveredAt)

  const lastSeen =
    toStringValue(item.last_seen) ||
    toStringValue(item.updated_at) ||
    toStringValue(item.updatedAt)

  const resolvedType =
    toStringValue(item.type) ||
    (item.dofollow === true || item.follow === true ? 'dofollow' : item.nofollow === true ? 'nofollow' : 'link')

  return {
    sourceDomain,
    sourceUrl,
    targetUrl,
    type: resolvedType,
    domainRank:
      toNumber(item.domain_from_rank) ||
      toNumber(item.domainRank) ||
      toNumber(item.domain_authority) ||
      toNumber(item.authority) ||
      toNumber(item.da),
    spamScore: toNumber(item.backlink_spam_score) || toNumber(item.spam_score) || toNumber(item.spamScore),
    firstSeen,
    lastSeen,
    isNew: toBoolean(item.is_new) || toBoolean(item.isNew),
    isLost: toBoolean(item.is_lost) || toBoolean(item.isLost),
  }
}

function getSummaryValue(payload: BacklinksPayloadLike | null, key: keyof BacklinksPayloadLike): number {
  if (!payload) return 0
  return toNumber(payload[key])
}

export async function POST(request: NextRequest) {
  try {
    await requireUserId()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload', issues: parsed.error.issues }, { status: 400 })
    }

    const domain = normalizeDomainInput(parsed.data.domain)
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const limit = parsed.data.limit ?? 100

    const baseUrl = serverEnv.N8N_BACKLINKS_WEBHOOK_URL || 'https://zuded9wg.rcld.app/webhook/domain'
    const webhookUrl = `${baseUrl}?domain=${encodeURIComponent(domain)}`

    const webhookResponse = await fetch(webhookUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!webhookResponse.ok) {
      const bodyText = await webhookResponse.text().catch(() => '')
      return NextResponse.json(
        {
          error: `Webhook request failed (${webhookResponse.status})`,
          details: bodyText || webhookResponse.statusText,
        },
        { status: 502 }
      )
    }

    let webhookPayload: unknown
    try {
      webhookPayload = await webhookResponse.json()
    } catch {
      return NextResponse.json({ error: 'Webhook returned invalid JSON' }, { status: 502 })
    }

    const payloadLike = isRecord(webhookPayload) ? (webhookPayload as BacklinksPayloadLike) : null
    const providerStatusCode = getSummaryValue(payloadLike, 'status_code')
    const providerTasksError = getSummaryValue(payloadLike, 'tasks_error')
    if ((providerStatusCode && providerStatusCode !== 20000) || providerTasksError > 0) {
      return NextResponse.json(
        {
          error: 'Backlinks provider returned an error payload',
          providerStatusCode,
          providerTasksError,
        },
        { status: 502 }
      )
    }

    const rawBacklinks = extractBacklinkRows(webhookPayload)

    const backlinks: BacklinkResponseItem[] = rawBacklinks.slice(0, limit).map(normalizeBacklink)

    const referringDomains = buildReferringDomains(backlinks)
    const totalBacklinksCandidate =
      getSummaryValue(payloadLike, 'total_backlinks') ||
      getSummaryValue(payloadLike, 'backlinks_count') ||
      getSummaryValue(payloadLike, 'backlinksCount')

    const referringDomainsCandidate =
      getSummaryValue(payloadLike, 'referring_domains_count') ||
      getSummaryValue(payloadLike, 'referringDomainsCount') ||
      getSummaryValue(payloadLike, 'ref_domains_count')

    const domainRankCandidate = getSummaryValue(payloadLike, 'domain_rank') || getSummaryValue(payloadLike, 'domainRank')
    const spamScoreCandidate =
      getSummaryValue(payloadLike, 'backlinks_spam_score') ||
      getSummaryValue(payloadLike, 'spam_score') ||
      getSummaryValue(payloadLike, 'spamScore')

    return NextResponse.json({
      success: true,
      domain,
      totalBacklinks: totalBacklinksCandidate || rawBacklinks.length,
      backlinks,
      referringDomains,
      summary: {
        domainRank: domainRankCandidate,
        backlinks: totalBacklinksCandidate || rawBacklinks.length,
        referringDomains: referringDomainsCandidate || referringDomains.length,
        spamScore: spamScoreCandidate,
      },
      providerStatus: {
        webhook: 'ok',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load backlink profile' },
      { status: 500 }
    )
  }
}
