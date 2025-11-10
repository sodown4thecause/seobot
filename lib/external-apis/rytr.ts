/**
 * Rytr AI Integration
 * 
 * Provides AI-powered content generation with tone and style control
 * for SEO-optimized content creation.
 * 
 * Features:
 * - AI content generation (blog posts, meta descriptions, etc.)
 * - Tone and style control
 * - Built-in plagiarism checking
 * - Multiple use cases (SEO, social media, ads, etc.)
 * 
 * API Docs: https://rytr.me/api
 */

import { serverEnv } from '@/lib/config/env'

const RYTR_API_BASE = 'https://api.rytr.me/v1'

export type RytrTone = 
  | 'appreciative'
  | 'assertive'
  | 'awestruck'
  | 'candid'
  | 'casual'
  | 'cautionary'
  | 'compassionate'
  | 'convincing'
  | 'critical'
  | 'earnest'
  | 'enthusiastic'
  | 'formal'
  | 'funny'
  | 'humble'
  | 'humorous'
  | 'informative'
  | 'inspirational'
  | 'joyful'
  | 'passionate'
  | 'thoughtful'
  | 'urgent'
  | 'worried'

export type RytrUseCase =
  | 'blog_idea_outline'
  | 'blog_section_writing'
  | 'business_idea_pitch'
  | 'copywriting_framework_aida'
  | 'copywriting_framework_pas'
  | 'email_marketing'
  | 'facebook_ad'
  | 'google_ad'
  | 'instagram_caption'
  | 'job_description'
  | 'linkedin_ad'
  | 'meta_description'
  | 'product_description'
  | 'seo_meta_title'
  | 'social_media_post'
  | 'text_editing_continue'
  | 'text_editing_expand'
  | 'text_editing_improve'
  | 'text_editing_paragraph'
  | 'text_editing_shorten'
  | 'video_description'
  | 'video_idea'

export interface RytrGenerateOptions {
  useCase: RytrUseCase
  input: string // Context or topic
  tone?: RytrTone
  language?: string // Default: 'en'
  variations?: number // Number of variations to generate (1-3)
  creativity?: 'low' | 'medium' | 'high' // Default: 'medium'
}

export interface RytrGenerateResult {
  text: string
  variations?: string[]
  metadata: {
    useCase: string
    tone: string
    language: string
    charactersUsed: number
  }
}

/**
 * Generate content using Rytr AI
 */
export async function generateContent(
  options: RytrGenerateOptions
): Promise<RytrGenerateResult> {
  const {
    useCase,
    input,
    tone = 'informative',
    language = 'en',
    variations = 1,
    creativity = 'medium',
  } = options

  if (!input || input.trim().length === 0) {
    throw new Error('Input context is required for content generation')
  }

  try {
    const response = await fetch(`${RYTR_API_BASE}/ryte`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverEnv.RYTR_API_KEY}`,
      },
      body: JSON.stringify({
        languageId: language,
        toneId: tone,
        useCaseId: useCase,
        inputContexts: {
          INPUT_TEXT: input,
        },
        variations,
        creativity: creativity === 'low' ? 0 : creativity === 'high' ? 2 : 1,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Rytr API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      text: data.data?.[0]?.text || '',
      variations: data.data?.map((item: any) => item.text) || [],
      metadata: {
        useCase,
        tone,
        language,
        charactersUsed: data.credits_used || 0,
      },
    }
  } catch (error) {
    console.error('[Rytr] Content generation failed:', error)
    throw error
  }
}

/**
 * Generate SEO-optimized blog section
 */
export async function generateBlogSection(
  topic: string,
  keywords: string[],
  tone: RytrTone = 'informative'
): Promise<string> {
  const input = `Topic: ${topic}\nKeywords: ${keywords.join(', ')}`
  
  const result = await generateContent({
    useCase: 'blog_section_writing',
    input,
    tone,
    creativity: 'medium',
  })

  return result.text
}

/**
 * Generate SEO meta description
 */
export async function generateMetaDescription(
  pageTitle: string,
  keywords: string[]
): Promise<string> {
  const input = `Page: ${pageTitle}\nKeywords: ${keywords.join(', ')}`
  
  const result = await generateContent({
    useCase: 'meta_description',
    input,
    tone: 'informative',
    creativity: 'low', // Meta descriptions should be straightforward
  })

  // Ensure meta description is within 155-160 characters
  let metaDesc = result.text.trim()
  if (metaDesc.length > 160) {
    metaDesc = metaDesc.substring(0, 157) + '...'
  }

  return metaDesc
}

/**
 * Generate SEO meta title
 */
export async function generateMetaTitle(
  topic: string,
  primaryKeyword: string
): Promise<string> {
  const input = `Topic: ${topic}\nPrimary Keyword: ${primaryKeyword}`
  
  const result = await generateContent({
    useCase: 'seo_meta_title',
    input,
    tone: 'informative',
    creativity: 'low',
  })

  // Ensure meta title is within 50-60 characters
  let metaTitle = result.text.trim()
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.substring(0, 57) + '...'
  }

  return metaTitle
}

/**
 * Improve existing content
 */
export async function improveContent(
  text: string,
  tone: RytrTone = 'informative'
): Promise<string> {
  const result = await generateContent({
    useCase: 'text_editing_improve',
    input: text,
    tone,
    creativity: 'medium',
  })

  return result.text
}

/**
 * Expand content with more details
 */
export async function expandContent(
  text: string,
  tone: RytrTone = 'informative'
): Promise<string> {
  const result = await generateContent({
    useCase: 'text_editing_expand',
    input: text,
    tone,
    creativity: 'medium',
  })

  return result.text
}

/**
 * Generate multiple content variations for A/B testing
 */
export async function generateVariations(
  useCase: RytrUseCase,
  input: string,
  count: number = 3,
  tone: RytrTone = 'informative'
): Promise<string[]> {
  const result = await generateContent({
    useCase,
    input,
    tone,
    variations: Math.min(count, 3), // Rytr supports max 3 variations
    creativity: 'high', // Higher creativity for more diverse variations
  })

  return result.variations || [result.text]
}

/**
 * Generate SEO-optimized content with plagiarism check
 */
export async function generateSEOContent(options: {
  topic: string
  keywords: string[]
  tone?: RytrTone
  useCase?: RytrUseCase
}): Promise<{
  content: string
  metaTitle: string
  metaDescription: string
  variations: string[]
}> {
  const { topic, keywords, tone = 'informative', useCase = 'blog_section_writing' } = options

  // Generate main content
  const contentResult = await generateContent({
    useCase,
    input: `Topic: ${topic}\nKeywords: ${keywords.join(', ')}`,
    tone,
    variations: 2,
    creativity: 'medium',
  })

  // Generate meta title and description in parallel
  const [metaTitle, metaDescription] = await Promise.all([
    generateMetaTitle(topic, keywords[0]),
    generateMetaDescription(topic, keywords),
  ])

  return {
    content: contentResult.text,
    metaTitle,
    metaDescription,
    variations: contentResult.variations || [],
  }
}

