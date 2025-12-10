import 'server-only'
import { Buffer } from 'node:buffer'
import { generateObject, generateText, experimental_generateImage as generateImage } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'
import { createTelemetryConfig } from '@/lib/observability/langfuse'
import { createAdminClient } from '@/lib/supabase/server'
import { vercelGateway } from '@/lib/ai/gateway-provider'

// Re-export types for backward compatibility (these can be imported from image-generation-types.ts for client code)
export type {
  ImageGenerationOptions,
  GeneratedImage,
  ImageSuggestion,
  GatewayGeminiImageOptions,
  GatewayGeminiImageResult,
  GatewayGeminiImageResponse,
  GeminiImageRequest,
  GeminiGeneratedImage,
} from './image-generation-types'
export { SEOPrompts } from './image-generation-types'

import type {
  ImageGenerationOptions,
  GeneratedImage,
  ImageSuggestion,
  GatewayGeminiImageOptions,
  GatewayGeminiImageResult,
  GatewayGeminiImageResponse,
  GeminiImageRequest,
  GeminiGeneratedImage,
} from './image-generation-types'

// Initialize AI providers
const google = createGoogleGenerativeAI({
  apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GOOGLE_API_KEY,
})

// Use singleton admin client for Supabase operations
function getSupabase() {
  return createAdminClient()
}

/**
 * Generate contextual image suggestions based on article content
 */
export async function generateImageSuggestions(
  title: string,
  content: string,
  targetKeyword: string
): Promise<ImageSuggestion[]> {
  try {
    const prompt = `Based on this article, suggest 5 specific images that would enhance the content:

Title: "${title}"
Target Keyword: "${targetKeyword}"
Content: "${content.substring(0, 2000)}..."

For each suggestion, provide:
1. Type: one of (hero, infographic, diagram, illustration, chart)
2. Detailed prompt for AI image generation
3. Description of what the image should show
4. Where it should be placed in the article
5. Priority for SEO impact

Focus on images that:
- Explain complex concepts visually
- Show data or statistics
- Illustrate processes or steps
- Create emotional connection
- Support the target keyword

Return as JSON array.`

    const imageSuggestionSchema = z.array(
      z.object({
        type: z.enum(['hero', 'infographic', 'diagram', 'illustration', 'chart']),
        prompt: z.string(),
        description: z.string(),
        placement: z.enum(['top', 'middle', 'bottom', 'inline']),
        priority: z.enum(['high', 'medium', 'low']),
      })
    )

    const { object } = await generateObject({
      model: google('gemini-2.5-pro') as any,
      prompt,
      schema: imageSuggestionSchema,
      experimental_telemetry: createTelemetryConfig('image-suggestions', {
        title,
        targetKeyword,
        contentLength: content.length,
        provider: 'google',
        model: 'gemini-2.5-pro',
      }),
    })

    return object as ImageSuggestion[]
  } catch (error) {
    console.error('Failed to generate image suggestions:', error)
    return []
  }
}

/**
 * Generate enhanced prompt based on article context and brand voice
 */
export async function enhanceImagePrompt(
  basePrompt: string,
  articleContext: ImageGenerationOptions['articleContext'],
  style: ImageGenerationOptions['style'] = 'realistic'
): Promise<string> {
  const styleInstructions = {
    realistic: 'photorealistic, high-quality, professional photography',
    illustration: 'modern digital illustration, clean lines, professional',
    diagram: 'technical diagram, clear labels, professional design',
    infographic: 'infographic style, data visualization, clean design',
    abstract: 'abstract representation, modern art style, professional'
  }

  const contextualPrompt = `Create an enhanced image prompt for SEO article content.

Base request: "${basePrompt}"
Article title: "${articleContext?.title}"
Target keyword: "${articleContext?.targetKeyword}"
Brand voice: "${articleContext?.brandVoice || 'professional and approachable'}"
Style: ${styleInstructions[style]}

Requirements:
1. Make it specific and detailed
2. Include relevant SEO elements
3. Match the professional brand voice
4. Optimize for the target keyword
5. Add composition and lighting details
6. Include color scheme preferences

Return only the enhanced prompt, no explanations.`

  try {
    const result = await generateText({
      model: google('gemini-2.5-pro') as any,
      prompt: contextualPrompt,
      experimental_telemetry: createTelemetryConfig('image-prompt-enhance', {
        style,
        hasArticleContext: !!articleContext,
        articleTitle: articleContext?.title,
        targetKeyword: articleContext?.targetKeyword,
        provider: 'google',
        model: 'gemini-2.5-pro',
      }),
    })

    return result.text
  } catch (error) {
    console.error('Failed to enhance prompt:', error)
    return basePrompt
  }
}

