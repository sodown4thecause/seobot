/**
 * Brand Voice Extractor
 * 
 * Extracts brand voice (tone, style, personality) from a website using Firecrawl
 * and stores it in Neon pgvector for RAG retrieval.
 */

import { db } from '@/lib/db'
import { brandVoices, businessProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

// Brand voice schema for structured extraction
const BrandVoiceSchema = z.object({
    tone: z.string().describe('Primary communication tone: professional, casual, friendly, authoritative, playful, etc.'),
    style: z.string().describe('Writing style: conversational, formal, technical, storytelling, educational, etc.'),
    personality: z.array(z.string()).describe('Brand personality traits: innovative, trustworthy, bold, caring, etc.'),
    samplePhrases: z.array(z.string()).describe('Example phrases that capture the brand voice'),
    targetAudience: z.string().describe('Who the brand appears to be targeting'),
    industryContext: z.string().describe('Industry or niche the brand operates in'),
    uniqueVoiceElements: z.array(z.string()).describe('Unique elements that make this brand voice distinctive'),
})

export type ExtractedBrandVoice = z.infer<typeof BrandVoiceSchema>

/**
 * Stored brand voice type - represents what's actually persisted in the database
 * (targetAudience, industryContext, uniqueVoiceElements are not stored)
 */
export type StoredBrandVoice = Pick<ExtractedBrandVoice, 'tone' | 'style' | 'personality' | 'samplePhrases'>

export interface BrandVoiceExtractionResult {
    success: boolean
    brandVoice?: ExtractedBrandVoice
    error?: string
    scrapedContent?: string
}

/**
 * Scrape website using Firecrawl MCP
 */
async function scrapeWebsite(url: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
        // Dynamically import Firecrawl MCP client
        const { getMcpClient } = await import('@/lib/mcp/firecrawl/client')
        const client = await getMcpClient()

        // Use Firecrawl's scrape functionality via MCP
        const result = await client.callTool({
            name: 'firecrawl_scrape',
            arguments: {
                url,
                formats: ['markdown'],
                onlyMainContent: true,
            },
        })

        if (result && typeof result === 'object' && 'content' in result) {
            // Handle array of content items
            const contentArray = result.content as Array<{ type: string; text?: string }>
            const textContent = contentArray
                .filter((item) => item.type === 'text' && item.text)
                .map((item) => item.text)
                .join('\n')

            return { success: true, content: textContent }
        }

        return { success: false, error: 'No content extracted from website' }
    } catch (error) {
        console.error('[Brand Voice Extractor] Firecrawl error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to scrape website'
        }
    }
}

/**
 * Extract brand voice from website content using AI
 */
async function analyzeBrandVoice(
    content: string,
    websiteUrl: string
): Promise<ExtractedBrandVoice> {
    const { object: brandVoice } = await generateObject({
        model: google('gemini-2.0-flash'),
        schema: BrandVoiceSchema,
        prompt: `Analyze this website content and extract the brand voice characteristics.

Website: ${websiteUrl}

Content:
${content.substring(0, 15000)}

Based on this content, identify:
1. The primary communication TONE (e.g., professional, casual, friendly, authoritative)
2. The writing STYLE (e.g., conversational, formal, technical, educational)
3. Key PERSONALITY traits that come through in the content
4. SAMPLE PHRASES that exemplify the brand voice
5. Who the TARGET AUDIENCE appears to be
6. The INDUSTRY CONTEXT
7. Any UNIQUE VOICE ELEMENTS that make this brand distinctive

Focus on how the brand communicates, not just what it says.`,
    })

    return brandVoice
}

/**
 * Generate embedding for brand voice
 */
async function generateBrandVoiceEmbedding(brandVoice: ExtractedBrandVoice): Promise<number[]> {
    // Create a text representation of the brand voice for embedding
    const voiceText = `
    Tone: ${brandVoice.tone}
    Style: ${brandVoice.style}
    Personality: ${brandVoice.personality.join(', ')}
    Target Audience: ${brandVoice.targetAudience}
    Industry: ${brandVoice.industryContext}
    Sample Phrases: ${brandVoice.samplePhrases.join(' | ')}
    Unique Elements: ${brandVoice.uniqueVoiceElements.join(', ')}
  `.trim()

    // Use OpenAI embeddings (text-embedding-3-small)
    const { embed } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: voiceText,
    })

    return embedding
}

