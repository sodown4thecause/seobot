import { readFile, writeFile } from 'node:fs/promises'
import * as dotenv from 'dotenv'

type SerpTopItem = {
  url: string
  title?: string
  domain?: string
  rank?: number
}

function env(name: string): string | undefined {
  return process.env[name] || undefined
}

function safeMd(text: string): string {
  return text.replace(/\r\n/g, '\n').trim()
}

function cleanForExcerpt(input: string): string {
  const text = input
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  return Array.from(text)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code === 9 || code === 10 || code === 13 || code >= 32
    })
    .join('')
}

async function dataForSeoPost<T>(path: string, body: unknown): Promise<T> {
  const user = env('DATAFORSEO_USERNAME') ?? env('DATAFORSEO_LOGIN')
  const pass = env('DATAFORSEO_PASSWORD')
  if (!user || !pass) throw new Error('Missing DataForSEO creds: DATAFORSEO_USERNAME/DATAFORSEO_PASSWORD')

  const auth = Buffer.from(`${user}:${pass}`).toString('base64')
  const res = await fetch(`https://api.dataforseo.com/v3${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([body]),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DataForSEO HTTP ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

async function getSearchVolumes(keywords: string[]) {
  try {
    const json = await dataForSeoPost<any>('/keywords_data/google_ads/search_volume/live', {
      keywords,
      location_code: 2840,
      language_code: 'en',
    })
    const result = json?.tasks?.[0]?.result ?? []
    const byKeyword = new Map<string, { search_volume?: number; cpc?: number; competition?: number }>()
    for (const row of result) {
      if (!row?.keyword) continue
      byKeyword.set(String(row.keyword).toLowerCase(), {
        search_volume: row.search_volume,
        cpc: row.cpc,
        competition: row.competition,
      })
    }
    return { ok: true as const, byKeyword }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
  }
}

async function getSerpTop(keyword: string): Promise<{ ok: true; items: SerpTopItem[] } | { ok: false; error: string }> {
  try {
    const json = await dataForSeoPost<any>('/serp/google/organic/live/advanced', {
      keyword,
      location_code: 2840,
      language_code: 'en',
      device: 'desktop',
    })
    const items = json?.tasks?.[0]?.result?.[0]?.items ?? []
    const top: SerpTopItem[] = []
    let rank = 0
    for (const item of items) {
      if (item?.type !== 'organic') continue
      if (!item?.url) continue
      rank += 1
      top.push({
        rank,
        url: String(item.url).trim(),
        title: item.title ? String(item.title) : undefined,
        domain: item.domain ? String(item.domain) : undefined,
      })
      if (top.length >= 5) break
    }
    return { ok: true, items: top }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function firecrawlScrape(url: string): Promise<{ ok: true; markdown: string } | { ok: false; error: string }> {
  const apiKey = env('FIRECRAWL_API_KEY')
  if (!apiKey) return { ok: false, error: 'Missing FIRECRAWL_API_KEY' }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Firecrawl HTTP ${res.status}: ${text}` }
    }
    const json = (await res.json()) as any
    const md = json?.data?.markdown
    if (!md) return { ok: false, error: 'Firecrawl response missing markdown' }
    return { ok: true, markdown: String(md) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function jinaReader(url: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const target = url.startsWith('http') ? url : `https://${url}`
    const res = await fetch(`https://r.jina.ai/${encodeURI(target)}`, {
      headers: { Accept: 'text/plain' },
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Jina reader HTTP ${res.status}: ${text}` }
    }
    const text = await res.text()
    return { ok: true, text }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

async function perplexityCitations(prompt: string): Promise<{ ok: true; urls: string[]; model?: string } | { ok: false; error: string }> {
  const apiKey = env('PERPLEXITY_API_KEY')
  if (!apiKey) return { ok: false, error: 'Missing PERPLEXITY_API_KEY' }

  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'Return concise, source-grounded answers. Output only URLs when asked.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Perplexity HTTP ${res.status}: ${text}` }
    }

    const json = (await res.json()) as any
    const content: string = json?.choices?.[0]?.message?.content ?? ''
    const urls = Array.from(
      new Set((content.match(/https?:\/\/[^\s)]+/g) ?? []).map((u) => u.replace(/[),.]+$/, '')))
    ).slice(0, 12)
    return { ok: true, urls, model: json?.model }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function injectBetweenMarkers(params: { input: string; markerStart: string; markerEnd: string; replacement: string }): string {
  const { input, markerStart, markerEnd, replacement } = params
  const startIdx = input.indexOf(markerStart)
  const endIdx = input.indexOf(markerEnd)
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(`Missing markers: ${markerStart} / ${markerEnd}`)
  }
  const before = input.slice(0, startIdx + markerStart.length)
  const after = input.slice(endIdx)
  return `${before}\n\n${replacement.trim()}\n\n${after}`
}

