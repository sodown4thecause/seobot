/**
 * Image Generation Service - Client-safe exports
 * 
 * This module re-exports types from image-generation-types.ts and provides
 * client-safe stub functions. Actual image generation should be done through
 * API routes that use the server-only implementation.
 */

// Re-export all types for client components
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
} from './image-generation-types'

/**
 * Generate contextual image suggestions based on article content
 * Calls the server-side API endpoint
 */
export async function generateImageSuggestions(
  title: string,
  content: string,
  targetKeyword: string
): Promise<ImageSuggestion[]> {
  try {
    const response = await fetch('/api/images/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, targetKeyword }),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate suggestions: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to generate image suggestions:', error)
    // Return placeholder suggestions for graceful degradation
    return [
      {
        type: 'hero',
        prompt: `Professional hero image for article: ${title}`,
        description: 'A compelling featured image that captures the main theme',
        placement: 'top',
        priority: 'high',
      },
      {
        type: 'infographic',
        prompt: `Infographic showing key points about ${targetKeyword}`,
        description: 'Visual representation of the main concepts',
        placement: 'middle',
        priority: 'medium',
      },
    ]
  }
}

/**
 * Generate images using configured provider
 * Note: This function calls server-side API endpoint
 */
export async function generateImageWithOpenAI(
  options: ImageGenerationOptions
): Promise<GeneratedImage[]> {
  try {
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || 'Failed to generate images')
    }

    const data = await response.json()
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    console.error('Failed to generate images:', error)
    throw error
  }
}

/**
 * Generate image using Gemini API
 * Note: This function calls server-side API endpoint
 */
export async function generateImageWithGemini(
  options: import('./image-generation-types').GeminiImageRequest
): Promise<import('./image-generation-types').GeminiGeneratedImage> {
  try {
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: options.prompt,
        size: options.size === 'large' ? '1024x1024' : options.size === 'medium' ? '512x512' : '256x256',
        style: options.style,
        type: options.type,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || 'Failed to generate image with Gemini')
    }

    const data = await response.json() as { url: string; altText?: string }
    const imageResponse = await fetch(data.url)
    const arrayBuffer = await imageResponse.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    return {
      id: `gemini-${Date.now()}`,
      data: uint8Array,
      mediaType: imageResponse.headers.get('content-type') || 'image/png',
      prompt: options.prompt,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Failed to generate image with Gemini:', error)
    throw error
  }
}

/**
 * Generate variations of an image with different styles
 */
export async function generateImageVariations(
  prompt: string,
  articleContext: ImageGenerationOptions['articleContext']
): Promise<GeneratedImage[]> {
  try {
    const response = await fetch('/api/images/variations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, articleContext }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || 'Failed to generate variations')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to generate image variations:', error)
    throw error
  }
}

/**
 * Calculate estimated cost for image generation
 */
export function getImageGenerationCost(
  numberOfImages: number = 1,
  quality: 'standard' | 'hd' = 'standard',
  size: string = '1024x1024'
): number {
  // Cost estimates based on typical AI image generation pricing
  const baseCosts: Record<string, number> = {
    '256x256': 0.016,
    '512x512': 0.018,
    '1024x1024': 0.020,
    '1792x1024': 0.040,
    '1024x1792': 0.040,
  }

  const baseCost = baseCosts[size] || 0.020
  const qualityMultiplier = quality === 'hd' ? 2 : 1

  return baseCost * qualityMultiplier * numberOfImages
}

// Legacy exports for backward compatibility
export interface ImageGenerationParams {
  prompt: string
  previousPrompt?: string
  editInstructions?: string
  size?: string
  aspectRatio?: string
  seed?: number
  n?: number
  abortTimeoutMs?: number
}

export interface ImageGenerationResponse {
  images: Array<{
    base64: string
    dataUrl: string
    mediaType: string
  }>
  prompt: string
  warnings?: string[]
}

/**
 * Generate images using Gemini API via gateway
 * @deprecated Use generateImageWithOpenAI or API routes instead
 */
export async function generateImageWithGatewayGemini(
  params: ImageGenerationParams
): Promise<ImageGenerationResponse> {
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      size: params.size || '1024x1024',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate image')
  }

  const data = await response.json()
  return {
    images: Array.isArray(data) ? data.map((img: GeneratedImage) => ({
      base64: '',
      dataUrl: img.url,
      mediaType: 'image/png',
    })) : [{
      base64: '',
      dataUrl: data.url,
      mediaType: 'image/png',
    }],
    prompt: params.prompt,
  }
}

/**
 * Generate alt text for images
 * @deprecated Use server-side implementation via API route
 */
export async function generateImageAltText(prompt: string): Promise<string> {
  return `AI-generated image: ${prompt.substring(0, 100)}`
}

/**
 * Analyze image content
 * @deprecated Use server-side implementation via API route
 */
export async function analyzeImageContent(imageUrl: string): Promise<Record<string, unknown>> {
  return {
    analyzed: false,
    message: 'Image analysis requires server-side processing',
    url: imageUrl,
  }
}
