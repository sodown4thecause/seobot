/**
 * Content Export API
 *
 * Exports generated content in multiple formats:
 * - HTML: Styled HTML document
 * - Markdown: Standard Markdown format
 * - Plain Text: Clean text version
 * - JSON: Structured data format
 */

import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'

export const runtime = 'edge'

interface ExportRequest {
  content: string
  format: 'html' | 'markdown' | 'text' | 'json'
  metadata?: {
    title?: string
    author?: string
    date?: string
    tags?: string[]
  }
}

/**
 * Convert content to Markdown format
 */
function toMarkdown(content: string, metadata?: ExportRequest['metadata']): string {
  const { title, author, date, tags } = metadata || {}

  let markdown = ''

  if (title) {
    markdown += `# ${title}\n\n`
  }

  if (author || date) {
    const parts = []
    if (author) parts.push(`**Author:** ${author}`)
    if (date) parts.push(`**Date:** ${date}`)
    markdown += `${parts.join(' | ')}\n\n`
  }

  if (tags && tags.length > 0) {
    markdown += `**Tags:** ${tags.map(tag => `\`${tag}\``).join(', ')}\n\n`
  }

  // Convert HTML-like tags to markdown
  const markdownContent = content
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1\n')
    // Bold and italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*${1}*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*${1}*')
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    // Lists
    .replace(/<ul[^>]*>/g, '')
    .replace(/<\/ul>/g, '\n')
    .replace(/<ol[^>]*>/g, '')
    .replace(/<\/ol>/g, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
    // Line breaks
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<p[^>]*>/g, '')
    // Clean up extra newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  markdown += markdownContent

  return markdown
}

/**
 * Convert content to HTML format
 */
function toHTML(content: string, metadata?: ExportRequest['metadata']): string {
  const { title, author, date, tags } = metadata || {}

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Exported Content'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.6em; }
    h3 { font-size: 1.3em; }
    p { margin: 1em 0; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    .metadata {
      background: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      margin-bottom: 2em;
    }
    .metadata p { margin: 0.5em 0; }
    .tag {
      display: inline-block;
      background: #e0e0e0;
      padding: 0.2em 0.6em;
      border-radius: 3px;
      margin-right: 0.5em;
      font-size: 0.9em;
    }
    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
    }
  </style>
</head>
<body>
`

  if (title || author || date || tags) {
    html += '<div class="metadata">\n'
    if (title) html += `<h1>${title}</h1>\n`
    if (author) html += `<p><strong>Author:</strong> ${author}</p>\n`
    if (date) html += `<p><strong>Date:</strong> ${date}</p>\n`
    if (tags && tags.length > 0) {
      html += '<p><strong>Tags:</strong> '
      html += tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')
      html += '</p>\n'
    }
    html += '</div>\n\n'
  }

  html += content
  html += `\n</body>
</html>`

  return html
}

/**
 * Convert content to plain text
 */
function toText(content: string, metadata?: ExportRequest['metadata']): string {
  const { title, author, date, tags } = metadata || {}

  let text = ''

  if (title) {
    text += `${title}\n`
    text += '='.repeat(title.length) + '\n\n'
  }

  if (author) text += `Author: ${author}\n`
  if (date) text += `Date: ${date}\n`
  if (tags && tags.length > 0) text += `Tags: ${tags.join(', ')}\n`
  if (author || date || tags) text += '\n'

  // Strip HTML tags and convert to text
  const textContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines
    .trim()

  text += textContent

  return text
}

/**
 * Convert content to JSON format
 */
function toJSON(content: string, metadata?: ExportRequest['metadata']): string {
  const json = {
    content,
    metadata: {
      title: metadata?.title || null,
      author: metadata?.author || null,
      date: metadata?.date || null,
      tags: metadata?.tags || [],
      exportedAt: new Date().toISOString(),
    }
  }

  return JSON.stringify(json, null, 2)
}

export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(req, 'EXPORT')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body: ExportRequest = await req.json()

    if (!body.content || !body.format) {
      return new Response(
        JSON.stringify({ error: 'Content and format are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let exportedContent: string
    let contentType: string
    let fileExtension: string

    switch (body.format) {
      case 'html':
        exportedContent = toHTML(body.content, body.metadata)
        contentType = 'text/html'
        fileExtension = 'html'
        break
      case 'markdown':
        exportedContent = toMarkdown(body.content, body.metadata)
        contentType = 'text/markdown'
        fileExtension = 'md'
        break
      case 'text':
        exportedContent = toText(body.content, body.metadata)
        contentType = 'text/plain'
        fileExtension = 'txt'
        break
      case 'json':
        exportedContent = toJSON(body.content, body.metadata)
        contentType = 'application/json'
        fileExtension = 'json'
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid format. Must be html, markdown, text, or json' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const filename = `content-export-${Date.now()}.${fileExtension}`

    return new Response(exportedContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Export] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to export content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
