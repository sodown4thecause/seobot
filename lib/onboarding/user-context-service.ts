/**
 * User Context Service
 * 
 * Centralized service for fetching and formatting user business context
 * for use in AI agent prompts. This enables personalized responses across all agents.
 */

import { db } from '@/lib/db'
import { businessProfiles, brandVoices } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export interface UserBusinessContext {
    hasProfile: boolean
    isOnboarded: boolean
    context: string
    profile: {
        websiteUrl?: string
        industry?: string
        location?: {
            country?: string
            region?: string
            city?: string
        }
        goals?: string[]
        contentFrequency?: string
    } | null
    brandVoice: {
        tone?: string
        style?: string
        personality?: string[]
        samplePhrases?: string[]
    } | null
}

/**
 * Fetch user's complete business context from Neon
 * 
 * This is the primary function for getting user context to inject into agent prompts.
 * It fetches both business profile and brand voice data.
 */
export async function getUserBusinessContext(userId: string): Promise<UserBusinessContext> {
    try {
        // Fetch business profile and brand voice in parallel
        const [profileResult, voiceResult] = await Promise.all([
            db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1),
            db.select().from(brandVoices).where(eq(brandVoices.userId, userId)).limit(1),
        ])

        const profile = profileResult[0] || null
        const voice = voiceResult[0] || null

        const hasProfile = !!profile?.websiteUrl
        const hasBrandVoice = !!voice?.tone
        const isOnboarded = hasProfile && hasBrandVoice

        if (!hasProfile) {
            return {
                hasProfile: false,
                isOnboarded: false,
                context: '',
                profile: null,
                brandVoice: null,
            }
        }

        // Build context string for agent prompts
        const contextParts: string[] = []

        if (profile.websiteUrl) {
            contextParts.push(`Website: ${profile.websiteUrl}`)
        }
        if (profile.industry) {
            contextParts.push(`Industry: ${profile.industry}`)
        }
        if (profile.locations) {
            const loc = profile.locations as { country?: string; region?: string; city?: string }
            const locationStr = [loc.city, loc.region, loc.country].filter(Boolean).join(', ')
            if (locationStr) {
                contextParts.push(`Target Location: ${locationStr}`)
            }
        }
        if (profile.goals && Array.isArray(profile.goals)) {
            contextParts.push(`Business Goals: ${(profile.goals as string[]).join(', ')}`)
        }
        if (profile.contentFrequency) {
            contextParts.push(`Content Frequency: ${profile.contentFrequency}`)
        }

        // Add brand voice context
        if (voice) {
            if (voice.tone && voice.style) {
                contextParts.push(`Brand Voice: ${voice.tone}, ${voice.style}`)
            }
            const personality = voice.personality as string[] | null
            if (personality && personality.length > 0) {
                contextParts.push(`Brand Personality: ${personality.join(', ')}`)
            }
            if (voice.samplePhrases && voice.samplePhrases.length > 0) {
                contextParts.push(`Sample Phrases: "${voice.samplePhrases.slice(0, 3).join('" | "')}"`)
            }
        }

        return {
            hasProfile: true,
            isOnboarded,
            context: contextParts.join('\n'),
            profile: {
                websiteUrl: profile.websiteUrl,
                industry: profile.industry || undefined,
                location: profile.locations as { country?: string; region?: string; city?: string } || undefined,
                goals: (profile.goals as string[]) || undefined,
                contentFrequency: profile.contentFrequency || undefined,
            },
            brandVoice: voice ? {
                tone: voice.tone,
                style: voice.style,
                personality: (voice.personality as string[]) || [],
                samplePhrases: voice.samplePhrases || [],
            } : null,
        }
    } catch (error) {
        console.error('[User Context Service] Error fetching user context:', error)
        return {
            hasProfile: false,
            isOnboarded: false,
            context: '',
            profile: null,
            brandVoice: null,
        }
    }
}

/**
 * Format user context for injection into system prompts
 * 
 * Returns a formatted string block that can be appended to any agent's system prompt.
 */
export function formatContextForPrompt(context: UserBusinessContext): string {
    if (!context.hasProfile || !context.context) {
        return ''
    }

    return `
## USER BUSINESS CONTEXT
The user has provided their business information. Use this to personalize your responses:

${context.context}

IMPORTANT: All content and advice should be tailored to this user's:
- Industry and target audience
- Brand voice and communication style
- Business goals and objectives
${context.brandVoice?.samplePhrases?.length ? `- Writing style (use phrases like: "${context.brandVoice.samplePhrases[0]}")` : ''}
`.trim()
}

/**
 * Check if user needs onboarding
 */
export async function checkNeedsOnboarding(userId: string): Promise<{
    needsOnboarding: boolean
    missingFields: string[]
}> {
    const context = await getUserBusinessContext(userId)

    if (!context.hasProfile) {
        return {
            needsOnboarding: true,
            missingFields: ['website_url', 'industry', 'goals', 'brand_voice'],
        }
    }

    const missingFields: string[] = []

    if (!context.profile?.websiteUrl) missingFields.push('website_url')
    if (!context.profile?.industry) missingFields.push('industry')
    if (!context.profile?.goals?.length) missingFields.push('goals')
    if (!context.brandVoice?.tone) missingFields.push('brand_voice')

    return {
        needsOnboarding: missingFields.length > 0,
        missingFields,
    }
}

/**
 * Upsert business profile (for onboarding)
 */
export async function upsertBusinessProfile(
    userId: string,
    data: {
        websiteUrl?: string
        industry?: string
        location?: { country?: string; region?: string; city?: string }
        goals?: string[]
        contentFrequency?: string
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if profile exists
        const existing = await db
            .select()
            .from(businessProfiles)
            .where(eq(businessProfiles.userId, userId))
            .limit(1)

        if (existing.length > 0) {
            // Update existing profile
            await db
                .update(businessProfiles)
                .set({
                    websiteUrl: data.websiteUrl || existing[0].websiteUrl,
                    industry: data.industry || existing[0].industry,
                    locations: data.location || existing[0].locations,
                    goals: data.goals || existing[0].goals,
                    contentFrequency: data.contentFrequency || existing[0].contentFrequency,
                    updatedAt: new Date(),
                })
                .where(eq(businessProfiles.userId, userId))
        } else {
            // Insert new profile
            await db.insert(businessProfiles).values({
                userId,
                websiteUrl: data.websiteUrl || '',
                industry: data.industry,
                locations: data.location,
                goals: data.goals,
                contentFrequency: data.contentFrequency,
            })
        }

        return { success: true }
    } catch (error) {
        console.error('[User Context Service] Error upserting business profile:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save business profile',
        }
    }
}
