import type { GeoEngine } from './types'

export const DEFAULT_GEO_ENGINES: GeoEngine[] = ['chatgpt', 'perplexity', 'google_ai_overview']

export function splitEnvList(value?: string): string[] {
  return (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export function parseGeoEngines(value?: string | string[] | null): GeoEngine[] {
  const raw = Array.isArray(value) ? value : splitEnvList(value || undefined)
  const allowed = new Set<GeoEngine>(['google_ai_overview', 'chatgpt', 'perplexity', 'gemini', 'claude'])
  const engines = raw.filter((engine): engine is GeoEngine => allowed.has(engine as GeoEngine))
  return engines.length > 0 ? engines : DEFAULT_GEO_ENGINES
}

export function extractDomains(urls: string[]): string[] {
  const domains = new Set<string>()
  for (const url of urls) {
    try {
      domains.add(new URL(url).hostname.replace(/^www\./, ''))
    } catch {
      // Ignore malformed provider source strings.
    }
  }
  return Array.from(domains)
}

export function extractUrls(value: unknown): string[] {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  const matches = text.match(/https?:\/\/[^\s"'<>),]+/g) || []
  return Array.from(new Set(matches.map(url => url.replace(/[.,;]+$/, ''))))
}

export function countMentions(text: string, term: string): number {
  if (!term.trim()) return 0
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return (text.match(new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'giu')) || []).length
}
