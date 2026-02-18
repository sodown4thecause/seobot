import type { ParseMethod } from '@/lib/diagnostic-types'
import { AIRecommendationType } from '@/lib/validate'
import type { LlmStructuredResponse } from '@/lib/validate'

export interface ParsedRecommendation {
  name: string
  type: AIRecommendationType
  reasoning: string
  position: number | null
  cited: boolean
}

export interface ParsedAnalysis {
  intentDetected: string | null
  confidenceScore: number | null
  keyFactors: string[]
  marketContext: string | null
}

export interface ParsedLlmResponse {
  structured: LlmStructuredResponse
  parseMethod: ParseMethod
  parseError?: string
}

export interface ParseLlmResponseParams {
  rawResponse: string
  targetDomain: string
  targetBrandName: string
}

export function parseLlmResponseWithFallback(params: ParseLlmResponseParams): ParsedLlmResponse {
  const { rawResponse, targetDomain, targetBrandName } = params

  if (!rawResponse || rawResponse.trim().length === 0) {
    return {
      structured: getEmptyStructured(),
      parseMethod: 'failed',
      parseError: 'Empty response from LLM',
    }
  }

const jsonResult = tryJsonParse(rawResponse)
  if (jsonResult.success) {
    return {
      structured: normalizeStructuredResponse(jsonResult.data, targetDomain, targetBrandName, rawResponse),
      parseMethod: 'json',
    }
  }

  const heuristicResult = tryHeuristicParse(rawResponse, targetDomain, targetBrandName)
  if (heuristicResult.recommended_brands.length > 0) {
    return {
      structured: heuristicResult,
      parseMethod: 'heuristic',
      parseError: jsonResult.error,
    }
  }

  return {
    structured: getEmptyStructured(),
    parseMethod: 'failed',
    parseError: `Failed to parse response. JSON error: ${jsonResult.error}`,
  }
}

function getEmptyStructured(): LlmStructuredResponse {
  return {
    recommended_brands: [],
    direct_links_included: [],
  }
}

function tryJsonParse(rawResponse: string): { success: true; data: unknown } | { success: false; error: string } {
  try {
    let cleanedResponse = rawResponse.trim()
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const firstBrace = cleanedResponse.indexOf('{')
    const lastBrace = cleanedResponse.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedResponse = cleanedResponse.slice(firstBrace, lastBrace + 1)
    }

    const parsed = JSON.parse(cleanedResponse)
    return { success: true, data: parsed }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown JSON parse error',
    }
  }
}

function normalizeStructuredResponse(
  data: unknown,
  targetDomain: string,
  targetBrandName: string,
  rawResponse?: string
): LlmStructuredResponse {
  const typed = data as Record<string, unknown>

  const rawRecommendations = Array.isArray(typed.recommendations) ? typed.recommendations : []
  const recommended_brands = rawRecommendations.map((rec, index) => {
    const r = rec as Record<string, unknown>
    return {
      name: String(r.name || 'Unknown'),
      recommendation_type: normalizeRecommendationType(r.type),
      position: typeof r.position === 'number' ? r.position : index + 1,
    }
  })

  const directLinksField = typed.direct_links ?? typed.directLinks ?? typed.links
  let direct_links_included: { url: string }[] = []

  if (Array.isArray(directLinksField)) {
    direct_links_included = directLinksField
      .map((link) => {
        if (typeof link === 'string') {
          return { url: link }
        }
        if (typeof link === 'object' && link && 'url' in link) {
          return { url: String((link as Record<string, unknown>).url) }
        }
        return null
      })
      .filter((link): link is { url: string } => link !== null && link.url.length > 0)
  } else if (rawResponse) {
    const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi
    const matches = rawResponse.match(urlRegex) ?? []
    const uniqueUrls = [...new Set(matches.map((url) => url.trim()).filter((url) => url.length > 0))]
    direct_links_included = uniqueUrls.map((url) => ({ url }))
  }

  return { recommended_brands, direct_links_included }
}

function normalizeRecommendationType(type: unknown): AIRecommendationType {
  const validTypes: AIRecommendationType[] = ['primary', 'secondary', 'listed', 'mention_only']
  if (typeof type === 'string' && validTypes.includes(type as AIRecommendationType)) {
    return type as AIRecommendationType
  }
  return 'listed'
}

function tryHeuristicParse(
  rawResponse: string,
  targetDomain: string,
  targetBrandName: string
): LlmStructuredResponse {
  const recommended_brands: { name: string; recommendation_type: AIRecommendationType; position: number | null }[] = []

  const brandPatterns = [
    /(?:^|\n)[\d]+[.)\s]+([A-Z][A-Za-z0-9\s]+?)(?::|[-–—]|\n)/gm,
    /(?:^|\n)[•\-*]\s*([A-Z][A-Za-z0-9\s]+?)(?::|[-–—]|\n)/gm,
    /"([^"]+)"\s*(?:is|are|recommended|suggests?)/gi,
    /([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)\s+(?:is|are|offers?|provides?)/g,
  ]

  const extractedNames = new Set<string>()

  for (const pattern of brandPatterns) {
    let match
    while ((match = pattern.exec(rawResponse)) !== null) {
      const name = match[1]?.trim()
      if (name && name.length > 2 && name.length < 50 && !extractedNames.has(name.toLowerCase())) {
        extractedNames.add(name.toLowerCase())

        const isTarget = isTargetBrand(name, targetDomain, targetBrandName)

        recommended_brands.push({
          name,
          recommendation_type: isTarget ? 'listed' : 'secondary',
          position: recommended_brands.length + 1,
        })
      }
    }
  }

  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi
  const urlMatches = rawResponse.match(urlRegex) ?? []
  const uniqueUrls = [...new Set(urlMatches.map((url) => url.trim()).filter((url) => url.length > 0))]
  const direct_links_included = uniqueUrls.map((url) => ({ url }))

  return {
    recommended_brands,
    direct_links_included,
  }
}

function isTargetBrand(name: string, targetDomain: string, targetBrandName: string): boolean {
  const normalizedName = name.toLowerCase()
  const normalizedDomain = targetDomain.toLowerCase().replace(/^www\./, '')
  const normalizedBrandName = targetBrandName.toLowerCase()

  const domainLabel = normalizedDomain.split('.')[0]

  if (normalizedName.length < 4) {
    const nameTokens = normalizedName.match(/\b\w+\b/g) || [normalizedName]
    const domainTokens = normalizedDomain.split('.').map((t) => t.toLowerCase())
    const brandTokens = normalizedBrandName.split(/\s+/).map((t) => t.toLowerCase())

    return (
      nameTokens.some((token) => domainTokens.includes(token) || brandTokens.includes(token)) ||
      domainTokens.includes(normalizedName) ||
      brandTokens.includes(normalizedName)
    )
  }

  return (
    normalizedName.includes(domainLabel) ||
    normalizedName.includes(normalizedBrandName) ||
    normalizedDomain.includes(normalizedName) ||
    normalizedBrandName.includes(normalizedName)
  )
}