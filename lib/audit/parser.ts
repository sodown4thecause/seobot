import type { BrandDetectionPayload, PlatformResult } from '@/lib/audit/types'

interface ParsePlatformResponseInput {
  platform: PlatformResult['platform']
  prompt: string
  rawResponse: string
  citationUrls?: string[]
  domain: string
  context: BrandDetectionPayload
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeDomain(domain: string): string {
  const cleaned = domain.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  return cleaned.split('/')[0].toLowerCase()
}

function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) || []
  return Array.from(new Set(matches.map((url) => url.replace(/[),.;]+$/, ''))))
}

function extractBrandContext(rawResponse: string, brand: string): string | null {
  const brandRegex = new RegExp(`([^.!?]*\\b${escapeRegex(brand)}\\b[^.!?]*[.!?]?)`, 'i')
  const match = rawResponse.match(brandRegex)
  return match?.[1]?.trim() || null
}

function extractRecommendationLines(rawResponse: string): string[] {
  const lines = rawResponse
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const ranked = lines.filter((line) => /^([0-9]+[.)]|[-*])\s+/i.test(line))
  return ranked.length > 0 ? ranked : lines.slice(0, 8)
}

function detectPosition(rawResponse: string, brand: string): number | null {
  const lines = extractRecommendationLines(rawResponse)
  const brandRegex = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i')

  for (let index = 0; index < lines.length; index += 1) {
    if (brandRegex.test(lines[index])) {
      return index + 1
    }
  }

  if (brandRegex.test(rawResponse)) {
    return 1
  }

  return null
}

function detectMentions(rawResponse: string, candidates: string[]): string[] {
  const found = candidates.filter((candidate) => {
    const candidateRegex = new RegExp(`\\b${escapeRegex(candidate)}\\b`, 'i')
    return candidateRegex.test(rawResponse)
  })

  return Array.from(new Set(found))
}

export function parsePlatformResponse(input: ParsePlatformResponseInput): PlatformResult {
  const normalizedDomain = normalizeDomain(input.domain)
  const citationUrls = Array.from(
    new Set([...(input.citationUrls || []), ...extractUrlsFromText(input.rawResponse)])
  )

  const citationDomains = citationUrls.map((url) => {
    try {
      return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
    } catch {
      return ''
    }
  })

  const competitorDomainsCited = Array.from(
    new Set(
      citationDomains.filter((domain) =>
        input.context.competitors.some((competitor) =>
          domain.includes(competitor.toLowerCase().replace(/\s+/g, ''))
        )
      )
    )
  )

  const brandPosition = detectPosition(input.rawResponse, input.context.brand)
  const brandMentioned = brandPosition !== null

  return {
    platform: input.platform,
    prompt: input.prompt,
    brandMentioned,
    brandPosition,
    brandContext: extractBrandContext(input.rawResponse, input.context.brand),
    competitorsMentioned: detectMentions(input.rawResponse, input.context.competitors),
    citationUrls,
    userDomainCited: citationDomains.some((domain) => domain.includes(normalizedDomain)),
    competitorDomainsCited,
    rawResponse: input.rawResponse,
  }
}
