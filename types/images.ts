/**
 * Image Generation Types for Enhanced Image Agent
 * Comprehensive types for article image sets, social variants, and SEO optimization
 */

import type { GeneratedImage } from '@/lib/ai/image-generation-types'

/**
 * Brand visual guidelines for consistent image generation
 */
export interface BrandVisualGuidelines {
  primaryColors?: string[]
  secondaryColors?: string[]
  logoUrl?: string
  fontFamily?: string
  style?: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant'
}

/**
 * Content section analysis for image placement
 */
export interface ContentSection {
  heading: string
  content: string
  level: number // H1=1, H2=2, etc.
  needsImage: boolean
  suggestedImageType?: ImageType
  suggestedPrompt?: string
  targetHeading?: string // For matching images to headings
}

/**
 * Image type classification
 */
export type ImageType = 
  | 'hero' 
  | 'illustration' 
  | 'diagram' 
  | 'photo' 
  | 'infographic' 
  | 'chart' 
  | 'comparison'
  | 'process'

/**
 * Content mood analysis for image generation
 */
export type ContentMood = 
  | 'professional' 
  | 'friendly' 
  | 'technical' 
  | 'inspirational' 
  | 'informative' 
  | 'casual'

/**
 * Statistical data extracted from content for infographic generation
 */
export interface StatisticalData {
  data: Record<string, number | string>
  type: 'bar' | 'pie' | 'timeline' | 'comparison' | 'trend'
  bestVisualization: 'bar' | 'pie' | 'timeline' | 'comparison' | 'trend'
  sourceData: string // Original text where data was found
  label: string
}

/**
 * Content image analysis result
 */
export interface ContentImageAnalysis {
  title: string
  overallMood: ContentMood
  sections: ContentSection[]
  statistics: StatisticalData[]
}

/**
 * Generated image with enhanced metadata
 */
export interface GeneratedImageWithMetadata extends GeneratedImage {
  fileName: string
  width: number
  height: number
  webpUrl?: string
  jpgUrl?: string
  targetHeading?: string // For section images
  imageType: ImageType
  title?: string
}

/**
 * Hero image specific properties
 */
export interface HeroImage extends GeneratedImageWithMetadata {
  imageType: 'hero'
  aspectRatio?: '16:9' // Optional for backward compatibility
}

/**
 * Section image specific properties
 */
export interface SectionImage extends GeneratedImageWithMetadata {
  imageType: Exclude<ImageType, 'hero'>
  targetHeading: string
}

/**
 * Infographic image specific properties
 */
export interface InfographicImage extends GeneratedImageWithMetadata {
  imageType: 'infographic'
  dataVisualization: StatisticalData
}

/**
 * Social media variant images
 */
export interface SocialMediaVariants {
  og: GeneratedImageWithMetadata // Open Graph: 1200x630
  twitter: GeneratedImageWithMetadata // Twitter: 1200x675
  pinterest: GeneratedImageWithMetadata // Pinterest: 1000x1500
  instagram: GeneratedImageWithMetadata // Instagram: 1080x1080
}

/**
 * Image metadata for SEO optimization
 */
export interface ImageMetadata {
  altTexts: Map<string, string> // Map of image ID to alt text
  fileNames: Map<string, string> // Map of image ID to SEO-friendly filename
  captions: Map<string, string> // Map of image ID to caption
}

/**
 * Complete article image set
 */
export interface ArticleImageSet {
  hero: HeroImage
  sections: SectionImage[]
  infographics: InfographicImage[]
  social: SocialMediaVariants
  metadata: ImageMetadata
}

/**
 * Image placement strategy
 */
export type ImagePlacementStrategy = 'balanced' | 'dense' | 'minimal'

/**
 * Image generation parameters for article image set
 */
export interface ArticleImageSetParams {
  content: string
  topic: string
  keywords: string[]
  brandGuidelines?: BrandVisualGuidelines
}

/**
 * Image generation result with all variants
 */
export interface ImageGenerationResult {
  imageSet: ArticleImageSet
  analysis: ContentImageAnalysis
  generatedAt: Date
}

