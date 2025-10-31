import { generateObject, generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

// Initialize AI providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Supabase client for storing generated images
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ImageGenerationOptions {
  prompt: string
  style?: 'realistic' | 'illustration' | 'diagram' | 'infographic' | 'abstract'
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  numberOfImages?: number
  articleContext?: {
    title: string
    content: string
    targetKeyword: string
    brandVoice?: string
  }
}

export interface GeneratedImage {
  id: string
  url: string
  altText: string
  caption?: string
  metadata: {
    prompt: string
    style: string
    size: string
    provider: string
    generatedAt: string
  }
}

export interface ImageSuggestion {
  type: 'hero' | 'infographic' | 'diagram' | 'illustration' | 'chart'
  prompt: string
  description: string
  placement: 'top' | 'middle' | 'bottom' | 'inline'
  priority: 'high' | 'medium' | 'low'
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

    const { object } = await generateObject({
      model: google('gemini-2.5-pro'),
      prompt,
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['hero', 'infographic', 'diagram', 'illustration', 'chart'] },
            prompt: { type: 'string' },
            description: { type: 'string' },
            placement: { type: 'string', enum: ['top', 'middle', 'bottom', 'inline'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          required: ['type', 'prompt', 'description', 'placement', 'priority']
        }
      }
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
    const { text } = await generateObject({
      model: google('gemini-2.5-pro'),
      prompt: contextualPrompt,
      schema: { type: 'string' }
    })

    return text as string
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
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
      const imageBuffer = await fetch(image.url).then(res => res.buffer())
      const fileName = `generated/${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '31536000', // 1 year cache
        })

      if (uploadError) {
        console.error('Failed to upload image to Supabase:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
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

    const { text } = await generateObject({
      model: google('gemini-2.5-pro'),
      prompt: altPrompt,
      schema: { type: 'string' }
    })

    return (text as string).substring(0, 125)
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

// ============================================================================
// GEMINI 2.5 FLASH IMAGE GENERATION
// ============================================================================

export interface GeminiImageRequest {
  prompt: string
  size?: 'small' | 'medium' | 'large'
  style?: 'realistic' | 'artistic' | 'illustrated' | 'photographic'
  type?: 'blog' | 'social' | 'product' | 'infographic' | 'custom'
}

export interface GeminiGeneratedImage {
  id: string
  data: Uint8Array
  mediaType: string
  prompt: string
  timestamp: number
}

/**
 * Generate image using Google Gemini 2.5 Flash Image
 * Optimized for article writers who need custom images
 */
export async function generateImageWithGemini(
  request: GeminiImageRequest
): Promise<GeminiGeneratedImage> {
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

    const sizeSpecs = {
      small: '512x512',
      medium: '1024x1024',
      large: '1792x1024',
    }

    const enhancedPrompt = `${prompt}. Style: ${styleModifiers[style]}. Purpose: ${typeModifiers[type]}.
    Dimensions: ${sizeSpecs[size]}. High quality, professional, optimized for ${type} content.`

    console.log(`[GeminiImageGen] Generating image with enhanced prompt`)

    const result = await generateText({
      model: google('gemini-2.5-flash-image-preview'),
      prompt: enhancedPrompt,
      maxTokens: 1000,
    })

    if (!result.files || result.files.length === 0) {
      throw new Error('No images were generated by Gemini')
    }

    // Process the first generated image
    const file = result.files.find(f => f.mediaType?.startsWith('image/'))
    if (!file) {
      throw new Error('Generated file is not an image')
    }

    const generatedImage: GeminiGeneratedImage = {
      id: `gemini-${Date.now()}`,
      data: file.uint8Array,
      mediaType: file.mediaType,
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
      model: google('gemini-2.5-flash-image-preview'),
      prompt: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${editPrompt}. Maintain the original composition and quality.
              Make precise, natural-looking changes. High resolution output.`,
            },
            {
              type: 'image',
              image: imageUrl,
              mediaType: 'image/jpeg',
            },
          ],
        },
      ],
      maxTokens: 1000,
    })

    if (!result.files || result.files.length === 0) {
      throw new Error('No edited images were generated')
    }

    const file = result.files.find(f => f.mediaType?.startsWith('image/'))
    if (!file) {
      throw new Error('Generated file is not an image')
    }

    const editedImage: GeminiGeneratedImage = {
      id: `gemini-edit-${Date.now()}`,
      data: file.uint8Array,
      mediaType: file.mediaType,
      prompt: editPrompt,
      timestamp: Date.now(),
    }

    console.log(`[GeminiImageGen] Successfully edited image`)
    return editedImage
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
        style: styles[index],
        error: result.reason.message,
      })
    }
  })

  console.log(
    `[GeminiImageGen] Generated ${successful.length} variations (${failed.length} failed)`
  )

  return successful
}

/**
 * SEO-optimized image prompts for common article types
 */
export const SEOPrompts = {
  blogFeatured: (topic: string, keywords: string[] = []) =>
    `Professional blog featured image for: ${topic}.
     Include keywords: ${keywords.join(', ')}.
     Clean, modern design with space for text overlay.
     High quality, professional appearance.`,

  socialShare: (title: string, brand?: string) =>
    `Social media shareable image for: "${title}".
     ${brand ? `Brand: ${brand}.` : ''}
     Eye-catching, engaging design optimized for social media.
     Vibrant colors, clear typography, share-friendly.`,

  productShowcase: (product: string, features: string[] = []) =>
    `Product showcase image for: ${product}.
     Features: ${features.join(', ')}.
     Clean white background, professional product photography,
     commercial quality, e-commerce optimized.`,

  infographic: (topic: string, dataPoints: string[] = []) =>
    `Infographic about: ${topic}.
     Data: ${dataPoints.join(', ')}.
     Clean data visualization, charts and graphs,
     informative design with clear hierarchy.`,

  howTo: (title: string, steps: string[] = []) =>
    `How-to illustration for: ${title}.
     Steps: ${steps.slice(0, 3).join(', ')}.
     Step-by-step visual guide, instructional design.`,

  comparison: (item1: string, item2: string, category: string) =>
    `Comparison between ${item1} vs ${item2} in ${category}.
     Split-screen layout, clear differentiation,
     professional design, easy to understand.`,
}
