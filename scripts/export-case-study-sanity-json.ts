import { readFile, writeFile, mkdir } from 'node:fs/promises'
import crypto from 'node:crypto'

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

  for (const rawLine of lines) {
    const trimmed = (rawLine ?? '').trim()
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
  const sourceIndex = process.argv.indexOf('--source')
  const outIndex = process.argv.indexOf('--out')

  const sourcePath =
    sourceIndex !== -1 && process.argv[sourceIndex + 1]
      ? process.argv[sourceIndex + 1]
      : 'documents/Client_Zero_Case_Study_Full.md'

  const outPath =
    outIndex !== -1 && process.argv[outIndex + 1]
      ? process.argv[outIndex + 1]
      : 'documents/sanity/caseStudy.client-zero.json'

  const md = await readFile(sourcePath, 'utf8')
  const titleLine = md.split(/\r?\n/).find((l) => l.trim().startsWith('# '))?.trim()
  const title = titleLine ? stripMd(titleLine.replace(/^#\s+/, '')) : 'Client Zero: Live AEO Experiment (Day 0)'
  const slug = slugify(title)

  const paragraphs = md
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith('#'))

  const excerpt = stripMd(paragraphs.slice(0, 2).join(' ').slice(0, 220))
  const body = mdToPortableText(md)

  const doc = {
    _id: `caseStudy.${slug}`,
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

  await mkdir(outPath.split('/').slice(0, -1).join('/'), { recursive: true })
  await writeFile(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8')
  process.stdout.write(JSON.stringify({ ok: true, out: outPath, id: doc._id, slug }, null, 2) + '\n')
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err) + '\n')
  process.exit(1)
})

