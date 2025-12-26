/**
 * Business Profile Tools - Drizzle ORM Implementation
 * 
 * AI SDK tools for managing user business profiles during onboarding
 * and throughout the application lifecycle.
 */

import { tool } from 'ai'
import { z } from 'zod'
import {
    getBusinessProfile,
    upsertBusinessProfile,
    getBrandVoice,
    upsertBrandVoice
} from '@/lib/db/queries'
import { getCurrentUser } from '@/lib/auth/clerk'

/**
 * Business Profile Schema
 */
const businessProfileSchema = z.object({
    website_url: z.string().url().optional().describe("The user's business website URL"),
    industry: z.string().optional().describe("The business industry or niche"),
    location: z.object({
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
    }).optional().describe("Primary customer/business location"),
    goals: z.array(z.string()).optional().describe("Business goals like 'Generate Leads', 'Increase Traffic', etc."),
    content_frequency: z.string().optional().describe("How often they create content: Daily, Weekly, etc."),
    competitors: z.array(z.object({
        domain: z.string(),
        notes: z.string().optional(),
    })).optional().describe("Competitor domains to track"),
})

/**
 * Brand Voice Schema
 */
const brandVoiceSchema = z.object({
    tone: z.string().describe("The brand's tone: professional, casual, friendly, etc."),
    style: z.string().describe("Writing style: conversational, formal, technical, etc."),
    personality: z.array(z.string()).optional().describe("Personality traits: innovative, trustworthy, etc."),
    sample_phrases: z.array(z.string()).optional().describe("Example phrases that capture the brand voice"),
    source: z.enum(['social_media', 'manual', 'ai_detected']).optional().describe("How the voice was determined"),
})

/**
 * Upsert Business Profile Tool
 * Saves or updates the user's business profile during onboarding
 */
export const upsertBusinessProfileTool = tool({
    description: `Save or update the user's business profile information. Use this during onboarding to store collected data like website URL, industry, location, goals, and content preferences.`,
    inputSchema: businessProfileSchema,
    execute: async (params) => {
        try {
            const user = await getCurrentUser()
            if (!user) {
                return {
                    success: false,
                    error: 'User not authenticated. Please log in to save your profile.',
                }
            }

            const profile = await upsertBusinessProfile(user.id, {
                websiteUrl: params.website_url,
                industry: params.industry,
                locations: params.location,
                goals: params.goals,
                contentFrequency: params.content_frequency,
            })

            return {
                success: true,
                message: 'Business profile updated successfully!',
                profile,
            }
        } catch (error: any) {
            console.error('[Business Profile Tool] Error:', error)
            return {
                success: false,
                error: error.message || 'An unexpected error occurred',
            }
        }
    },
})

/**
 * Upsert Brand Voice Tool
 * Saves the user's brand voice preferences
 */
export const upsertBrandVoiceTool = tool({
    description: `Save or update the user's brand voice preferences. Use this during onboarding step 2 to store tone, style, personality traits, and sample phrases.`,
    inputSchema: brandVoiceSchema,
    execute: async (params) => {
        try {
            const user = await getCurrentUser()
            if (!user) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                }
            }

            const brandVoice = await upsertBrandVoice(user.id, {
                tone: params.tone,
                style: params.style,
                personality: params.personality,
                samplePhrases: params.sample_phrases,
                source: params.source || 'manual',
            })

            return {
                success: true,
                message: 'Brand voice updated successfully!',
                brandVoice,
            }
        } catch (error: any) {
            console.error('[Brand Voice Tool] Error:', error)
            return {
                success: false,
                error: error.message || 'An unexpected error occurred',
            }
        }
    },
})

/**
 * Get Business Profile Tool
 * Retrieves the user's complete business profile
 */
export const getBusinessProfileTool = tool({
    description: `Retrieve the current user's business profile including website, industry, location, goals, and brand voice.`,
    inputSchema: z.object({}),
    execute: async () => {
        try {
            const user = await getCurrentUser()
            if (!user) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                    hasProfile: false,
                }
            }

            const [profile, brandVoice] = await Promise.all([
                getBusinessProfile(user.id),
                getBrandVoice(user.id),
            ])

            const hasProfile = !!profile || !!brandVoice
            const isComplete = !!(
                profile?.websiteUrl &&
                profile?.industry &&
                (profile?.goals as any)?.length > 0 &&
                brandVoice?.tone
            )

            return {
                success: true,
                hasProfile,
                isComplete,
                profile: profile || null,
                brandVoice: brandVoice || null,
                missingFields: getMissingFields(profile, brandVoice),
            }
        } catch (error: any) {
            console.error('[Get Business Profile Tool] Error:', error)
            return {
                success: false,
                error: error.message || 'An unexpected error occurred',
                hasProfile: false,
            }
        }
    },
})

/**
 * Helper: Get list of missing profile fields
 */
function getMissingFields(profile: any, brandVoice: any): string[] {
    const missing: string[] = []

    if (!profile?.websiteUrl) missing.push('website_url')
    if (!profile?.industry) missing.push('industry')
    if (!(profile?.locations as any)?.country) missing.push('location')
    if (!(profile?.goals as any)?.length) missing.push('goals')
    if (!profile?.contentFrequency) missing.push('content_frequency')
    if (!brandVoice?.tone) missing.push('brand_voice')

    return missing
}

/**
 * Export all tools as a record for easy integration
 */
export const businessProfileTools = {
    upsert_business_profile: upsertBusinessProfileTool,
    upsert_brand_voice: upsertBrandVoiceTool,
    get_business_profile: getBusinessProfileTool,
}

/**
 * Helper: Get user's business context for agent prompts
 */
export async function getUserBusinessContext(userId: string): Promise<{
    hasProfile: boolean
    context: string
    profile: any
    brandVoice: any
}> {
    try {
        const [profile, brandVoice] = await Promise.all([
            getBusinessProfile(userId),
            getBrandVoice(userId),
        ])

        const hasProfile = !!profile?.websiteUrl

        if (!hasProfile) {
            return {
                hasProfile: false,
                context: '',
                profile: null,
                brandVoice: null,
            }
        }

        // Build context string for prompts
        const contextParts: string[] = []

        if (profile?.websiteUrl) {
            contextParts.push(`Website: ${profile.websiteUrl}`)
        }
        if (profile?.industry) {
            contextParts.push(`Industry: ${profile.industry}`)
        }
        const locations = profile?.locations as any
        if (locations?.country) {
            const loc = [locations.city, locations.region, locations.country]
                .filter(Boolean).join(', ')
            contextParts.push(`Target Location: ${loc}`)
        }
        const goals = profile?.goals as any
        if (goals?.length) {
            contextParts.push(`Business Goals: ${goals.join(', ')}`)
        }
        if (brandVoice?.tone) {
            contextParts.push(`Brand Voice: ${brandVoice.tone}, ${brandVoice.style}`)
        }
        const personality = brandVoice?.personality as any
        if (personality?.length) {
            contextParts.push(`Brand Personality: ${personality.join(', ')}`)
        }

        return {
            hasProfile: true,
            context: contextParts.join('\n'),
            profile,
            brandVoice,
        }
    } catch (error) {
        console.error('[getUserBusinessContext] Error:', error)
        return {
            hasProfile: false,
            context: '',
            profile: null,
            brandVoice: null,
        }
    }
}
