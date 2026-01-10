/**
 * Business Profile Tools
 * 
 * AI SDK tools for managing user business profiles during onboarding
 * and throughout the application lifecycle.
 * 
 * Migrated from Supabase to Drizzle ORM with Clerk auth
 */

import { tool } from 'ai'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/clerk'
import {
    getBusinessProfile,
    upsertBusinessProfile,
    getBrandVoice,
    upsertBrandVoice,
} from '@/lib/db/queries'

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
    description: `Save or update the user's business profile information. Use this during onboarding to store collected data like website URL, industry, location, goals, and content preferences. Call this immediately after the user provides each piece of information - don't wait for confirmation.`,
    inputSchema: businessProfileSchema,
    execute: async (params) => {
        try {
            // Get current user from Clerk
            const user = await getCurrentUser()
            if (!user) {
                return {
                    success: false,
                    error: 'User not authenticated. Please log in to save your profile.',
                }
            }

            // Prepare the data for Drizzle
            const profileData: Record<string, any> = {}

            if (params.website_url) profileData.websiteUrl = params.website_url
            if (params.industry) profileData.industry = params.industry
            if (params.location) profileData.locations = params.location
            if (params.goals) profileData.goals = params.goals
            if (params.content_frequency) profileData.contentFrequency = params.content_frequency

            // Upsert the profile using Drizzle query
            const data = await upsertBusinessProfile(user.id, profileData)

            return {
                success: true,
                message: 'Business profile updated successfully!',
                profile: data,
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
            // Get current user from Clerk
            const user = await getCurrentUser()
            if (!user) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                }
            }

            // Prepare voice data for Drizzle
            const voiceData = {
                tone: params.tone,
                style: params.style,
                personality: params.personality || [],
                samplePhrases: params.sample_phrases || [],
                source: params.source || 'manual',
            }

            // Upsert using Drizzle query
            const data = await upsertBrandVoice(user.id, voiceData)

            return {
                success: true,
                message: 'Brand voice updated successfully!',
                brandVoice: data,
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
    description: `Retrieve the current user's business profile including website, industry, location, goals, and brand voice. Use this to understand the user's context before providing advice or generating content.`,
    inputSchema: z.object({}),
    execute: async () => {
        try {
            // Get current user from Clerk
            const user = await getCurrentUser()
            if (!user) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                    hasProfile: false,
                }
            }

            // Fetch business profile and brand voice using Drizzle queries
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

    if (!profile?.website_url) missing.push('website_url')
    if (!profile?.industry) missing.push('industry')
    if (!profile?.locations?.country) missing.push('location')
    if (!profile?.goals?.length) missing.push('goals')
    if (!profile?.content_frequency) missing.push('content_frequency')
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
 * Use this to inject context into system prompts
 */
export async function getUserBusinessContext(userId: string): Promise<{
    hasProfile: boolean
    context: string
    profile: any
    brandVoice: any
}> {
    try {
        // Fetch using Drizzle queries
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
        const locations = profile?.locations as any

        if (profile?.websiteUrl) {
            contextParts.push(`Website: ${profile.websiteUrl}`)
        }
        if (profile?.industry) {
            contextParts.push(`Industry: ${profile.industry}`)
        }
        if (locations?.country) {
            const loc = [locations.city, locations.region, locations.country]
                .filter(Boolean).join(', ')
            contextParts.push(`Target Location: ${loc}`)
        }
        if ((profile?.goals as any)?.length) {
            contextParts.push(`Business Goals: ${(profile.goals as string[]).join(', ')}`)
        }
        if (brandVoice?.tone) {
            contextParts.push(`Brand Voice: ${brandVoice.tone}, ${brandVoice.style}`)
        }
        if ((brandVoice?.personality as any)?.length) {
            contextParts.push(`Brand Personality: ${(brandVoice?.personality as string[])?.join(', ')}`)
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
