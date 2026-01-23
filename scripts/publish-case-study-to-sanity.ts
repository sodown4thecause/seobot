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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trimEnd() ?? ''
    const trimmed = line.trim()
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

    if (trimmed.startsWith('- ')) {
      blocks.push(toBlock({ text: trimmed.replace(/^-+\s+/, ''), listItem: 'bullet', level: 1 }))
      continue
    }

    blocks.push(toBlock({ text: trimmed, style: 'normal' }))
  }

  return blocks
}

async function main() {
  dotenv.config({ path: '.env.sanity' })

  const sourceIndex = process.argv.indexOf('--source')
  const sourcePath =
    sourceIndex !== -1 && process.argv[sourceIndex + 1]
      ? process.argv[sourceIndex + 1]
      : 'documents/Client_Zero_Case_Study_Full.md'

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

  const md = await readFile(sourcePath, 'utf8')
  const titleLine = md.split(/\r?\n/).find((l) => l.trim().startsWith('# '))?.trim()
  const title = titleLine ? stripMd(titleLine.replace(/^#\s+/, '')) : 'Client Zero: Live AEO Experiment (Day 0)'

  const paragraphs = md
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith('#'))

  const excerpt = stripMd(paragraphs.slice(0, 2).join(' ').slice(0, 220))
  const body = mdToPortableText(md)

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: writeToken,
  })

  const slug = slugify(title)
  const docId = `caseStudy.${slug}`

  const doc = {
    _id: docId,
    _type: 'caseStudy',
    title,
    slug: { _type: 'slug', current: slug },
    publishedAt: new Date().toISOString(),
    client: 'Client Zero (internal)',
    industry: 'saas',
    excerpt,
    results: [],
    body,
  }

  const created = await client.createOrReplace(doc)
  const verified = await client.fetch<{ _id: string; slug?: { current?: string } }>(
    '*[_id == $id][0]{_id, slug}',
    { id: created._id }
  )

  // Keep output minimal (no secrets).
  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        id: verified?._id ?? created._id,
        slug: verified?.slug?.current ?? slug,
      },
      null,
      2
    ) + '\n'
  )
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err) + '\n')
  process.exit(1)
})

