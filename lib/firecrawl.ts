import 'server-only'

import { serverEnv } from '@/lib/config/env'

interface FirecrawlScrapeResult {
  markdown: string
  html: string
  title: string
  url: string
}

export interface FirecrawlBrandContext {
  homepageUrl: string
  aboutUrl: string | null
  brandName: string
  brandSummary: string
  topics: string[]
  productDescriptors: string[]
  incomplete: boolean
  errors: string[]
}

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape'

const ABOUT_PATH_HINTS = ['/about', '/about-us', '/company', '/our-story', '/team', '/who-we-are']

const STOPWORDS = new Set([
  'about',
  'after',
  'also',
  'because',
  'been',
  'being',
  'between',
  'could',
  'does',
  'from',
  'have',
  'into',
  'only',
  'that',
  'their',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'very',
  'what',
  'with',
  'your',
  'platform',
  'service',
  'services',
])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeHost(urlOrHost: string): string {
  if (urlOrHost.startsWith('http://') || urlOrHost.startsWith('https://')) {
    return new URL(urlOrHost).hostname.toLowerCase().replace(/^www\./, '')
  }
  return urlOrHost.toLowerCase().replace(/^www\./, '')
}

function hostFromUrl(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
}

function extractTitleCandidate(title: string, fallbackHost: string): string {
  const cleaned = title.trim()
  if (!cleaned) {
    return fallbackHost.split('.')[0]
  }

  const segment = cleaned.split(/\s*\|\s*/)[0].split(/\s+[-\u2012\u2013\u2014\u2015]\s+/)[0].trim()
  return segment || fallbackHost.split('.')[0]
}

function extractSentences(text: string): string[] {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35)
}

function generateBrandSummary(markdown: string, fallback: string): string {
  const sentences = extractSentences(markdown)
  if (sentences.length === 0) {
    return fallback
  }

  if (sentences.length === 1) {
    return sentences[0]
  }

  return `${sentences[0]} ${sentences[1]}`
}

function extractTopics(markdown: string): string[] {
  const headings = markdown
    .split('\n')
    .filter((line) => line.startsWith('#'))
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .filter(Boolean)

  const words = markdown
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))

  const frequencies = new Map<string, number>()
  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) || 0) + 1)
  }

  const frequentTerms = Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term]) => term)

  const topicSet = new Set<string>()
  for (const heading of headings.slice(0, 8)) {
    topicSet.add(heading)
  }
  for (const term of frequentTerms) {
    topicSet.add(term)
  }

  return Array.from(topicSet).slice(0, 12)
}

function extractProductDescriptors(markdown: string): string[] {
  const descriptorRegex =
    /\b(platform|software|tool|service|solution|agency|app|automation|analytics|consulting|assistant|framework|workflow)\b/gi
  const matches = markdown.match(descriptorRegex) ?? []
  const set = new Set<string>()
  for (const match of matches) {
    set.add(match.toLowerCase())
  }
  return Array.from(set).slice(0, 8)
}

function extractLinksFromContent(markdown: string, html: string): string[] {
  const links = new Set<string>()

  const markdownMatches = markdown.match(/\[[^\]]+\]\(([^)]+)\)/g) ?? []
  for (const match of markdownMatches) {
    const linkMatch = match.match(/\(([^)]+)\)/)
    if (linkMatch?.[1]) links.add(linkMatch[1])
  }

  const htmlMatches = html.match(/href=["']([^"']+)["']/gi) ?? []
  for (const match of htmlMatches) {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i)
    if (hrefMatch?.[1]) links.add(hrefMatch[1])
  }

  return Array.from(links)
}

function resolveAboutUrl(homepageUrl: string, markdown: string, html: string): string | null {
  const homepage = new URL(homepageUrl)
  const sameHost = normalizeHost(homepage.hostname)
  const links = extractLinksFromContent(markdown, html)

  const candidates = new Set<string>()
  for (const link of links) {
    try {
      const resolved = new URL(link, homepage.origin)
      const normalizedHost = normalizeHost(resolved.hostname)
      if (normalizedHost !== sameHost) continue

      const path = resolved.pathname.toLowerCase()
      if (ABOUT_PATH_HINTS.some((hint) => path.includes(hint))) {
        candidates.add(resolved.toString())
      }
    } catch {
      // Ignore malformed links.
    }
  }

  if (candidates.size > 0) {
    return Array.from(candidates)[0]
  }

  return null
}

async function scrapeWithFirecrawl(args: {
  url: string
  timeoutMs: number
  retries: number
}): Promise<FirecrawlScrapeResult> {
  if (!serverEnv.FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl is not configured')
  }

let lastError: unknown
  for (let attempt = 0; attempt <= args.retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), args.timeoutMs)

    try {
      const response = await fetch(FIRECRAWL_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serverEnv.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: args.url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Firecrawl HTTP ${response.status}: ${errorText.slice(0, 300)}`)
      }

      const data = (await response.json()) as {
        data?: {
          markdown?: string
          html?: string
          metadata?: { title?: string; sourceURL?: string }
        }
      }

      const markdown = data.data?.markdown?.trim() || ''
      const html = data.data?.html?.trim() || ''
      const title = data.data?.metadata?.title?.trim() || ''
      const sourceUrl = data.data?.metadata?.sourceURL?.trim() || args.url

      if (!markdown && !html) {
        throw new Error('Firecrawl returned empty content')
      }

      return {
        markdown,
        html,
        title,
        url: sourceUrl,
      }
} catch (error) {
      lastError = error
      if (attempt < args.retries) {
        await sleep(250 * (attempt + 1))
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Firecrawl scraping failed')
}

export async function scrapeBrandContext(args: {
  domain: string
  timeoutMs: number
  retries: number
}): Promise<FirecrawlBrandContext> {
  const homepageUrl = `https://${normalizeHost(args.domain)}`
  const errors: string[] = []

  let homepage: FirecrawlScrapeResult | null = null
  let aboutPage: FirecrawlScrapeResult | null = null

  try {
    homepage = await scrapeWithFirecrawl({
      url: homepageUrl,
      timeoutMs: args.timeoutMs,
      retries: args.retries,
    })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to scrape homepage')
  }

  let aboutUrl: string | null = null
  if (homepage) {
    const candidate = resolveAboutUrl(homepage.url, homepage.markdown, homepage.html)
    if (candidate && normalizeHost(hostFromUrl(candidate)) === normalizeHost(args.domain)) {
      aboutUrl = candidate
      try {
        aboutPage = await scrapeWithFirecrawl({
          url: candidate,
          timeoutMs: args.timeoutMs,
          retries: args.retries,
        })
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Failed to scrape about page')
      }
    }
  }

  const fallbackBrand = normalizeHost(args.domain).split('.')[0]
  const homepageTitle = homepage?.title || ''
  const brandName = extractTitleCandidate(homepageTitle, normalizeHost(args.domain))

  const combinedMarkdown = [homepage?.markdown || '', aboutPage?.markdown || '']
    .filter(Boolean)
    .join('\n\n')

  const fallbackSummary = `${brandName} is a company operating at ${normalizeHost(args.domain)}.`

  return {
    homepageUrl,
    aboutUrl,
    brandName: brandName || fallbackBrand,
    brandSummary: combinedMarkdown
      ? generateBrandSummary(combinedMarkdown, fallbackSummary)
      : fallbackSummary,
    topics: combinedMarkdown ? extractTopics(combinedMarkdown) : [],
    productDescriptors: combinedMarkdown ? extractProductDescriptors(combinedMarkdown) : [],
    incomplete: errors.length > 0,
    errors,
  }
}
