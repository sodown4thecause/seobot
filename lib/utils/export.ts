/**
 * Content Export Utility
 *
 * Client-side utility for exporting content in various formats
 */

export type ExportFormat = 'html' | 'markdown' | 'text' | 'json'

interface ExportOptions {
  content: string
  format: ExportFormat
  metadata?: {
    title?: string
    author?: string
    date?: string
    tags?: string[]
  }
}

/**
 * Export content to specified format
 */
export async function exportContent({
  content,
  format,
  metadata,
}: ExportOptions): Promise<void> {
  try {
    const response = await fetch('/api/content/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        format,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    // Get the filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `content-export.${format}`

    // Get the blob
    const blob = await response.blob()

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Clean up
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    throw new Error('Failed to export content. Please try again.')
  }
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content)
  } catch (error) {
    console.error('Copy failed:', error)
    throw new Error('Failed to copy to clipboard')
  }
}

/**
 * Export content as downloadable HTML file
 */
export async function exportAsHTML(content: string, title?: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Content'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4 { margin-top: 1.5em; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
${content}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(title || 'content').replace(/\s+/g, '-').toLowerCase()}.html`
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Export content as Markdown file
 */
export async function exportAsMarkdown(content: string, title?: string): Promise<void> {
  let markdown = content
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*${1}*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*${1}*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<p[^>]*>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(title || 'content').replace(/\s+/g, '-').toLowerCase()}.md`
  link.click()
  window.URL.revokeObjectURL(url)
}
