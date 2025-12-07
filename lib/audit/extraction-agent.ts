/**
 * AEO Trust Auditor - Extraction Agent (Phase 1)
 *
 * Extracts "Ground Truth" from website content using Firecrawl + Gemini
 * Identifies what the brand says about itself
 * Uses Vercel AI Gateway for model routing and observability
 */

import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { mcpFirecrawlTools } from '@/lib/mcp/firecrawl/index'
import { EntityProfileSchema, type EntityProfile } from './schemas'

// Model ID for extraction (Gemini 2.0 Flash via Gateway)
const EXTRACTION_MODEL_ID = 'google/gemini-2.0-flash-exp' as GatewayModelId

export interface ExtractionResult {
  success: boolean
  entityProfile?: EntityProfile
  rawContent?: string
  error?: string
  scrapeBlocked?: boolean
}

/**
 * Scrape website content using Firecrawl MCP
 */
async function scrapeWebsite(url: string): Promise<{ content: string; blocked: boolean }> {
  try {
    const result = await mcpFirecrawlTools.firecrawl_scrape.execute({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 2000,
      removeBase64Images: true,
    })

    const content = typeof result === 'string' ? result : JSON.stringify(result)

    // Check if blocked or empty
    if (!content || content.length < 100) {
      return { content: '', blocked: true }
    }

    // Parse the result to get markdown content
    try {
      const parsed = JSON.parse(content)
      if (parsed.markdown) {
        return { content: parsed.markdown, blocked: false }
      }
      if (parsed.content) {
        return { content: parsed.content, blocked: false }
      }
    } catch {
      // If not JSON, use as-is
    }

    return { content, blocked: false }
  } catch (error) {
    console.error('[Extraction Agent] Scrape error:', error)
    return { content: '', blocked: true }
  }
}

/**
 * Extract entity profile from website content using Gemini
 */
async function extractEntityProfile(
  content: string,
  brandName: string,
  url: string
): Promise<EntityProfile> {
  const prompt = `Analyze this website content and extract the brand's self-declared identity.

Brand Name: ${brandName}
URL: ${url}

Website Content:
${content.slice(0, 15000)}

Extract the following information based ONLY on what the website explicitly states or clearly implies.
If information is not available, use reasonable defaults or mark as "Not specified".

Focus on:
1. What they say they do (core offering)
2. Who they serve (target audience)
3. What makes them different (unique value proposition)
4. Their pricing approach
5. Key factual claims that can be verified
6. Technical SEO signals present in the content structure`

  const { object } = await generateObject({
    model: vercelGateway.languageModel(EXTRACTION_MODEL_ID),
    prompt,
    schema: EntityProfileSchema,
    temperature: 0.3,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'aeo-extraction-agent',
      metadata: {
        brandName,
        url,
        contentLength: content.length,
      },
    },
  })

  return object
}

/**
 * Main extraction function - Phase 1 of the AEO Audit
 */
export async function runExtractionAgent(params: {
  url: string
  brandName: string
}): Promise<ExtractionResult> {
  console.log('[Extraction Agent] Starting extraction for:', params.brandName)

  try {
    // Step 1: Scrape website
    const { content, blocked } = await scrapeWebsite(params.url)

    if (blocked || !content) {
      console.warn('[Extraction Agent] Website blocked or empty')
      return {
        success: false,
        error: 'Website could not be scraped. It may be blocking bots.',
        scrapeBlocked: true,
      }
    }

    console.log('[Extraction Agent] Scraped', content.length, 'characters')

    // Step 2: Extract entity profile
    const entityProfile = await extractEntityProfile(content, params.brandName, params.url)

    console.log('[Extraction Agent] Extraction complete:', entityProfile.coreOffering)

    return {
      success: true,
      entityProfile,
      rawContent: content.slice(0, 5000), // Store first 5k for reference
    }
  } catch (error) {
    console.error('[Extraction Agent] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
    }
  }
}

