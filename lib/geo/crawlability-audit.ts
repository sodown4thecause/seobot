/**
 * AI Crawlability Audit — checks robots.txt, llms.txt, and AI crawler access rules.
 */

import { tool } from 'ai'
import { z } from 'zod'

export const AI_CRAWLER_AGENTS = [
  { id: 'GPTBot', label: 'OpenAI GPTBot', vendor: 'OpenAI' },
  { id: 'ChatGPT-User', label: 'ChatGPT-User', vendor: 'OpenAI' },
  { id: 'OAI-SearchBot', label: 'OAI SearchBot', vendor: 'OpenAI' },
  { id: 'PerplexityBot', label: 'PerplexityBot', vendor: 'Perplexity' },
  { id: 'ClaudeBot', label: 'ClaudeBot', vendor: 'Anthropic' },
  { id: 'anthropic-ai', label: 'anthropic-ai', vendor: 'Anthropic' },
  { id: 'Google-Extended', label: 'Google-Extended', vendor: 'Google' },
  { id: 'Applebot-Extended', label: 'Applebot-Extended', vendor: 'Apple' },
] as const

export type CrawlerAccessStatus = 'allowed' | 'partially_blocked' | 'blocked' | 'not_specified'

export interface RobotsRule {
  userAgent: string
  allow: string[]
  disallow: string[]
}

export interface CrawlerAuditResult {
  userAgent: string
  label: string
  vendor: string
  status: CrawlerAccessStatus
  blockedPaths: string[]
  notes: string
}

export interface CrawlabilityAuditResult {
  success: boolean
  domain: string
  robotsTxt: {
    found: boolean
    url: string
    statusCode: number | null
    contentPreview: string | null
    sitemapUrls: string[]
  }
  llmsTxt: {
    found: boolean
    url: string
    statusCode: number | null
    contentPreview: string | null
  }
  crawlers: CrawlerAuditResult[]
  issues: string[]
  recommendations: string[]
  score: number
}

function normalizeDomain(domain: string): string {
  const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return trimmed.split('/')[0]
}

export function parseRobotsTxt(content: string): RobotsRule[] {
  const lines = content.split(/\r?\n/)
  const rules: RobotsRule[] = []
  let current: RobotsRule | null = null

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0].trim()
    if (!line) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim().toLowerCase()
    const value = line.slice(colonIndex + 1).trim()

    if (key === 'user-agent') {
      if (current) rules.push(current)
      current = { userAgent: value, allow: [], disallow: [] }
    } else if (current) {
      if (key === 'allow') current.allow.push(value)
      if (key === 'disallow') current.disallow.push(value)
    }
  }

  if (current) rules.push(current)
  return rules
}

export function extractSitemapUrls(content: string): string[] {
  const urls: string[] = []
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^sitemap:\s*(.+)$/i)
    if (match?.[1]) urls.push(match[1].trim())
  }
  return urls
}

function matchesAgent(ruleAgent: string, targetAgent: string): boolean {
  const rule = ruleAgent.toLowerCase()
  const target = targetAgent.toLowerCase()
  if (rule === '*') return true
  return rule === target
}

function pathMatchesPattern(path: string, pattern: string): boolean {
  if (!pattern || pattern === '') return false

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const normalizedPattern = pattern.startsWith('/') ? pattern : `/${pattern}`
  const endAnchored = normalizedPattern.endsWith('$')
  const patternBody = endAnchored ? normalizedPattern.slice(0, -1) : normalizedPattern
  const regexBody = patternBody
    .split('*')
    .map(part => part.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&'))
    .join('.*')

  return new RegExp(`^${regexBody}${endAnchored ? '$' : ''}`).test(normalizedPath)
}

export function evaluateCrawlerAccess(
  rules: RobotsRule[],
  crawlerId: string,
  checkPaths: string[] = ['/']
): CrawlerAuditResult {
  const meta = AI_CRAWLER_AGENTS.find((c) => c.id === crawlerId)
  const applicable = rules.filter(
    (r) => matchesAgent(r.userAgent, crawlerId) || matchesAgent(r.userAgent, '*')
  )

  if (applicable.length === 0) {
    return {
      userAgent: crawlerId,
      label: meta?.label ?? crawlerId,
      vendor: meta?.vendor ?? 'Unknown',
      status: 'not_specified',
      blockedPaths: [],
      notes: 'No specific rules — default allow assumed.',
    }
  }

  const specific = applicable.filter((r) => r.userAgent !== '*')
  const relevant = specific.length > 0 ? specific : applicable

  const blockedPaths: string[] = []
  let rootBlocked = false

  for (const path of checkPaths) {
    let bestMatch: { type: 'allow' | 'disallow'; length: number } | null = null

    for (const rule of relevant) {
      for (const pattern of rule.disallow) {
        if (pathMatchesPattern(path, pattern) && (!bestMatch || pattern.length > bestMatch.length)) {
          bestMatch = { type: 'disallow', length: pattern.length }
        }
      }
      for (const pattern of rule.allow) {
        if (pathMatchesPattern(path, pattern) && (!bestMatch || pattern.length >= bestMatch.length)) {
          bestMatch = { type: 'allow', length: pattern.length }
        }
      }
    }

    if (bestMatch?.type === 'disallow') {
      blockedPaths.push(path)
      if (path === '/') rootBlocked = true
    }
  }

  const uniqueBlocked = [...new Set(blockedPaths)]

  if (rootBlocked) {
    return {
      userAgent: crawlerId,
      label: meta?.label ?? crawlerId,
      vendor: meta?.vendor ?? 'Unknown',
      status: 'blocked',
      blockedPaths: uniqueBlocked,
      notes: 'Root path disallowed — AI crawlers likely cannot index the site.',
    }
  }

  if (uniqueBlocked.length > 0) {
    return {
      userAgent: crawlerId,
      label: meta?.label ?? crawlerId,
      vendor: meta?.vendor ?? 'Unknown',
      status: 'partially_blocked',
      blockedPaths: uniqueBlocked,
      notes: 'Some paths blocked for this crawler.',
    }
  }

  const hasExplicitAllow = relevant.some((r) => r.allow.length > 0)
  return {
    userAgent: crawlerId,
    label: meta?.label ?? crawlerId,
    vendor: meta?.vendor ?? 'Unknown',
    status: hasExplicitAllow ? 'allowed' : 'not_specified',
    blockedPaths: [],
    notes: hasExplicitAllow
      ? 'Explicit allow rules found.'
      : 'No disallow rules affecting checked paths.',
  }
}

async function fetchText(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FlowIntent-CrawlabilityAudit/1.0' },
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const text = await resp.text()
    return { status: resp.status, text }
  } catch {
    return null
  }
}

