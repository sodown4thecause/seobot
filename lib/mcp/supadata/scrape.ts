import 'server-only'
import { scrapeUrl } from './client'

export interface ScrapedContent {
  url: string
  content: string
  title: string
  description: string
  characterCount: number
}

export async function scrapeWebPage(url: string): Promise<ScrapedContent | null> {
  try {
    const result = await scrapeUrl(url, { noLinks: true })
    return {
      url: result.url,
      content: result.content,
      title: result.name,
      description: result.description,
      characterCount: result.countCharacters,
    }
  } catch (error) {
    console.warn(`[Supadata] Failed to scrape ${url}:`, error)
    return null
  }
}

export interface CompetitorContentAnalysis {
  topics: string[]
  questions: string[]
  headings: string[]
  contentLength: number
}

export function analyzeScrapedContent(content: ScrapedContent | null): CompetitorContentAnalysis {
  if (!content || !content.content) {
    return { topics: [], questions: [], headings: [], contentLength: 0 }
  }

  const text = content.content

  const headingPattern = /^#{1,6}\s+(.+)$/gm
  const headings: string[] = []
  let match: RegExpExecArray | null
  while ((match = headingPattern.exec(text)) !== null) {
    headings.push(match[1].trim())
  }

  const questionPattern = /(?:^|\n)\s*([^.\n]{10,100}\?(?:\s|$))/gm
  const questions: string[] = []
  while ((match = questionPattern.exec(text)) !== null) {
    questions.push(match[1].trim())
  }

  const words = text.split(/\s+/).filter(Boolean)
  const wordFreq = new Map<string, number>()
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (lower.length > 4) {
      wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1)
    }
  }
  const topics = Array.from(wordFreq.entries())
    .filter(([, freq]) => freq > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)

  return {
    topics,
    questions: questions.slice(0, 30),
    headings: headings.slice(0, 30),
    contentLength: text.length,
  }
}