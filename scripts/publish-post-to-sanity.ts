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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trimEnd() ?? ''
    const trimmed = line.trim()

    // Skip code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

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

    // Skip metadata lines
    if (trimmed.startsWith('**') && trimmed.includes(':')) continue
    if (trimmed === '---') continue

    blocks.push(toBlock({ text: trimmed, style: 'normal' }))
  }

  return blocks
}

function extractFrontmatter(md: string): {
  title: string
  publishedAt: string
} {
  const lines = md.split('\n')

  let title = ''
  let publishedAt = new Date().toISOString()
  let inFrontmatter = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true
        continue
      } else {
        break
      }
    }

    if (inFrontmatter) {
      if (line.startsWith('title:')) {
        title = line.replace(/^title:\s*['"]?/, '').replace(/['"]$/, '').trim()
      }
      if (line.startsWith('published:')) {
        const dateStr = line.replace(/^published:\s*/, '').trim()
        publishedAt = new Date(dateStr).toISOString()
      }
    }
  }

  // Fallback to H1 if no frontmatter title
  if (!title) {
    const titleLine = lines.find((l) => l.trim().startsWith('# '))?.trim()
    title = titleLine ? stripMd(titleLine.replace(/^#\s+/, '')) : 'Untitled Post'
  }

  return { title, publishedAt }
}

async function main() {
  dotenv.config({ path: '.env.local' })

  const sourceIndex = process.argv.indexOf('--source')
  const sourcePath = sourceIndex !== -1 && process.argv[sourceIndex + 1]
    ? process.argv[sourceIndex + 1]
    : ''

  if (!sourcePath) {
    console.error('❌ Error: --source argument required')
    console.error('Usage: npm run sanity:publish:post -- --source "content/blog/my-post.md"')
    process.exit(1)
  }

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

  console.log(`📖 Reading post from ${sourcePath}...`)
  const md = await readFile(sourcePath, 'utf8')

  const { title, publishedAt } = extractFrontmatter(md)
  const body = mdToPortableText(md)
  const slug = slugify(title)

  console.log(`📝 Post details:`)
  console.log(`   Title: ${title}`)
  console.log(`   Slug: ${slug}`)
  console.log(`   Published: ${publishedAt}`)
  console.log(`   Blocks: ${body.length}`)

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: writeToken,
  })

  const doc = {
    _type: 'post',
    _id: `post-${slug}`,
    title,
    slug: {
      _type: 'slug',
      current: slug,
    },
    publishedAt,
    body,
  }

  console.log(`\n🚀 Publishing to Sanity (${projectId}/${dataset})...`)

  const result = await client.createOrReplace(doc)

  console.log(`✅ Published successfully!`)
  console.log(`   Document ID: ${result._id}`)
  console.log(`   View in Studio: https://flowintent.sanity.studio/structure/post;${result._id}`)
  console.log(`\n🎉 Post is live!`)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