/**
 * Extract and store brand voice from a website
 * 
 * This is the main function called during onboarding.
 * It scrapes the website, analyzes brand voice, generates embeddings,
 * and stores everything in Neon pgvector.
 */
export async function extractAndStoreBrandVoice(
    userId: string,
    websiteUrl: string
): Promise<BrandVoiceExtractionResult> {
    console.log('[Brand Voice Extractor] Starting extraction for:', websiteUrl)

    try {
        // Step 1: Scrape website
        const scrapeResult = await scrapeWebsite(websiteUrl)
        if (!scrapeResult.success || !scrapeResult.content) {
            console.warn('[Brand Voice Extractor] Scrape failed, using fallback method')
            // Fallback: Try to get basic info from URL structure
            return {
                success: false,
                error: scrapeResult.error || 'Failed to scrape website content',
            }
        }

        console.log('[Brand Voice Extractor] Scraped content length:', scrapeResult.content.length)

        // Step 2: Analyze brand voice with AI
        const brandVoice = await analyzeBrandVoice(scrapeResult.content, websiteUrl)
        console.log('[Brand Voice Extractor] Extracted brand voice:', {
            tone: brandVoice.tone,
            style: brandVoice.style,
            personality: brandVoice.personality,
        })

        // Step 3: Generate embedding
        const embedding = await generateBrandVoiceEmbedding(brandVoice)
        console.log('[Brand Voice Extractor] Generated embedding of length:', embedding.length)

        // Step 4: Store in database
        const embeddingStr = `[${embedding.join(',')}]`

        // Check if brand voice already exists for this user
        const existing = await db
            .select()
            .from(brandVoices)
            .where(eq(brandVoices.userId, userId))
            .limit(1)

        if (existing.length > 0) {
            // Update existing brand voice using Drizzle ORM
            const { sql } = await import('drizzle-orm')
            await db
                .update(brandVoices)
                .set({
                    tone: brandVoice.tone,
                    style: brandVoice.style,
                    personality: brandVoice.personality, // Drizzle handles jsonb casting
                    samplePhrases: brandVoice.samplePhrases, // Drizzle handles array binding
                    embedding: sql`${embeddingStr}::vector`, // Proper vector casting
                    source: 'firecrawl',
                })
                .where(eq(brandVoices.userId, userId))
            console.log('[Brand Voice Extractor] Updated existing brand voice')
        } else {
            // Insert new brand voice using Drizzle ORM
            const { sql } = await import('drizzle-orm')
            await db
                .insert(brandVoices)
                .values({
                    userId: userId,
                    tone: brandVoice.tone,
                    style: brandVoice.style,
                    personality: brandVoice.personality, // Drizzle handles jsonb casting
                    samplePhrases: brandVoice.samplePhrases, // Drizzle handles array binding
                    embedding: sql`${embeddingStr}::vector`, // Proper vector casting
                    source: 'firecrawl',
                })
            console.log('[Brand Voice Extractor] Inserted new brand voice')
        }

        // Also update business profile with industry context
        await db
            .update(businessProfiles)
            .set({
                industry: brandVoice.industryContext,
                updatedAt: new Date(),
            })
            .where(eq(businessProfiles.userId, userId))

        return {
            success: true,
            brandVoice,
            scrapedContent: scrapeResult.content.substring(0, 500) + '...',
        }
    } catch (error) {
        console.error('[Brand Voice Extractor] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during brand voice extraction',
        }
    }
}

/**
 * Get brand voice for a user (for use in content generation)
 * Returns only the fields that are stored in the database
 */
export async function getUserBrandVoice(userId: string): Promise<StoredBrandVoice | null> {
    try {
        const [result] = await db
            .select()
            .from(brandVoices)
            .where(eq(brandVoices.userId, userId))
            .limit(1)

        if (!result) return null

        return {
            tone: result.tone,
            style: result.style,
            personality: (result.personality as string[]) || [],
            samplePhrases: result.samplePhrases || [],
        }
    } catch (error) {
        console.error('[Brand Voice Extractor] Error fetching brand voice:', error)
        return null
    }
}