export async function runCrawlabilityAudit(
  domainInput: string,
  checkPaths: string[] = ['/']
): Promise<CrawlabilityAuditResult> {
  const domain = normalizeDomain(domainInput)
  const baseUrl = `https://${domain}`
  const robotsUrl = `${baseUrl}/robots.txt`
  const llmsUrl = `${baseUrl}/llms.txt`

  const [robotsResp, llmsResp] = await Promise.all([
    fetchText(robotsUrl),
    fetchText(llmsUrl),
  ])

  const issues: string[] = []
  const recommendations: string[] = []

  const robotsContent = robotsResp?.status === 200 ? robotsResp.text : null
  const rules = robotsContent ? parseRobotsTxt(robotsContent) : []
  const sitemapUrls = robotsContent ? extractSitemapUrls(robotsContent) : []

  if (!robotsContent) {
    issues.push('robots.txt not found or unreachable')
    recommendations.push(
      'Publish a robots.txt that explicitly allows AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended).'
    )
  }

  const llmsContent = llmsResp?.status === 200 ? llmsResp.text : null
  if (!llmsContent) {
    issues.push('llms.txt not found')
    recommendations.push(
      'Add an llms.txt file at /llms.txt describing your site structure and key pages for AI systems.'
    )
  }

  const crawlers = AI_CRAWLER_AGENTS.map((c) =>
    evaluateCrawlerAccess(rules, c.id, checkPaths)
  )

  const blockedCount = crawlers.filter((c) => c.status === 'blocked').length
  const partialCount = crawlers.filter((c) => c.status === 'partially_blocked').length

  if (blockedCount > 0) {
    recommendations.push(
      `${blockedCount} AI crawler(s) appear fully blocked — update robots.txt to allow GPTBot, PerplexityBot, and ClaudeBot on public pages.`
    )
  }

  if (partialCount > 0) {
    recommendations.push(
      'Review partial blocks — ensure blog, product, and comparison pages are not disallowed for AI crawlers.'
    )
  }

  if (sitemapUrls.length === 0 && robotsContent) {
    recommendations.push('Add a Sitemap directive to robots.txt pointing to your XML sitemap.')
  }

  const allowedCount = crawlers.filter(
    (c) => c.status === 'allowed' || c.status === 'not_specified'
  ).length
  const score = Math.round(
    ((allowedCount / crawlers.length) * 70 +
      (robotsContent ? 15 : 0) +
      (llmsContent ? 15 : 0)) *
      (blockedCount === 0 ? 1 : 0.6)
  )

  return {
    success: true,
    domain,
    robotsTxt: {
      found: Boolean(robotsContent),
      url: robotsUrl,
      statusCode: robotsResp?.status ?? null,
      contentPreview: robotsContent?.slice(0, 1200) ?? null,
      sitemapUrls,
    },
    llmsTxt: {
      found: Boolean(llmsContent),
      url: llmsUrl,
      statusCode: llmsResp?.status ?? null,
      contentPreview: llmsContent?.slice(0, 800) ?? null,
    },
    crawlers,
    issues,
    recommendations,
    score: Math.min(100, Math.max(0, score)),
  }
}

export function createAICrawlabilityAuditTool() {
  return tool({
    description:
      'Audit a website for AI crawler access. Checks robots.txt and llms.txt, then evaluates whether ' +
      'GPTBot, PerplexityBot, ClaudeBot, Google-Extended, and other AI crawlers can access the site. ' +
      'Use when the user asks about AI crawlability, robots.txt for AI bots, llms.txt, or why AI engines cannot cite their site.',
    inputSchema: z.object({
      domain: z.string().describe('Website domain to audit (e.g. "example.com")'),
      checkPaths: z
        .array(z.string())
        .optional()
        .describe('Optional paths to evaluate (default: ["/"])'),
    }),
    execute: async ({ domain, checkPaths }) => {
      console.log('[Crawlability Audit] Running for domain')
      return runCrawlabilityAudit(domain, checkPaths?.length ? checkPaths : ['/'])
    },
  })
}
