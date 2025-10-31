import { serverEnv } from '@/lib/config/env'
import type { JinaContentExtraction, ApiResult, ApiError } from '@/lib/types/api-responses'

const JINA_READER_URL = 'https://r.jina.ai'

function estimateReadingTime(wordCount: number): number {
  // Average reading speed: 200 words per minute
  return Math.ceil(wordCount / 200)
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length
}

export async function extractCleanText(url: string): Promise<ApiResult<JinaContentExtraction>> {
  try {
    const targetUrl = `${JINA_READER_URL}/${encodeURIComponent(url)}`
    
    const res = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${serverEnv.JINA_API_KEY}`,
        'X-Return-Format': 'markdown',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      const error: ApiError = {
        code: 'JINA_HTTP_ERROR',
        message: `HTTP ${res.status}: ${text}`,
        statusCode: res.status,
      }
      return { success: false, error }
    }

    const markdown = await res.text()
    
    // Parse markdown to extract structure
    const lines = markdown.split('\n')
    const blocks: JinaContentExtraction['blocks'] = []
    const links: Array<{ text: string; href: string }> = []
    const images: Array<{ src: string; alt: string }> = []
    
    let title = ''
    let description = ''
    
    for (const line of lines) {
      if (line.startsWith('# ') && !title) {
        title = line.slice(2).trim()
        blocks.push({ type: 'heading', content: title, level: 1 })
      } else if (line.startsWith('## ')) {
        blocks.push({ type: 'heading', content: line.slice(3).trim(), level: 2 })
      } else if (line.startsWith('### ')) {
        blocks.push({ type: 'heading', content: line.slice(4).trim(), level: 3 })
      } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        blocks.push({ type: 'list', content: line.trim().slice(2) })
      } else if (line.trim().length > 0) {
        blocks.push({ type: 'paragraph', content: line.trim() })
        if (!description && line.trim().length > 50) {
          description = line.trim().slice(0, 200)
        }
      }
      
      // Extract links
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      let match
      while ((match = linkRegex.exec(line)) !== null) {
        links.push({ text: match[1], href: match[2] })
      }
      
      // Extract images
      const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
      while ((match = imgRegex.exec(line)) !== null) {
        images.push({ src: match[2], alt: match[1] })
      }
    }

    const wordCount = countWords(markdown)
    const readingTime = estimateReadingTime(wordCount)

    const extraction: JinaContentExtraction = {
      url,
      title,
      description,
      content: markdown,
      blocks,
      links,
      images,
      metadata: {
        wordCount,
        readingTime,
      },
    }

    return { success: true, data: extraction }
  } catch (e: unknown) {
    const err = e as Error
    const error: ApiError = {
      code: 'JINA_NETWORK_ERROR',
      message: err?.message ?? 'Network error',
      statusCode: 0,
    }
    return { success: false, error }
  }
}

export async function extractMetadata(url: string) {
  const result = await extractCleanText(url)
  if (!result.success) {
    return result
  }
  
  return {
    success: true,
    data: {
      title: result.data.title,
      description: result.data.description,
      wordCount: result.data.metadata.wordCount,
      readingTime: result.data.metadata.readingTime,
      links: result.data.links.length,
      images: result.data.images.length,
    },
  } as const
}
