/**
 * Client-safe types and constants for image generation
 * These can be imported in client components
 */

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

export interface GatewayGeminiImageOptions {
  prompt: string
  previousPrompt?: string
  editInstructions?: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16'
  n?: number
  seed?: number
  abortTimeoutMs?: number
}

export interface GatewayGeminiImageResult {
  id: string
  base64: string
  dataUrl: string
  mediaType: string
}

export interface GatewayGeminiImageResponse {
  prompt: string
  images: GatewayGeminiImageResult[]
  warnings?: any[]
  providerMetadata?: any
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

  socialMedia: (message: string, platform: string = 'general') =>
    `Social media graphic for ${platform}: ${message}.
     Eye-catching, share-worthy design.
     Bold colors, minimal text.
     Optimized for engagement.`,

  tutorial: (step: string, context: string = '') =>
    `Clear tutorial illustration showing: ${step}.
     ${context ? `For: ${context}.` : ''}
     Simple, easy to follow.
     Instructional diagram style.`,
}

