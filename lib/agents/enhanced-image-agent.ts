/**
 * Enhanced Image Agent
 * Generates complete article image sets with hero, sections, infographics, and social variants
 */

import { Buffer } from 'node:buffer'
import { generateText, generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'
import { createTelemetryConfig } from '@/lib/observability/langfuse'
import { db } from '@/lib/db'
// TODO: Re-implement image generation
// import { generateImageWithGatewayGemini } from '@/lib/ai/image-generation'
import type {
  ArticleImageSet,
  ArticleImageSetParams,
  ContentImageAnalysis,
  ContentSection,
  StatisticalData,
  HeroImage,
  SectionImage,
  InfographicImage,
  SocialMediaVariants,
  ImageMetadata,
  BrandVisualGuidelines,
  ImageType,
  ContentMood,
  GeneratedImageWithMetadata,
} from '@/types/images'

const google = createGoogleGenerativeAI({
  apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GOOGLE_API_KEY,
})

/**
 * Enhanced Image Agent for generating complete article image sets
 */
export class EnhancedImageAgent {

  /**
   * Generate a complete image set for an article
   */
  async generateArticleImageSet(params: ArticleImageSetParams): Promise<ArticleImageSet> {
    console.log('[Enhanced Image Agent] Generating article image set for:', params.topic)

    // 1. Analyze content structure
    const contentAnalysis = await this.analyzeContentForImages(params.content)

    // 2. Generate hero image
    const heroImage = await this.generateHeroImage({
      topic: params.topic,
      mood: contentAnalysis.overallMood,
      brandColors: params.brandGuidelines?.primaryColors,
      aspectRatio: '16:9',
      keywords: params.keywords,
    })

    // 3. Generate section images
    const sectionImages = await Promise.all(
      contentAnalysis.sections
        .filter(s => s.needsImage)
        .map(section => this.generateSectionImage({
          heading: section.heading,
          content: section.content,
          type: section.suggestedImageType || 'illustration',
          targetHeading: section.heading,
          keywords: params.keywords,
        }))
    )

    // 4. Generate infographics for data/statistics
    const infographics = await Promise.all(
      contentAnalysis.statistics.map(stat =>
        this.generateInfographic({
          data: stat.data,
          type: stat.bestVisualization,
          brandColors: params.brandGuidelines?.primaryColors,
          keywords: params.keywords,
          label: stat.label,
        })
      )
    )

    // 5. Generate social media variants
    const socialImages = await this.generateSocialVariants({
      heroImage,
      title: contentAnalysis.title,
      brandLogo: params.brandGuidelines?.logoUrl,
      keywords: params.keywords,
    })

    // 6. Generate metadata (alt texts, filenames, captions)
    const allImages: GeneratedImageWithMetadata[] = [
      heroImage,
      ...sectionImages,
      ...infographics,
    ]

    const metadata: ImageMetadata = {
      altTexts: await this.generateAltTexts(allImages, params.keywords),
      fileNames: this.generateSEOFileNames(params.keywords, allImages),
      captions: await this.generateCaptions(allImages),
    }

    return {
      hero: heroImage,
      sections: sectionImages,
      infographics,
      social: socialImages,
      metadata,
    }
  }

  /**
   * Analyze content and suggest where images should go
   */
  async analyzeContentForImages(content: string): Promise<ContentImageAnalysis> {
    console.log('[Enhanced Image Agent] Analyzing content for image placement')

    // Parse content structure
    const sections = this.parseContentSections(content)

    // Identify statistics and data points
    const statistics = this.extractStatistics(content)

    // Use AI to analyze content mood and suggest image types
    const analysisPrompt = `Analyze this article content and provide image placement recommendations:

${content.substring(0, 3000)}

For each major section (H2 level), determine:
1. Does it need an image? (yes/no)
2. What type of image would be most effective? (hero, illustration, diagram, photo, infographic, chart, comparison, process)
3. What should the image show?

Also identify:
- Overall content mood (professional, friendly, technical, inspirational, informative, casual)
- Any statistics or data that should be visualized
- Title of the article

Return as JSON.`

    const analysisSchema = z.object({
      title: z.string(),
      overallMood: z.enum(['professional', 'friendly', 'technical', 'inspirational', 'informative', 'casual']),
      sections: z.array(z.object({
        heading: z.string(),
        needsImage: z.boolean(),
        suggestedImageType: z.enum(['hero', 'illustration', 'diagram', 'photo', 'infographic', 'chart', 'comparison', 'process']).optional(),
        suggestedPrompt: z.string().optional(),
      })),
      statistics: z.array(z.object({
        data: z.record(z.union([z.number(), z.string()])),
        type: z.enum(['bar', 'pie', 'timeline', 'comparison', 'trend']),
        bestVisualization: z.enum(['bar', 'pie', 'timeline', 'comparison', 'trend']),
        sourceData: z.string(),
        label: z.string(),
      })).optional(),
    })

    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-pro') as any,
        prompt: analysisPrompt,
        schema: analysisSchema,
        experimental_telemetry: createTelemetryConfig('content-image-analysis', {
          contentLength: content.length,
        }),
      })

      // Merge AI suggestions with parsed sections
      const enhancedSections: ContentSection[] = sections.map(section => {
        const aiSuggestion = object.sections.find(s =>
          s.heading.toLowerCase() === section.heading.toLowerCase()
        )

        return {
          ...section,
          needsImage: aiSuggestion?.needsImage ?? this.shouldHaveImage(section),
          suggestedImageType: aiSuggestion?.suggestedImageType || this.suggestImageType(section),
          suggestedPrompt: aiSuggestion?.suggestedPrompt || this.generateImagePrompt(section),
        }
      })

      return {
        title: object.title || this.extractTitle(content),
        overallMood: object.overallMood,
        sections: enhancedSections,
        statistics: object.statistics || statistics,
      }
    } catch (error) {
      console.error('[Enhanced Image Agent] AI analysis failed, using fallback:', error)
      // Fallback to rule-based analysis
      return {
        title: this.extractTitle(content),
        overallMood: this.analyzeContentMood(content),
        sections: sections.map(s => ({
          ...s,
          needsImage: this.shouldHaveImage(s),
          suggestedImageType: this.suggestImageType(s),
          suggestedPrompt: this.generateImagePrompt(s),
        })),
        statistics,
      }
    }
  }

  /**
   * Parse content into sections based on headings
   */
  private parseContentSections(content: string): ContentSection[] {
    const sections: ContentSection[] = []

    // Match markdown headings (# H1, ## H2, etc.) or HTML headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const htmlHeadingRegex = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi

    let lastIndex = 0
    let currentLevel = 1

    // Process markdown headings
    let match
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const heading = match[2].trim()
      const startIndex = match.index

      // Get content between this heading and next
      const nextMatch = headingRegex.exec(content)
      const endIndex = nextMatch ? nextMatch.index : content.length
      headingRegex.lastIndex = match.index + match[0].length // Reset for next iteration

      const sectionContent = content.substring(startIndex + match[0].length, endIndex).trim()

      sections.push({
        heading,
        content: sectionContent,
        level,
        needsImage: false, // Will be determined later
        targetHeading: heading,
      })

      lastIndex = endIndex
    }

    // If no markdown headings found, try HTML
    if (sections.length === 0) {
      let htmlMatch
      while ((htmlMatch = htmlHeadingRegex.exec(content)) !== null) {
        const tag = htmlMatch[1]
        const level = parseInt(tag.charAt(1))
        const heading = htmlMatch[2].trim()

        sections.push({
          heading,
          content: '', // Would need more parsing for HTML
          level,
          needsImage: false,
          targetHeading: heading,
        })
      }
    }

    // If still no sections, create one from the whole content
    if (sections.length === 0) {
      sections.push({
        heading: 'Introduction',
        content,
        level: 1,
        needsImage: false,
        targetHeading: 'Introduction',
      })
    }

    return sections
  }

  /**
   * Extract title from content
   */
  private extractTitle(content: string): string {
    // Try to find H1 or first line
    const h1Match = content.match(/^#\s+(.+)$/m)
    if (h1Match) return h1Match[1].trim()

    const htmlH1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i)
    if (htmlH1Match) return htmlH1Match[1].trim()

    // Use first line or first 60 chars
    const firstLine = content.split('\n')[0].trim()
    return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine
  }

  /**
   * Analyze content mood
   */
  private analyzeContentMood(content: string): ContentMood {
    const lowerContent = content.toLowerCase()

    // Simple keyword-based mood detection
    if (lowerContent.includes('how to') || lowerContent.includes('tutorial') || lowerContent.includes('step')) {
      return 'informative'
    }
    if (lowerContent.includes('best') || lowerContent.includes('top') || lowerContent.includes('review')) {
      return 'friendly'
    }
    if (lowerContent.includes('api') || lowerContent.includes('code') || lowerContent.includes('technical')) {
      return 'technical'
    }
    if (lowerContent.includes('success') || lowerContent.includes('achieve') || lowerContent.includes('inspire')) {
      return 'inspirational'
    }

    return 'professional'
  }

  /**
   * Determine if a section should have an image
   */
  private shouldHaveImage(section: ContentSection): boolean {
    // Sections with substantial content (>200 chars) benefit from images
    if (section.content.length < 200) return false

    // H2 and H3 sections are good candidates
    if (section.level <= 3) return true

    // Check for visual indicators
    const visualKeywords = ['show', 'illustrate', 'diagram', 'chart', 'graph', 'visual', 'image', 'picture']
    const hasVisualKeywords = visualKeywords.some(keyword =>
      section.content.toLowerCase().includes(keyword)
    )

    return hasVisualKeywords
  }

  /**
   * Suggest image type for a section
   */
  private suggestImageType(section: ContentSection): ImageType {
    const content = section.content.toLowerCase()

    if (content.includes('step') || content.includes('process') || content.includes('workflow')) {
      return 'process'
    }
    if (content.includes('compare') || content.includes('vs') || content.includes('versus')) {
      return 'comparison'
    }
    if (content.includes('chart') || content.includes('graph') || content.includes('data')) {
      return 'chart'
    }
    if (content.includes('diagram') || content.includes('structure') || content.includes('architecture')) {
      return 'diagram'
    }
    if (content.match(/\d+%/) || content.match(/\$\d+/) || content.match(/\d+\s*(million|billion|thousand)/)) {
      return 'infographic'
    }

    return 'illustration'
  }

  /**
   * Generate image prompt for a section
   */
  private generateImagePrompt(section: ContentSection): string {
    const type = section.suggestedImageType || 'illustration'
    const heading = section.heading

    const prompts: Record<ImageType, string> = {
      hero: `Professional hero image for: ${heading}. Modern, engaging design.`,
      illustration: `Clean illustration showing: ${heading}. Professional, modern style.`,
      diagram: `Technical diagram illustrating: ${heading}. Clear labels, professional design.`,
      photo: `Professional photograph related to: ${heading}. High quality, relevant.`,
      infographic: `Infographic about: ${heading}. Data visualization, clear design.`,
      chart: `Chart showing data for: ${heading}. Clean, professional data visualization.`,
      comparison: `Comparison visual for: ${heading}. Side-by-side layout, clear differentiation.`,
      process: `Process diagram for: ${heading}. Step-by-step visual guide.`,
    }

    return prompts[type] || prompts.illustration
  }

  /**
   * Extract statistics from content
   */
  private extractStatistics(content: string): StatisticalData[] {
    const statistics: StatisticalData[] = []

    // Match percentage patterns: "45%", "45 percent"
    const percentRegex = /(\d+(?:\.\d+)?)\s*%/g
    let match
    while ((match = percentRegex.exec(content)) !== null) {
      statistics.push({
        data: { value: parseFloat(match[1]), unit: '%' },
        type: 'bar',
        bestVisualization: 'bar',
        sourceData: match[0],
        label: `${match[1]}%`,
      })
    }

    // Match dollar amounts: "$1,000", "$1M"
    const dollarRegex = /\$(\d+(?:,\d+)*(?:\.\d+)?)\s*(M|B|K|million|billion|thousand)?/gi
    while ((match = dollarRegex.exec(content)) !== null) {
      statistics.push({
        data: { value: match[1], unit: match[2] || 'USD' },
        type: 'bar',
        bestVisualization: 'bar',
        sourceData: match[0],
        label: match[0],
      })
    }

    // Match large numbers that might be statistics
    const numberRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+(million|billion|thousand|users|customers|visitors)/gi
    while ((match = numberRegex.exec(content)) !== null) {
      statistics.push({
        data: { value: match[1], unit: match[2] },
        type: 'bar',
        bestVisualization: 'bar',
        sourceData: match[0],
        label: match[0],
      })
    }

    return statistics.slice(0, 5) // Limit to 5 statistics
  }

  /**
   * Generate hero image
   */
  async generateHeroImage(params: {
    topic: string
    mood: ContentMood
    brandColors?: string[]
    aspectRatio: '16:9'
    keywords: string[]
  }): Promise<HeroImage> {
    console.log('[Enhanced Image Agent] Generating hero image')

    const prompt = `Professional hero image for article about: ${params.topic}. 
Style: ${params.mood}, modern, engaging. 
${params.brandColors ? `Brand colors: ${params.brandColors.join(', ')}.` : ''}
High quality, suitable for blog header.`

    const result = await generateImageWithGatewayGemini({
      prompt,
      size: '1792x1024', // 16:9 aspect ratio
      aspectRatio: '16:9',
      n: 1,
    })

    const image = result.images[0]
    if (!image) {
      throw new Error('Failed to generate hero image')
    }

    // Upload to Neon/S3 storage
    const fileName = `hero/${Date.now()}-${this.slugify(params.topic)}.png`
    const imageBuffer = Buffer.from(image.base64, 'base64')

    // TODO: Implement file storage using AWS S3 or similar
    // For now, return image data in memory
    const publicUrl = `data:image/png;base64,${image.base64}`

    return {
      id: fileName,
      url: publicUrl,
      altText: `Hero image for ${params.topic}`,
      caption: `Featured image for ${params.topic}`,
      metadata: {
        prompt: result.prompt,
        style: params.mood,
        size: '1792x1024',
        provider: 'gemini-gateway',
        generatedAt: new Date().toISOString(),
      },
      fileName,
      width: 1792,
      height: 1024,
      imageType: 'hero',
      aspectRatio: '16:9',
    }
  }

  /**
   * Generate section image
   */
  async generateSectionImage(params: {
    heading: string
    content: string
    type: ImageType
    targetHeading: string
    keywords: string[]
  }): Promise<SectionImage> {
    console.log('[Enhanced Image Agent] Generating section image for:', params.heading)

    const prompt = this.generateImagePrompt({
      heading: params.heading,
      content: params.content,
      level: 2,
      needsImage: true,
      suggestedImageType: params.type,
      targetHeading: params.heading,
    })

    const result = await generateImageWithGatewayGemini({
      prompt,
      size: '1024x1024',
      aspectRatio: '1:1',
      n: 1,
    })

    const image = result.images[0]
    if (!image) {
      throw new Error('Failed to generate section image')
    }

    const fileName = `sections/${Date.now()}-${this.slugify(params.heading)}.png`
    const imageBuffer = Buffer.from(image.base64, 'base64')

    // TODO: Implement file storage using AWS S3 or similar
    // For now, return image data in memory
    const publicUrl = `data:image/png;base64,${image.base64}`

    return {
      id: fileName,
      url: publicUrl,
      altText: `Image illustrating ${params.heading}`,
      caption: params.heading,
      metadata: {
        prompt: result.prompt,
        style: params.type,
        size: '1024x1024',
        provider: 'gemini-gateway',
        generatedAt: new Date().toISOString(),
      },
      fileName,
      width: 1024,
      height: 1024,
      imageType: params.type === 'hero' ? 'photo' : params.type,
      targetHeading: params.targetHeading,
    }
  }

  /**
   * Generate infographic
   */
  async generateInfographic(params: {
    data: Record<string, number | string>
    type: 'bar' | 'pie' | 'timeline' | 'comparison' | 'trend'
    brandColors?: string[]
    keywords: string[]
    label: string
  }): Promise<InfographicImage> {
    console.log('[Enhanced Image Agent] Generating infographic for:', params.label)

    const dataDescription = Object.entries(params.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')

    const prompt = `Professional infographic showing: ${params.label}. 
Data: ${dataDescription}. 
Visualization type: ${params.type} chart.
${params.brandColors ? `Use colors: ${params.brandColors.join(', ')}.` : ''}
Clean, modern design with clear labels.`

    const result = await generateImageWithGatewayGemini({
      prompt,
      size: '1024x1024',
      aspectRatio: '1:1',
      n: 1,
    })

    const image = result.images[0]
    if (!image) {
      throw new Error('Failed to generate infographic')
    }

    const fileName = `infographics/${Date.now()}-${this.slugify(params.label)}.png`
    const imageBuffer = Buffer.from(image.base64, 'base64')

    // TODO: Implement file storage using AWS S3 or similar
    // For now, return image data in memory
    const publicUrl = `data:image/png;base64,${image.base64}`

    return {
      id: fileName,
      url: publicUrl,
      altText: `Infographic showing ${params.label}`,
      caption: params.label,
      metadata: {
        prompt: result.prompt,
        style: 'infographic',
        size: '1024x1024',
        provider: 'gemini-gateway',
        generatedAt: new Date().toISOString(),
      },
      fileName,
      width: 1024,
      height: 1024,
      imageType: 'infographic',
      dataVisualization: {
        data: params.data,
        type: params.type,
        bestVisualization: params.type,
        sourceData: dataDescription,
        label: params.label,
      },
    }
  }

  /**
   * Generate social media variants
   */
  private async generateSocialVariants(params: {
    heroImage: HeroImage
    title: string
    brandLogo?: string
    keywords: string[]
  }): Promise<SocialMediaVariants> {
    console.log('[Enhanced Image Agent] Generating social media variants')

    // For now, we'll create variants by resizing/cropping the hero image
    // In production, you might want to generate separate images with text overlays

    const basePrompt = `Social media image for: ${params.title}. 
${params.brandLogo ? `Include brand logo.` : ''}
Eye-catching, shareable design optimized for social platforms.`

    // Generate Open Graph (1200x630)
    const ogResult = await generateImageWithGatewayGemini({
      prompt: `${basePrompt} Format: Open Graph (1200x630).`,
      size: '1792x1024', // Closest available, will be cropped
      aspectRatio: '16:9',
      n: 1,
    })

    // Generate Twitter (1200x675)
    const twitterResult = await generateImageWithGatewayGemini({
      prompt: `${basePrompt} Format: Twitter card (1200x675).`,
      size: '1792x1024',
      aspectRatio: '16:9',
      n: 1,
    })

    // Generate Pinterest (1000x1500)
    const pinterestResult = await generateImageWithGatewayGemini({
      prompt: `${basePrompt} Format: Pinterest pin (1000x1500).`,
      size: '1024x1792',
      aspectRatio: '9:16',
      n: 1,
    })

    // Generate Instagram (1080x1080)
    const instagramResult = await generateImageWithGatewayGemini({
      prompt: `${basePrompt} Format: Instagram post (1080x1080).`,
      size: '1024x1024',
      aspectRatio: '1:1',
      n: 1,
    })

    const uploadImage = async (
      imageResult: { images: Array<{ base64: string; mediaType?: string }>; prompt: string },
      platform: string,
      dimensions: { width: number; height: number }
    ): Promise<GeneratedImageWithMetadata> => {
      const image = imageResult.images[0]
      if (!image) {
        throw new Error(`Failed to generate ${platform} image`)
      }

      const fileName = `social/${platform}/${Date.now()}-${this.slugify(params.title)}.png`
      const imageBuffer = Buffer.from(image.base64, 'base64')

      // TODO: Implement file storage using AWS S3 or similar
      // For now, return image data in memory
      const publicUrl = `data:${image.mediaType || 'image/png'};base64,${image.base64}`

      return {
        id: fileName,
        url: publicUrl,
        altText: `${platform} image for ${params.title}`,
        caption: params.title,
        metadata: {
          prompt: imageResult.prompt,
          style: 'social',
          size: `${dimensions.width}x${dimensions.height}`,
          provider: 'gemini-gateway',
          generatedAt: new Date().toISOString(),
        },
        fileName,
        width: dimensions.width,
        height: dimensions.height,
        imageType: 'hero' as ImageType,
      }
    }

    return {
      og: await uploadImage(ogResult, 'og', { width: 1200, height: 630 }),
      twitter: await uploadImage(twitterResult, 'twitter', { width: 1200, height: 675 }),
      pinterest: await uploadImage(pinterestResult, 'pinterest', { width: 1000, height: 1500 }),
      instagram: await uploadImage(instagramResult, 'instagram', { width: 1080, height: 1080 }),
    }
  }

  /**
   * Generate SEO-optimized alt texts
   */
  private async generateAltTexts(
    images: GeneratedImageWithMetadata[],
    keywords: string[]
  ): Promise<Map<string, string>> {
    const altTexts = new Map<string, string>()

    for (const image of images) {
      const prompt = `Generate descriptive alt text for this image in an SEO article.

Image type: ${image.imageType}
${image.targetHeading ? `Section heading: ${image.targetHeading}` : ''}
Primary keywords: ${keywords.slice(0, 3).join(', ')}

Requirements:
1. Be descriptive and specific
2. Include relevant keywords naturally
3. Keep under 125 characters
4. Focus on what's visually depicted
5. Don't start with "image of" or "picture of"

Return only the alt text, no quotes or explanations.`

      try {
        const result = await generateText({
          model: google('gemini-2.5-pro') as any,
          prompt,
          experimental_telemetry: createTelemetryConfig('image-alt-text-generation', {
            imageType: image.imageType,
          }),
        })

        const altText = (result.text || image.altText || 'Article image').substring(0, 125)
        altTexts.set(image.id, altText)
      } catch (error) {
        console.error('[Enhanced Image Agent] Failed to generate alt text:', error)
        altTexts.set(image.id, image.altText || 'Article image')
      }
    }

    return altTexts
  }

  /**
   * Generate SEO-friendly file names
   */
  private generateSEOFileNames(
    keywords: string[],
    images: GeneratedImageWithMetadata[]
  ): Map<string, string> {
    const fileNames = new Map<string, string>()
    const primaryKeyword = keywords[0] || 'image'

    images.forEach((image, index) => {
      const baseName = this.slugify(primaryKeyword)
      const imageType = image.imageType === 'hero' ? 'hero' :
        image.imageType === 'infographic' ? 'infographic' :
          'section'
      const suffix = index > 0 ? `-${index + 1}` : ''
      const extension = image.fileName.split('.').pop() || 'png'

      const fileName = `${baseName}-${imageType}${suffix}.${extension}`
      fileNames.set(image.id, fileName)
    })

    return fileNames
  }

  /**
   * Generate captions for images
   */
  private async generateCaptions(images: GeneratedImageWithMetadata[]): Promise<Map<string, string>> {
    const captions = new Map<string, string>()

    for (const image of images) {
      // Use existing caption or generate from heading/title
      if (image.caption) {
        captions.set(image.id, image.caption)
      } else if (image.targetHeading) {
        captions.set(image.id, image.targetHeading)
      } else {
        captions.set(image.id, 'Article image')
      }
    }

    return captions
  }

  /**
   * Convert string to URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
  }
}

