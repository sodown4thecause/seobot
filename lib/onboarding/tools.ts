/**
 * Onboarding AI Tools
 * 
 * AI SDK tools for the onboarding flow that extract brand voice
 * and store user profile information in Neon pgvector.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { extractAndStoreBrandVoice } from './brand-voice-extractor'
import { upsertBusinessProfile, getUserBusinessContext } from './user-context-service'
import { getUserId } from '@/lib/auth/clerk'

// Schema definitions
const extractBrandVoiceSchema = z.object({
    websiteUrl: z.string().url().describe("The user's website URL to analyze"),
})

const saveBusinessProfileSchema = z.object({
    websiteUrl: z.string().url().optional().describe("The user's website URL"),
    industry: z.string().optional().describe("The business industry or niche"),
    location: z.object({
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
    }).optional().describe("Target audience location"),
    goals: z.array(z.string()).optional().describe("Business goals like 'Generate leads', 'Increase traffic'"),
    contentFrequency: z.string().optional().describe("How often they create content: Daily, Weekly, Monthly"),
})

/**
 * Extract Brand Voice Tool
 * 
 * Called during onboarding after user provides their website URL.
 * Scrapes the website using Firecrawl and extracts brand voice characteristics.
 */
export const extractBrandVoiceTool = tool({
    description: `Extract the user's brand voice from their website. Use this during onboarding step 2 after they provide their website URL. This tool will:
1. Scrape their website using Firecrawl
2. Analyze the content to extract tone, style, and personality
3. Store the brand voice in the database with embeddings for RAG

Call this immediately after the user provides their website URL.`,
    inputSchema: extractBrandVoiceSchema,
    execute: async (params: z.infer<typeof extractBrandVoiceSchema>) => {
        try {
            const userId = await getUserId()
            if (!userId) {
                return {
                    success: false,
                    error: 'User not authenticated. Please log in to continue onboarding.',
                }
            }

            console.log('[Onboarding Tools] Extracting brand voice for:', params.websiteUrl)

            // First, save the website URL to the business profile
            await upsertBusinessProfile(userId, { websiteUrl: params.websiteUrl })

            // Then extract and store brand voice
            const result = await extractAndStoreBrandVoice(userId, params.websiteUrl)

            if (result.success && result.brandVoice) {
                return {
                    success: true,
                    message: `I've analyzed your website and extracted your brand voice!`,
                    brandVoice: {
                        tone: result.brandVoice.tone,
                        style: result.brandVoice.style,
                        personality: result.brandVoice.personality,
                        targetAudience: result.brandVoice.targetAudience,
                        industry: result.brandVoice.industryContext,
                    },
                }
            }

            return {
                success: false,
                error: result.error || 'Failed to extract brand voice from website',
            }
        } catch (error) {
            console.error('[Onboarding Tools] Extract brand voice error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            }
        }
    },
})

/**
 * Save Business Profile Tool
 * 
 * Saves business profile information during onboarding.
 */
export const saveBusinessProfileTool = tool({
    description: `Save the user's business profile information during onboarding. Use this to store:
- Website URL
- Industry
- Target location (country, region, city)
- Business goals
- Content frequency

Call this immediately after the user provides each piece of information.`,
    inputSchema: saveBusinessProfileSchema,
    execute: async (params: z.infer<typeof saveBusinessProfileSchema>) => {
        try {
            const userId = await getUserId()
            if (!userId) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                }
            }

            const result = await upsertBusinessProfile(userId, params)

            if (result.success) {
                const savedFields = Object.keys(params).filter(k => params[k as keyof typeof params] !== undefined)
                return {
                    success: true,
                    message: `Saved: ${savedFields.join(', ')}`,
                    savedFields,
                }
            }

            return {
                success: false,
                error: result.error || 'Failed to save profile',
            }
        } catch (error) {
            console.error('[Onboarding Tools] Save profile error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            }
        }
    },
})

/**
 * Get Profile Status Tool
 * 
 * Check what profile information is already saved and what's missing.
 */
export const getProfileStatusTool = tool({
    description: `Check the user's current profile status to see what information has been collected and what's still needed for onboarding.`,
    inputSchema: z.object({}),
    execute: async () => {
        try {
            const userId = await getUserId()
            if (!userId) {
                return {
                    hasProfile: false,
                    isOnboarded: false,
                    missingFields: ['authentication'],
                    error: 'User not authenticated.',
                }
            }

            const context = await getUserBusinessContext(userId)

            const missingFields: string[] = []
            if (!context.profile?.websiteUrl) missingFields.push('website_url')
            if (!context.profile?.industry) missingFields.push('industry')
            if (!context.profile?.goals?.length) missingFields.push('goals')
            if (!context.brandVoice?.tone) missingFields.push('brand_voice')

            return {
                hasProfile: context.hasProfile,
                isOnboarded: context.isOnboarded,
                profile: context.profile,
                brandVoice: context.brandVoice ? {
                    tone: context.brandVoice.tone,
                    style: context.brandVoice.style,
                } : null,
                missingFields,
                completionPercentage: Math.round(((4 - missingFields.length) / 4) * 100),
            }
        } catch (error) {
            console.error('[Onboarding Tools] Get profile status error:', error)
            return {
                hasProfile: false,
                isOnboarded: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            }
        }
    },
})

/**
 * Export all onboarding tools as a record for agent integration
 */
export const onboardingTools = {
    extract_brand_voice: extractBrandVoiceTool,
    save_business_profile: saveBusinessProfileTool,
    get_profile_status: getProfileStatusTool,
}
