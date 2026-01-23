import { readFile } from 'node:fs/promises'
import crypto from 'node:crypto'
import * as dotenv from 'dotenv'
import { createClient } from 'next-sanity'

type PortableTextSpan = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

type PortableTextBlock = {
  _type: 'block'
  _key: string
  style: 'normal' | 'h1' | 'h2' | 'h3' | 'h4'
  children: PortableTextSpan[]
  markDefs: []
  listItem?: 'bullet' | 'number'
  level?: number
}

function key(): string {
  return crypto.randomUUID()
}

function stripMd(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim()
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toBlock(params: {
  text: string
  style?: PortableTextBlock['style']
  listItem?: PortableTextBlock['listItem']
  level?: number
}): PortableTextBlock {
  const text = stripMd(params.text)
  return {
    _type: 'block',
    _key: key(),
    style: params.style ?? 'normal',
    markDefs: [],
    ...(params.listItem ? { listItem: params.listItem, level: params.level ?? 1 } : {}),
    children: [
      {
        _type: 'span',
        _key: key(),
        text,
        marks: [],
      },
    ],
  }
}

function mdToPortableText(md: string): PortableTextBlock[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: PortableTextBlock[] = []

  let inCodeBlock = false
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trimEnd() ?? ''
    const trimmed = line.trim()

    // Skip code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    // Skip table separators
    if (trimmed.match(/^\|[\s:-]+\|/)) {
      inTable = true
      continue
    }

    // Handle table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true
      const cells = trimmed.split('|').filter(c => c.trim())
      blocks.push(toBlock({ text: cells.join(' | '), style: 'normal' }))
      continue
    } else if (inTable && !trimmed.startsWith('|')) {
      inTable = false
    }

    if (!trimmed) continue

    if (trimmed.startsWith('# ')) {
      blocks.push(toBlock({ text: trimmed.replace(/^#\s+/, ''), style: 'h1' }))
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(toBlock({ text: trimmed.replace(/^##\s+/, ''), style: 'h2' }))
      continue
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(toBlock({ text: trimmed.replace(/^###\s+/, ''), style: 'h3' }))
      continue
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push(toBlock({ text: trimmed.replace(/^####\s+/, ''), style: 'h4' }))
      continue
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push(toBlock({ text: trimmed.replace(/^[-*]\s+/, ''), listItem: 'bullet', level: 1 }))
      continue
    }

    if (trimmed.match(/^\d+\.\s/)) {
      blocks.push(toBlock({ text: trimmed.replace(/^\d+\.\s+/, ''), listItem: 'number', level: 1 }))
      continue
    }

    // Skip metadata lines
    if (trimmed.startsWith('**') && trimmed.includes(':')) continue
    if (trimmed === '---') continue

    blocks.push(toBlock({ text: trimmed, style: 'normal' }))
  }

  return blocks
}

function extractMetadata(md: string): {
  publishedAt: string
  category: string
  dataSource?: string
} {
  const lines = md.split('\n')

  let publishedAt = new Date().toISOString()
  let category = 'whitepaper'
  let dataSource: string | undefined

  for (const line of lines) {
    if (line.includes('**Published:**')) {
      const dateMatch = line.match(/\*\*Published:\*\*\s+(.+)/)
      if (dateMatch) {
        publishedAt = new Date(dateMatch[1]).toISOString()
      }
    }
    if (line.includes('**Data Source:**')) {
      const sourceMatch = line.match(/\*\*Data Source:\*\*\s+(.+)/)
      if (sourceMatch) {
        dataSource = sourceMatch[1]
      }
    }
  }

  return { publishedAt, category, dataSource }
}

async function main() {
  dotenv.config({ path: '.env.local' })

  const sourceIndex = process.argv.indexOf('--source')
  const sourcePath =
    sourceIndex !== -1 && process.argv[sourceIndex + 1]
      ? process.argv[sourceIndex + 1]
      : 'docs/plans/2026-01-23-ai-marketing-keywords-research.md'

  const categoryIndex = process.argv.indexOf('--category')
  const categoryArg = categoryIndex !== -1 && process.argv[categoryIndex + 1]
    ? process.argv[categoryIndex + 1]
    : 'whitepaper'

  const writeToken = process.env.SANITY_WRITE_TOKEN
  if (!writeToken) {
    throw new Error('Missing env var: SANITY_WRITE_TOKEN')
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-01-02'

  if (!projectId || !dataset) {
    throw new Error('Missing Sanity env vars: NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET')
  }

  console.log(`📖 Reading resource from ${sourcePath}...`)
  const md = await readFile(sourcePath, 'utf8')

  const titleLine = md.split(/\r?\n/).find((l) => l.trim().startsWith('# '))?.trim()
  const title = titleLine ? stripMd(titleLine.replace(/^#\s+/, '')) : 'AI Marketing Keywords Research'

  const metadata = extractMetadata(md)

  // Extract excerpt from Executive Summary
  const summaryMatch = md.match(/## Executive Summary\s+([\s\S]+?)(?=\n##|\n---)/i)
  const excerpt = summaryMatch
    ? stripMd(summaryMatch[1].trim().split('\n')[0]).slice(0, 220)
    : '50 untapped long-tail keywords in AI marketing tools with real search data and opportunity scores.'

  const body = mdToPortableText(md)
  const slug = slugify(title)

  // Optional: Link to JSON data file
  const downloadUrl = metadata.dataSource
    ? '/documents/ai-marketing-keywords-research-2026.json'
    : undefined

  console.log(`📝 Resource details:`)
  console.log(`   Title: ${title}`)
  console.log(`   Slug: ${slug}`)
  console.log(`   Category: ${categoryArg}`)
  console.log(`   Data Source: ${metadata.dataSource || 'N/A'}`)
  console.log(`   Blocks: ${body.length}`)

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: writeToken,
  })

  const doc = {
    _type: 'resource',
    _id: `resource-${slug}`,
    title,
    slug: {
      _type: 'slug',
      current: slug,
    },
    publishedAt: metadata.publishedAt,
    category: categoryArg,
    excerpt,
    downloadUrl,
    body,
  }

  console.log(`\n🚀 Publishing to Sanity (${projectId}/${dataset})...`)

  const result = await client.createOrReplace(doc)

  console.log(`✅ Published successfully!`)
  console.log(`   Document ID: ${result._id}`)
  console.log(`   View in Studio: https://flowintent.sanity.studio/structure/resource;${result._id}`)
  if (downloadUrl) {
    console.log(`   Download URL: ${downloadUrl}`)
  }
  console.log(`\n🎉 Resource is live!`)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
