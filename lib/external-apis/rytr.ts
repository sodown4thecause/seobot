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

// Caches to avoid repeated API lookups
let cachedUseCases:
  | Array<{
      _id: string
      key: string
      slug?: string
      name?: string
      contextInputs?: Array<{ keyLabel: string; isRequired: boolean }>
    }>
  | null = null
let cachedLanguages:
  | Array<{
      _id: string
      slug: string
      name: string
    }>
  | null = null
let cachedTones:
  | Array<{
      _id: string
      slug: string
      name: string
    }>
  | null = null

const DEFAULT_LANGUAGE_SLUG = 'english'
const DEFAULT_TONE_SLUG = 'informative'

const USE_CASE_ALIASES: Record<string, string> = {
  blog_section_writing: 'blog-paragraph',
  meta_description: 'seo-description',
  seo_meta_title: 'seo-title',
  text_editing_improve: 'text-improver',
  text_editing_expand: 'text-expand',
  text_editing_paragraph: 'text-paragraph',
  text_editing_shorten: 'text-shorten',
  humanize: 'text-change-tone',
}

const isMongoId = (value: string | undefined): boolean =>
  !!value && /^[a-f\d]{24}$/i.test(value)

async function fetchJson<T>(path: string): Promise<T> {
  if (!serverEnv.RYTR_API_KEY) {
    throw new Error('RYTR_API_KEY is not configured. Please set it in your environment variables.')
  }

  const response = await fetch(`${RYTR_API_BASE}/${path}`, {
    headers: {
      'Authentication': `Bearer ${serverEnv.RYTR_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rytr API fetch failed (${path}): ${response.status} - ${error}`)
  }

  return response.json()
}

async function getUseCases() {
  if (cachedUseCases) return cachedUseCases
  const data = await fetchJson<{ success: boolean; data: typeof cachedUseCases }>('use-cases')
  cachedUseCases = data.data || []
  return cachedUseCases
}

async function getLanguages() {
  if (cachedLanguages) return cachedLanguages
  const data = await fetchJson<{ success: boolean; data: typeof cachedLanguages }>('languages')
  cachedLanguages = data.data || []
  return cachedLanguages
}

async function getTones() {
  if (cachedTones) return cachedTones
  const data = await fetchJson<{ success: boolean; data: typeof cachedTones }>('tones')
  cachedTones = data.data || []
  return cachedTones
}

async function resolveUseCase(identifier: string) {
  const useCases = await getUseCases()
  const normalizedInput = identifier?.toLowerCase()
  const aliasTarget = USE_CASE_ALIASES[normalizedInput] || identifier
  const normalizedAlias = aliasTarget?.toLowerCase().replace(/_/g, '-')

  const found = useCases.find((useCase) => {
    if (isMongoId(aliasTarget) && useCase._id === aliasTarget) return true
    const keysToCheck = [
      useCase.key?.toLowerCase(),
      useCase.slug?.toLowerCase(),
      useCase.name?.toLowerCase(),
    ]
    return keysToCheck.some((key) => key === normalizedAlias || key === normalizedInput)
  })

  if (!found) {
    throw new Error(`Unknown Rytr use case: ${identifier}`)
  }

  const inputKey =
    found.contextInputs?.find((input) => input.isRequired)?.keyLabel ||
    found.contextInputs?.[0]?.keyLabel ||
    'CONTEXT_LABEL'

  return {
    id: found._id,
    inputKey,
  }
}

async function resolveLanguageId(language: string) {
  if (isMongoId(language)) return language
  const languages = await getLanguages()
  const normalized = language?.toLowerCase()
  const fallback = languages.find((item) => item.slug === DEFAULT_LANGUAGE_SLUG)
  const match = languages.find(
    (item) =>
      item.slug?.toLowerCase() === normalized || item.name?.toLowerCase() === normalized,
  )
  return match?._id || fallback?._id || language
}

async function resolveToneId(tone: string) {
  if (isMongoId(tone)) return tone
  const tones = await getTones()
  const normalized = tone?.toLowerCase()
  const fallback = tones.find((item) => item.slug === DEFAULT_TONE_SLUG)
  const match = tones.find(
    (item) =>
      item.slug?.toLowerCase() === normalized || item.name?.toLowerCase() === normalized,
  )
  return match?._id || fallback?._id || tone
}

function extractTextFromRytrItem(item: any): string {
  if (!item) return ''
  if (typeof item === 'string') return item
  if (typeof item.text === 'string') return item.text
  if (typeof item.output === 'string') return item.output
  if (typeof item.content === 'string') return item.content

  // Sometimes text/output can be arrays of strings
  if (Array.isArray(item.text)) return item.text.join('\n')
  if (Array.isArray(item.output)) return item.output.join('\n')
  if (Array.isArray(item.content)) return item.content.join('\n')

  // Fallback: look for any string values inside object
  if (typeof item === 'object') {
    for (const value of Object.values(item)) {
      if (typeof value === 'string') return value
      if (Array.isArray(value)) {
        const flattened = value.filter((v) => typeof v === 'string')
        if (flattened.length) return flattened.join('\n')
      }
    }
  }

  return ''
}

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

export type RytrUseCase = string

export interface RytrGenerateOptions {
  useCase: RytrUseCase
  input: string // Context or topic
  tone?: RytrTone
  language?: string // Default: 'en'
  variations?: number // Number of variations to generate (1-3)
  creativity?: 'low' | 'medium' | 'high' // Default: 'medium'
  userId?: string // Rytr requires a unique user ID per end user
}

export interface RytrGenerateResult {
  text: string
  variations: string[]
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
    userId,
  } = options

  if (!input || input.trim().length === 0) {
    throw new Error('Input context is required for content generation')
  }

  // Rytr has a character limit - truncate if needed (typically 5000-10000 chars)
  const MAX_RYTR_INPUT_LENGTH = 5000;
  const truncatedInput = input.length > MAX_RYTR_INPUT_LENGTH 
    ? input.substring(0, MAX_RYTR_INPUT_LENGTH) + '...'
    : input;
  
  if (input.length > MAX_RYTR_INPUT_LENGTH) {
    console.warn(`[Rytr] Input truncated from ${input.length} to ${MAX_RYTR_INPUT_LENGTH} characters`);
  }

  try {
    const [{ id: useCaseId, inputKey }, languageId, toneId] = await Promise.all([
      resolveUseCase(useCase),
      resolveLanguageId(language),
      resolveToneId(tone),
    ])

    const inputContexts: Record<string, string> = {
      [inputKey]: truncatedInput
    };
    
    const requestBody = {
      languageId,
      toneId,
      useCaseId,
      inputContexts,
      variations,
      userId: userId || 'ANON_USER',
      format: 'text',
      creativityLevel: creativity, // 'low' | 'medium' | 'high'
    };
    
    console.log('[Rytr] Request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${RYTR_API_BASE}/ryte`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Rytr uses custom "Authentication: Bearer <token>" header (not standard Authorization)
        'Authentication': `Bearer ${serverEnv.RYTR_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Rytr] API error response:', response.status, error)
      console.error('[Rytr] Failed request body:', JSON.stringify(requestBody, null, 2))
      throw new Error(`Rytr API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    console.log('[Rytr] Response:', JSON.stringify(data).slice(0, 500));
    
    // Check if Rytr returned an error in the response body
    if (data.success === false || data.error) {
      console.error('[Rytr] API returned error in response body:', data);
      console.error('[Rytr] Request that caused error:', JSON.stringify(requestBody, null, 2));
      throw new Error(`Rytr API error: ${data.message || data.error || 'Unknown error'}`);
    }

    const dataItems = Array.isArray(data.data)
      ? data.data
      : data.data
        ? [data.data]
        : []

    const normalizedVariations = dataItems
      .map((item: any) => extractTextFromRytrItem(item))
      .filter((text: string) => typeof text === 'string' && text.trim().length > 0)

    const mainText: string = normalizedVariations[0] || ''

    if (!normalizedVariations.length) {
      console.warn(
        '[Rytr] Empty or missing data field in response:',
        JSON.stringify(data).slice(0, 1000),
      )
    }

    console.log('[Rytr] Generation result lengths:', {
      mainTextLength: mainText.length,
      variations: normalizedVariations.length,
    })

    return {
      text: mainText,
      variations: normalizedVariations,
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
 * Humanize content to reduce AI detection
 * Used by QA agent to improve content quality
 */
export async function humanizeContent(options: {
  content: string
  strategy?: 'improve' | 'expand' | 'rewrite'
  userId?: string
}): Promise<{ content: string }> {
  const { content, strategy = 'improve', userId } = options
  
  // For humanization we use Rytr's dedicated 'humanize' use case
  const result = await generateContent({
    useCase: 'humanize',
    input: content,
    tone: 'casual', // Using 'casual' instead of 'conversational' which isn't a valid RytrTone
    creativity: 'high', // Higher creativity for more human-like output
    userId,
  })
  
  return {
    content: result.text,
  }
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

