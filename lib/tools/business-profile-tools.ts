/**
 * Business Profile Tools
 * 
 * AI SDK tools for managing user business profiles during onboarding
 * and throughout the application lifecycle.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

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
            const supabase = await createClient()

            // Get current user
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                return {
                    success: false,
                    error: 'User not authenticated. Please log in to save your profile.',
                }
            }

            // Prepare the data
            const profileData: Record<string, any> = {
                user_id: user.id,
                updated_at: new Date().toISOString(),
            }

            if (params.website_url) profileData.website_url = params.website_url
            if (params.industry) profileData.industry = params.industry
            if (params.location) profileData.locations = params.location
            if (params.goals) profileData.goals = params.goals
            if (params.content_frequency) profileData.content_frequency = params.content_frequency

            // Upsert the profile (insert or update)
            const { data, error } = await supabase
                .from('business_profiles')
                .upsert(profileData, {
                    onConflict: 'user_id',
                    ignoreDuplicates: false,
                })
                .select()
                .single()

            if (error) {
                console.error('[Business Profile Tool] Upsert error:', error)

                // If upsert fails due to no existing row, try insert
                if (error.code === 'PGRST116') {
                    const { data: insertData, error: insertError } = await supabase
                        .from('business_profiles')
                        .insert(profileData)
                        .select()
                        .single()

                    if (insertError) {
                        return {
                            success: false,
                            error: `Failed to save profile: ${insertError.message}`,
                        }
                    }

                    return {
                        success: true,
                        message: 'Business profile created successfully!',
                        profile: insertData,
                    }
                }

                return {
                    success: false,
                    error: `Failed to save profile: ${error.message}`,
                }
            }

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
            const supabase = await createClient()

            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                }
            }

            const voiceData = {
                user_id: user.id,
                tone: params.tone,
                style: params.style,
                personality: params.personality || [],
                sample_phrases: params.sample_phrases || [],
                source: params.source || 'manual',
                updated_at: new Date().toISOString(),
            }

            const { data, error } = await supabase
                .from('brand_voices')
                .upsert(voiceData, {
                    onConflict: 'user_id',
                    ignoreDuplicates: false,
                })
                .select()
                .single()

            if (error) {
                // Try insert if upsert fails
                const { data: insertData, error: insertError } = await supabase
                    .from('brand_voices')
                    .insert(voiceData)
                    .select()
                    .single()

                if (insertError) {
                    return {
                        success: false,
                        error: `Failed to save brand voice: ${insertError.message}`,
                    }
                }

                return {
                    success: true,
                    message: 'Brand voice created successfully!',
                    brandVoice: insertData,
                }
            }

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
            const supabase = await createClient()

            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) {
                return {
                    success: false,
                    error: 'User not authenticated.',
                    hasProfile: false,
                }
            }

            // Fetch business profile
            const { data: profile, error: profileError } = await supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            // Fetch brand voice
            const { data: brandVoice, error: voiceError } = await supabase
                .from('brand_voices')
                .select('*')
                .eq('user_id', user.id)
                .single()

            const hasProfile = !!profile || !!brandVoice
            const isComplete = !!(
                profile?.website_url &&
                profile?.industry &&
                profile?.goals?.length > 0 &&
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
        const supabase = await createClient()

        const [profileResult, voiceResult] = await Promise.all([
            supabase.from('business_profiles').select('*').eq('user_id', userId).single(),
            supabase.from('brand_voices').select('*').eq('user_id', userId).single(),
        ])

        const profile = profileResult.data
        const brandVoice = voiceResult.data
        const hasProfile = !!profile?.website_url

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

        if (profile?.website_url) {
            contextParts.push(`Website: ${profile.website_url}`)
        }
        if (profile?.industry) {
            contextParts.push(`Industry: ${profile.industry}`)
        }
        if (profile?.locations?.country) {
            const loc = [profile.locations.city, profile.locations.region, profile.locations.country]
                .filter(Boolean).join(', ')
            contextParts.push(`Target Location: ${loc}`)
        }
        if (profile?.goals?.length) {
            contextParts.push(`Business Goals: ${profile.goals.join(', ')}`)
        }
        if (brandVoice?.tone) {
            contextParts.push(`Brand Voice: ${brandVoice.tone}, ${brandVoice.style}`)
        }
        if (brandVoice?.personality?.length) {
            contextParts.push(`Brand Personality: ${brandVoice.personality.join(', ')}`)
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