/**
 * Generate images using OpenAI DALL-E 3
 */
export async function generateImageWithOpenAI(
  options: ImageGenerationOptions
): Promise<GeneratedImage[]> {
  try {
    // Enhance prompt if article context is provided
    let finalPrompt = options.prompt
    if (options.articleContext) {
      finalPrompt = await enhanceImagePrompt(options.prompt, options.articleContext, options.style)
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverEnv.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: Math.min(options.numberOfImages || 1, 1), // DALL-E 3 only supports n=1
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style === 'realistic' ? 'natural' : 'vivid',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    const generatedImages: GeneratedImage[] = []
    
    for (const image of data.data) {
      // Download image and store in Supabase
      const imageResponse = await fetch(image.url)
      const imageBuffer = await imageResponse.arrayBuffer()
      const fileName = `generated/${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      
      const { data: uploadData, error: uploadError } = await getSupabase().storage
        .from('article-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '31536000', // 1 year cache
        })

      if (uploadError) {
        console.error('Failed to upload image to Supabase:', uploadError)
        continue
      }

      const { data: { publicUrl } } = getSupabase().storage
        .from('article-images')
        .getPublicUrl(fileName)

      // Generate alt text using AI
      const altText = await generateAltText(finalPrompt, options.articleContext)

      generatedImages.push({
        id: uploadData.path,
        url: publicUrl,
        altText,
        caption: generateImageCaption(finalPrompt, options.style),
        metadata: {
          prompt: finalPrompt,
          style: options.style || 'realistic',
          size: options.size || '1024x1024',
          provider: 'openai-dalle3',
          generatedAt: new Date().toISOString(),
        }
      })
    }

    return generatedImages
  } catch (error) {
    console.error('Failed to generate image with OpenAI:', error)
    throw error
  }
}

/**
 * Generate alt text for accessibility and SEO
 */
async function generateAltText(
  prompt: string,
  articleContext?: ImageGenerationOptions['articleContext']
): Promise<string> {
  try {
    const altPrompt = `Generate descriptive alt text for this image in an SEO article.

Image prompt: "${prompt}"
Article context: "${articleContext?.title} - ${articleContext?.targetKeyword}"

Requirements:
1. Be descriptive and specific
2. Include relevant keywords naturally
3. Keep under 125 characters
4. Focus on what's visually depicted
5. Make it accessible for screen readers

Return only the alt text, no quotes or explanations.`

    const result = await generateText({
      model: google('gemini-2.5-pro') as any,
      prompt: altPrompt,
      experimental_telemetry: createTelemetryConfig('image-alt-text-generation', {
        hasArticleContext: !!articleContext,
        articleTitle: articleContext?.title,
        targetKeyword: articleContext?.targetKeyword,
        provider: 'google',
        model: 'gemini-2.5-pro',
      }),
    })

    return (result.text || 'AI-generated image for article content').substring(0, 125)
  } catch (error) {
    console.error('Failed to generate alt text:', error)
    return 'AI-generated image for article content'
  }
}

/**
 * Generate image caption
 */
function generateImageCaption(prompt: string, style?: string): string {
  const captions = {
    realistic: 'Professional photograph illustrating key concepts',
    illustration: 'Custom illustration designed to enhance understanding',
    diagram: 'Technical diagram showing important relationships',
    infographic: 'Data visualization highlighting key statistics',
    abstract: 'Artistic representation of core themes'
  }

  return captions[style as keyof typeof captions] || 'AI-generated visual content'
}

/**
 * Generate multiple images with different styles for A/B testing
 */
export async function generateImageVariations(
  basePrompt: string,
  articleContext: ImageGenerationOptions['articleContext']
): Promise<GeneratedImage[]> {
  const styles: Array<ImageGenerationOptions['style']> = ['realistic', 'illustration', 'infographic']
  const allImages: GeneratedImage[] = []

  for (const style of styles) {
    try {
      const images = await generateImageWithOpenAI({
        prompt: basePrompt,
        style,
        size: '1024x1024',
        numberOfImages: 1,
        articleContext
      })
      allImages.push(...images)
    } catch (error) {
      console.error(`Failed to generate ${style} image:`, error)
    }
  }

  return allImages
}

/**
 * Search for similar existing images before generating new ones
 */
export async function searchSimilarImages(
  prompt: string,
  maxResults: number = 5
): Promise<string[]> {
  // This would integrate with a stock image API or internal image search
  // For now, return empty array - would implement with Unsplash, Pexels, or similar
  return []
}

/**
 * Get image generation cost estimate
 */
export function getImageGenerationCost(
  numberOfImages: number,
  quality: 'standard' | 'hd' = 'standard',
  size: string = '1024x1024'
): number {
  // OpenAI DALL-E 3 pricing (as of 2024)
  const baseCost = quality === 'hd' ? 0.08 : 0.04

  // Adjust for size
  const sizeMultiplier = {
    '1024x1024': 1,
    '1792x1024': 1.5,
    '1024x1792': 1.5,
    '512x512': 0.5,
    '256x256': 0.25
  }

  return numberOfImages * baseCost * (sizeMultiplier[size as keyof typeof sizeMultiplier] || 1)
}

export async function generateImageWithGatewayGemini(
  options: GatewayGeminiImageOptions
): Promise<GatewayGeminiImageResponse> {
  const {
    prompt,
    previousPrompt,
    editInstructions,
    size = '1024x1024',
    aspectRatio,
    n = 1,
    seed,
    abortTimeoutMs = 45000,
  } = options

  const promptParts = [prompt]
  if (previousPrompt) {
    promptParts.push(`Previous prompt: ${previousPrompt}`)
  }
  if (editInstructions) {
    promptParts.push(`Refinement request: ${editInstructions}`)
  }

  const details: string[] = []
  if (size) details.push(`Target size: ${size}`)
  if (aspectRatio) details.push(`Aspect ratio: ${aspectRatio}`)
  if (n && n > 1) details.push(`Number of images: ${n}`)
  if (seed !== undefined) details.push(`Seed: ${seed}`)
  if (details.length) {
    promptParts.push(details.join(' | '))
  }

  const finalPrompt = promptParts.filter(Boolean).join('\n\n').trim()

  const model = vercelGateway.languageModel('google/gemini-2.5-flash-image')

  const result = await generateText({
    model,
    prompt: finalPrompt,
    abortSignal: AbortSignal.timeout(abortTimeoutMs),
  })

  const fileImages = (result.files || []).filter(f => f.mediaType?.startsWith('image/'))

  if (!fileImages.length) {
    throw new Error('No image generated from gateway Gemini')
  }

  const images: GatewayGeminiImageResult[] = fileImages.map((file, index) => {
    const mediaType = file.mediaType || 'image/png'
    const base64 = (file as any).base64
      || ((file as any).uint8Array ? Buffer.from((file as any).uint8Array).toString('base64') : '')

    if (!base64) {
      throw new Error('Image payload missing base64 data')
    }

    return {
      id: `gemini-gateway-${Date.now()}-${index}`,
      base64,
      dataUrl: `data:${mediaType};base64,${base64}`,
      mediaType,
    }
  })

  return {
    prompt: finalPrompt,
    images,
    warnings: (result as any).warnings,
    providerMetadata: (result as any).providerMetadata,
  }
}

// ============================================================================
// GEMINI 2.5 FLASH IMAGE GENERATION
// ============================================================================

/**
 * Generate image using Google Gemini 2.5 Flash Image
 * Optimized for article writers who need custom images
 */
export async function generateImageWithGemini(
  request: GeminiImageRequest
): Promise<GeminiGeneratedImage> {
  // Dynamic import for optional dependency
  const { GoogleGenAI } = await import('@google/genai')
  
  try {
    const { prompt, size = 'medium', style = 'realistic', type = 'blog' } = request

    // Build enhanced prompt for better results
    const styleModifiers = {
      realistic: 'photorealistic, high quality, detailed, professional photography',
      artistic: 'artistic, creative, stylized, visually appealing, digital art',
      illustrated: 'illustrated, clean design, vector-style, minimal, flat design',
      photographic: 'photographic style, natural lighting, high resolution, DSLR quality',
    }

    const typeModifiers = {
      blog: 'suitable for blog posts, educational content, informative',
      social: 'engaging, shareable, eye-catching, social media optimized',
      product: 'professional product photography, clean background, commercial quality',
      infographic: 'clear data visualization, charts and graphs, informative design',
      custom: 'custom style, unique design, tailored to specific needs',
    }

    const enhancedPrompt = `${prompt}. Style: ${styleModifiers[style]}. Purpose: ${typeModifiers[type]}. High quality, professional, optimized for ${type} content.`

    console.log(`[GeminiImageGen] Generating image with enhanced prompt`)

    // Initialize Google GenAI
    const ai = new GoogleGenAI({
      apiKey: serverEnv.GOOGLE_CLOUD_API_KEY || serverEnv.GOOGLE_API_KEY,
    })

    const generationConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ['TEXT', 'IMAGE'],
    }

    const req = {
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      config: generationConfig,
    }

    const response = await ai.models.generateContent(req)
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No images were generated by Gemini')
    }

    // Extract image from response
    const candidate = response.candidates[0]
    if (!candidate.content?.parts) {
      throw new Error('No content parts found in response')
    }
    const imagePart = candidate.content.parts.find((part: any) => part.inlineData)

    if (!imagePart || !imagePart.inlineData) {
      throw new Error('No image data found in response')
    }

    // Convert base64 to Uint8Array
    const base64Data = imagePart.inlineData.data
    if (!base64Data) {
      throw new Error('No image data found in response')
    }
    const binaryString = atob(base64Data)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }

    const generatedImage: GeminiGeneratedImage = {
      id: `gemini-${Date.now()}`,
      data: uint8Array,
      mediaType: imagePart.inlineData.mimeType || 'image/png',
      prompt: request.prompt,
      timestamp: Date.now(),
    }

    console.log(`[GeminiImageGen] Successfully generated image`)
    return generatedImage
  } catch (error: any) {
    console.error('[GeminiImageGen] Error:', error)
    throw new Error(`Failed to generate image with Gemini: ${error.message}`)
  }
}

/**
 * Edit an existing image using Gemini 2.5 Flash
 */
export async function editImageWithGemini(
  imageUrl: string,
  editPrompt: string
): Promise<GeminiGeneratedImage> {
  try {
    console.log(`[GeminiImageGen] Editing image with prompt: ${editPrompt}`)

    const result = await generateText({
      model: google('gemini-2.5-flash-image-preview') as any,
      prompt: `${editPrompt}. Maintain the original composition and quality.
              Make precise, natural-looking changes. High resolution output.`,
      maxOutputTokens: 1000,
      experimental_telemetry: createTelemetryConfig('image-edit', {
        provider: 'google',
        model: 'gemini-2.5-flash-image-preview',
      }),
    })

    // Note: In AI SDK v5, image editing might need to be done differently
    // For now, this is a placeholder - actual implementation would depend on provider capabilities
    throw new Error('Image editing not yet implemented in AI SDK v5')
  } catch (error: any) {
    console.error('[GeminiImageGen] Error:', error)
    throw new Error(`Failed to edit image with Gemini: ${error.message}`)
  }
}

/**
 * Generate multiple images with different styles
 */
export async function generateImageVariationsWithGemini(
  basePrompt: string,
  styles: Array<GeminiImageRequest['style']> = ['realistic', 'artistic', 'illustrated']
): Promise<GeminiGeneratedImage[]> {
  const results = await Promise.allSettled(
    styles.map(style =>
      generateImageWithGemini({
        prompt: basePrompt,
        style,
        type: 'blog',
        size: 'medium'
      })
    )
  )

  const successful: GeminiGeneratedImage[] = []
  const failed: { style: string; error: string }[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value)
    } else {
      failed.push({
        style: styles[index] || 'unknown',
        error: result.reason.message,
      })
    }
  })

  console.log(
    `[GeminiImageGen] Generated ${successful.length} variations (${failed.length} failed)`
  )

  return successful
}

// SEOPrompts is now exported from image-generation-types.ts