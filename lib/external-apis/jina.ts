// Jina Reader API Integration
// Scrapes and converts web pages to clean markdown

import { serverEnv } from '@/lib/config/env'

const JINA_API_KEY = serverEnv.JINA_API_KEY
const JINA_READER_URL = 'https://r.jina.ai'

export interface JinaReaderOptions {
  url: string
  timeout?: number
  waitForSelector?: string
  removeSelector?: string
}

export interface JinaReaderResult {
  success: boolean
  url: string
  title?: string
  content?: string
  markdown?: string
  error?: string
  metadata?: {
    description?: string
    author?: string
    publishedDate?: string
    wordCount?: number
  }
}

/**
 * Scrape a URL and convert to clean markdown using Jina Reader
 */
export async function scrapeWithJina(options: JinaReaderOptions): Promise<JinaReaderResult> {
  const { url, timeout = 30000 } = options

  if (!JINA_API_KEY) {
    console.error('[Jina] API key not configured')
    return {
      success: false,
      url,
      error: 'Jina API key not configured',
    }
  }

  try {
    console.log(`[Jina] Scraping URL: ${url}`)

    // Jina Reader API endpoint
    const jinaUrl = `${JINA_READER_URL}/${url}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JINA_API_KEY}`,
        'X-Return-Format': 'markdown',
        'X-With-Generated-Alt': 'true',
        'X-With-Links-Summary': 'true',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Jina] API error: ${response.status} - ${errorText}`)
      return {
        success: false,
        url,
        error: `Jina API error: ${response.status}`,
      }
    }

    const markdown = await response.text()

    // Extract metadata from markdown (Jina includes frontmatter)
    const metadata = extractMetadata(markdown)
    const cleanContent = removeMetadataFromMarkdown(markdown)

    console.log(`[Jina] Successfully scraped ${url} (${metadata.wordCount || 0} words)`)

    return {
      success: true,
      url,
      title: metadata.title,
      content: cleanContent,
      markdown: cleanContent,
      metadata: {
        description: metadata.description,
        author: metadata.author,
        publishedDate: metadata.publishedDate,
        wordCount: metadata.wordCount,
      },
    }
  } catch (error) {
    console.error('[Jina] Scraping error:', error)
    return {
      success: false,
      url,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Scrape multiple URLs in parallel
 */
export async function scrapeMultipleWithJina(
  urls: string[],
  options?: Omit<JinaReaderOptions, 'url'>
): Promise<JinaReaderResult[]> {
  console.log(`[Jina] Scraping ${urls.length} URLs in parallel`)

  const results = await Promise.all(
    urls.map((url) =>
      scrapeWithJina({
        url,
        ...options,
      })
    )
  )

  const successCount = results.filter((r) => r.success).length
  console.log(`[Jina] Completed: ${successCount}/${urls.length} successful`)

  return results
}

/**
 * Extract metadata from Jina markdown response
 */
function extractMetadata(markdown: string): {
  title?: string
  description?: string
  author?: string
  publishedDate?: string
  wordCount?: number
} {
  const metadata: any = {}

  // Extract title (usually first # heading)
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    metadata.title = titleMatch[1].trim()
  }

  // Extract description (usually in frontmatter or meta tags)
  const descMatch = markdown.match(/Description:\s*(.+)$/m)
  if (descMatch) {
    metadata.description = descMatch[1].trim()
  }

  // Extract author
  const authorMatch = markdown.match(/Author:\s*(.+)$/m)
  if (authorMatch) {
    metadata.author = authorMatch[1].trim()
  }

  // Extract published date
  const dateMatch = markdown.match(/Published:\s*(.+)$/m)
  if (dateMatch) {
    metadata.publishedDate = dateMatch[1].trim()
  }

  // Count words
  const cleanText = markdown.replace(/[#*`\[\]()]/g, '')
  const words = cleanText.trim().split(/\s+/)
  metadata.wordCount = words.length

  return metadata
}

/**
 * Remove metadata frontmatter from markdown
 */
function removeMetadataFromMarkdown(markdown: string): string {
  // Remove YAML frontmatter if present
  let cleaned = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')

  // Remove metadata lines
  cleaned = cleaned.replace(/^(Title|Description|Author|Published):\s*.+$/gm, '')

  // Remove extra blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

/**
 * Analyze scraped content for EEAT signals
 */
export function analyzeEEATSignals(content: string): {
  hasAuthorBio: boolean
  hasExpertQuotes: boolean
  hasCitations: boolean
  hasStatistics: boolean
  hasExamples: boolean
  hasUpdatedDate: boolean
  signals: string[]
} {
  const signals: string[] = []

  // Check for author bio
  const hasAuthorBio = /about the author|author bio|written by/i.test(content)
  if (hasAuthorBio) signals.push('Author bio present')

  // Check for expert quotes
  const hasExpertQuotes = /"[^"]{20,}"\s*[-–—]\s*[A-Z][a-z]+\s+[A-Z][a-z]+/g.test(content)
  if (hasExpertQuotes) signals.push('Expert quotes found')

  // Check for citations
  const hasCitations = /\[[\d,\s]+\]|\(\d{4}\)|according to|research shows|study found/i.test(content)
  if (hasCitations) signals.push('Citations present')

  // Check for statistics
  const hasStatistics = /\d+%|\d+\s*(percent|million|billion|thousand)/i.test(content)
  if (hasStatistics) signals.push('Statistics included')

  // Check for examples
  const hasExamples = /for example|for instance|such as|case study/i.test(content)
  if (hasExamples) signals.push('Examples provided')

  // Check for updated date
  const hasUpdatedDate = /updated|last modified|revised/i.test(content)
  if (hasUpdatedDate) signals.push('Recently updated')

  return {
    hasAuthorBio,
    hasExpertQuotes,
    hasCitations,
    hasStatistics,
    hasExamples,
    hasUpdatedDate,
    signals,
  }
}

