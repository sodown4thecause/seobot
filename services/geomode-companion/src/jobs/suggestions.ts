import { generateObject } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import type { CompanionConfig } from '../config.js'
import {
  dailyDigestDocumentSchema,
  geoSuggestionsSchema,
  type DailyDigestDocument,
  type GeoSuggestions,
} from '../contracts/digest.js'

function resolveModel(config: CompanionConfig) {
  if (config.AI_GATEWAY_API_KEY) {
    const gateway = createGateway({ apiKey: config.AI_GATEWAY_API_KEY })
    return gateway(config.SUGGESTIONS_MODEL)
  }

  throw new Error('AI_GATEWAY_API_KEY is required for suggestion generation')
}

const suggestionGenerationSchema = geoSuggestionsSchema.omit({ generatedAt: true, model: true })

export async function generateGeoSuggestions(
  config: CompanionConfig,
  digest: DailyDigestDocument,
): Promise<GeoSuggestions> {
  const model = resolveModel(config)

  const runOnce = async () => generateObject({
    model,
    schema: suggestionGenerationSchema,
    prompt: `You are a GEO/AEO strategist. Using ONLY the digest evidence below, produce at most 5 prioritized actions and long-term citation links to pursue. Avoid generic SEO advice.

Digest JSON:
${JSON.stringify(digest, null, 2)}`,
  })

  try {
    const result = await runOnce()
    return geoSuggestionsSchema.parse({
      generatedAt: new Date().toISOString(),
      model: config.SUGGESTIONS_MODEL,
      ...result.object,
    })
  } catch {
    const retry = await runOnce()
    return geoSuggestionsSchema.parse({
      generatedAt: new Date().toISOString(),
      model: config.SUGGESTIONS_MODEL,
      ...retry.object,
    })
  }
}

export function validateDigestDocument(value: unknown): DailyDigestDocument {
  return dailyDigestDocumentSchema.parse(value)
}