async function main() {
  dotenv.config({ path: '.env.local' })
  dotenv.config({ path: '.env' })

  const sourceIndex = process.argv.indexOf('--source')
  const sourcePath =
    sourceIndex !== -1 && process.argv[sourceIndex + 1]
      ? process.argv[sourceIndex + 1]
      : 'documents/Client_Zero_Case_Study_Full.md'

  // Default to the three "money queries" for the Client Zero campaign.
  // Can be overridden by passing `--keywords` as a comma-separated list.
  const keywordsArgIndex = process.argv.indexOf('--keywords')
  const keywordsArg =
    keywordsArgIndex !== -1 && process.argv[keywordsArgIndex + 1] ? String(process.argv[keywordsArgIndex + 1]) : ''
  const keywords = keywordsArg
    ? keywordsArg
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 10)
    : ['Answer Engine Optimization software', 'AI content generator with EEAT', 'Best AI SEO Agents 2026']
  const timestamp = new Date().toISOString()

  const [vol, serp1, serp2, serp3] = await Promise.all([
    getSearchVolumes(keywords),
    getSerpTop(keywords[0]),
    getSerpTop(keywords[1]),
    getSerpTop(keywords[2]),
  ])

  const serpBlocks: Array<{ keyword: string; items: SerpTopItem[]; note?: string }> = []
  for (const s of [
    { keyword: keywords[0], result: serp1 },
    { keyword: keywords[1], result: serp2 },
    { keyword: keywords[2], result: serp3 },
  ]) {
    if (s.result.ok) serpBlocks.push({ keyword: s.keyword, items: s.result.items })
    else serpBlocks.push({ keyword: s.keyword, items: [], note: s.result.error })
  }

  const urlsToInspect = Array.from(
    new Set(serpBlocks.flatMap((b) => b.items.slice(0, 2).map((i) => i.url)).filter(Boolean))
  ).slice(0, 6)

  const inspected: Array<{ url: string; via: string; excerpt?: string; error?: string }> = []
  for (const url of urlsToInspect) {
    const fc = await firecrawlScrape(url)
    if (fc.ok) {
      inspected.push({ url, via: 'Firecrawl', excerpt: cleanForExcerpt(safeMd(fc.markdown)).slice(0, 280) })
      continue
    }
    const jr = await jinaReader(url)
    if (jr.ok) {
      inspected.push({ url, via: 'Jina reader', excerpt: cleanForExcerpt(safeMd(jr.text)).slice(0, 280), error: fc.error })
      continue
    }
    inspected.push({ url, via: 'n/a', error: `${fc.error}; ${jr.error}` })
  }

  const px = await perplexityCitations(
    `For the queries "${keywords.join('", "')}", list the URLs you most often cite as sources. Output only URLs, one per line.`
  )

  const volLines =
    vol.ok
      ? keywords
          .map((k) => {
            const row = vol.byKeyword.get(k.toLowerCase())
            if (!row) return `- \`${k}\`: volume: n/a`
            return `- \`${k}\`: volume: ${row.search_volume ?? 'n/a'}, CPC: ${row.cpc ?? 'n/a'}, competition: ${row.competition ?? 'n/a'}`
          })
          .join('\n')
      : `- Search volume lookup skipped: ${vol.error}`

  const serpMd = serpBlocks
    .map((b) => {
      if (b.items.length === 0) return `**SERP snapshot - \`${b.keyword}\`**\n- (no items) ${b.note ? `(${b.note})` : ''}`
      const lines = b.items.map((i) => `- #${i.rank} ${i.title ? `${i.title} - ` : ''}${i.domain ? `${i.domain} - ` : ''}${i.url}`)
      return `**SERP snapshot - \`${b.keyword}\`**\n${lines.join('\n')}`
    })
    .join('\n\n')

  const inspectMd = inspected.length
    ? inspected
        .map((x) => `- ${x.url}\n  - via: ${x.via}\n  - excerpt: ${x.excerpt ? `${x.excerpt}...` : '(no excerpt)'}${x.error ? `\n  - note: ${x.error}` : ''}`)
        .join('\n')
    : '- (none)'

  const pxMd = px.ok ? (px.urls.length ? px.urls.map((u) => `- ${u}`).join('\n') : '- (no URLs returned)') : `- Perplexity step skipped: ${px.error}`

  const baselineBlock = safeMd(`
### Automated baseline snapshot (generated ${timestamp})

This section is auto-generated using:
- DataForSEO (search volume + SERP snapshots)
- Firecrawl + Jina (fast page extraction)
- Perplexity (what sources get cited)

**Keyword demand (US, Google Ads data)**
${volLines}

Note: exact-match volumes for newer/long-tail phrases may return n/a in Google Ads datasets; use close variants and SERP evidence when deciding targets.

${serpMd}

**Competitor page inspection (first-pass excerpts)**
${inspectMd}

**Perplexity likely citation sources (discovery)**
${pxMd}
  `)

  const md = await readFile(sourcePath, 'utf8')
  const updated = injectBetweenMarkers({
    input: md,
    markerStart: '<!-- AUTO:BASELINE_START -->',
    markerEnd: '<!-- AUTO:BASELINE_END -->',
    replacement: baselineBlock,
  })

  await writeFile(sourcePath, updated, 'utf8')
  process.stdout.write(JSON.stringify({ ok: true, updated: sourcePath }, null, 2) + '\n')
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err) + '\n')
  process.exit(1)
})
