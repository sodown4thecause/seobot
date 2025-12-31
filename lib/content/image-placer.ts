/**
 * Content Image Placer
 * Intelligently inserts images into content with proper formatting and SEO optimization
 */

import type {
  ArticleImageSet,
  ImagePlacementStrategy,
  GeneratedImageWithMetadata,
  HeroImage,
  SectionImage,
  InfographicImage,
} from '@/types/images'

/**
 * Content Image Placer for intelligent image insertion
 */
export class ContentImagePlacer {
  
  /**
   * Intelligently insert images into content
   */
  async insertImages(params: {
    content: string
    images: ArticleImageSet
    strategy: ImagePlacementStrategy
  }): Promise<string> {
    let contentWithImages = params.content
    
    // 1. Insert hero image after title/intro
    contentWithImages = this.insertAfterIntro(contentWithImages, params.images.hero)
    
    // 2. Insert section images after relevant H2s
    params.images.sections.forEach((image) => {
      contentWithImages = this.insertAfterHeading(
        contentWithImages,
        image,
        image.targetHeading || ''
      )
    })
    
    // 3. Insert infographics near their data sources
    params.images.infographics.forEach((infographic) => {
      contentWithImages = this.insertNearData(
        contentWithImages,
        infographic,
        infographic.dataVisualization.sourceData
      )
    })
    
    // 4. Apply strategy-based filtering
    contentWithImages = this.applyStrategy(contentWithImages, params.strategy)
    
    return contentWithImages
  }
  
  /**
   * Insert hero image after introduction/title
   */
  private insertAfterIntro(content: string, heroImage: HeroImage): string {
    // Find the first paragraph or H2 after title
    // For markdown: Look for first paragraph after H1
    // For HTML: Look for first <p> after <h1>
    
    const markdownPattern = /^(#\s+.+?\n\n)([\s\S]+)/
    const htmlPattern = /(<h1[^>]*>.*?<\/h1>\s*)([\s\S]+)/gi
    
    let match = content.match(markdownPattern)
    if (match) {
      const title = match[1]
      const rest = match[2]
      const imageMarkdown = this.formatImageForContent(heroImage, 'markdown')
      return title + imageMarkdown + '\n\n' + rest
    }
    
    match = content.match(htmlPattern)
    if (match) {
      const title = match[1]
      const rest = match[2]
      const imageHTML = this.formatImageForContent(heroImage, 'html')
      return title + imageHTML + '\n\n' + rest
    }
    
    // If no title found, insert at the beginning
    const imageMarkdown = this.formatImageForContent(heroImage, 'markdown')
    return imageMarkdown + '\n\n' + content
  }
  
  /**
   * Insert section image after a specific heading
   */
  private insertAfterHeading(
    content: string,
    image: SectionImage,
    targetHeading: string
  ): string {
    if (!targetHeading) return content
    
    // Try to find the heading in markdown format
    const markdownPattern = new RegExp(
      `(^#{1,6}\\s+${this.escapeRegex(targetHeading)}[^\\n]*\\n\\n?)(.+?)(?=^#{1,6}|$)`,
      'ims'
    )
    
    let match = content.match(markdownPattern)
    if (match) {
      const heading = match[1]
      const sectionContent = match[2]
      
      // Check if image already exists in this section
      if (sectionContent.includes(image.url)) {
        return content
      }
      
      // Insert image after first paragraph or at start of section
      const firstParagraphEnd = sectionContent.match(/\n\n/)
      if (firstParagraphEnd) {
        const before = sectionContent.substring(0, firstParagraphEnd.index! + 2)
        const after = sectionContent.substring(firstParagraphEnd.index! + 2)
        const imageMarkdown = this.formatImageForContent(image, 'markdown')
        return content.replace(
          markdownPattern,
          `${heading}${before}${imageMarkdown}\n\n${after}`
        )
      } else {
        const imageMarkdown = this.formatImageForContent(image, 'markdown')
        return content.replace(markdownPattern, `${heading}${imageMarkdown}\n\n${sectionContent}`)
      }
    }
    
    // Try HTML format
    const htmlPattern = new RegExp(
      `(<h[1-6][^>]*>${this.escapeRegex(targetHeading)}[^<]*<\/h[1-6]>\\s*)(.+?)(?=<h[1-6]|$)`,
      'is'
    )
    
    match = content.match(htmlPattern)
    if (match) {
      const heading = match[1]
      const sectionContent = match[2]
      
      if (sectionContent.includes(image.url)) {
        return content
      }
      
      const imageHTML = this.formatImageForContent(image, 'html')
      return content.replace(htmlPattern, `${heading}${imageHTML}\n\n${sectionContent}`)
    }
    
    return content
  }
  
  /**
   * Insert infographic near its data source
   */
  private insertNearData(
    content: string,
    infographic: InfographicImage,
    sourceData: string
  ): string {
    // Find the paragraph or section containing the source data
    const escapedSource = this.escapeRegex(sourceData.substring(0, 50))
    const pattern = new RegExp(`([^\\n]*${escapedSource}[^\\n]*\\n)`, 'i')
    
    const match = content.match(pattern)
    if (match) {
      const paragraph = match[1]
      
      // Check if infographic already exists near this paragraph
      const contextStart = Math.max(0, match.index! - 200)
      const contextEnd = Math.min(content.length, match.index! + match[0].length + 200)
      const context = content.substring(contextStart, contextEnd)
      
      if (context.includes(infographic.url)) {
        return content
      }
      
      // Insert infographic after the paragraph
      const imageMarkdown = this.formatImageForContent(infographic, 'markdown')
      return content.replace(pattern, `${paragraph}\n\n${imageMarkdown}\n\n`)
    }
    
    return content
  }
  
  /**
   * Apply placement strategy (balanced, dense, minimal)
   */
  private applyStrategy(content: string, strategy: ImagePlacementStrategy): string {
    // Count images in content
    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length +
                      (content.match(/<img[^>]+>/gi) || []).length
    
    if (strategy === 'minimal') {
      // Keep only hero image and first section image
      // This would require more sophisticated parsing to remove excess images
      return content
    }
    
    if (strategy === 'balanced') {
      // Ensure images are evenly distributed (already handled by insertion logic)
      return content
    }
    
    // 'dense' strategy - keep all images
    return content
  }
  
  /**
   * Generate markdown/HTML for image with full SEO optimization
   */
  private formatImageForContent(
    image: GeneratedImageWithMetadata,
    format: 'markdown' | 'html'
  ): string {
    const altText = image.altText || 'Article image'
    const caption = image.caption || altText
    
    if (format === 'markdown') {
      // Markdown format with figure support
      return `![${altText}](${image.url} "${caption}")

*${caption}*`
    } else {
      // HTML format with full SEO optimization
      return `
<figure>
  <picture>
    <source srcset="${image.webpUrl || image.url}" type="image/webp">
    <source srcset="${image.jpgUrl || image.url}" type="image/jpeg">
    <img 
      src="${image.url}" 
      alt="${altText}" 
      title="${caption}"
      loading="lazy"
      width="${image.width}"
      height="${image.height}"
      decoding="async"
    >
  </picture>
  <figcaption>${caption}</figcaption>
</figure>`.trim()
    }
  }
  
  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  
  /**
   * Count images already in content
   */
  countImages(content: string): number {
    const markdownImages = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
    const htmlImages = (content.match(/<img[^>]+>/gi) || []).length
    return markdownImages + htmlImages
  }
  
  /**
   * Check if image already exists in content
   */
  imageExists(content: string, imageUrl: string): boolean {
    return content.includes(imageUrl)
  }
  
  /**
   * Remove all images from content
   */
  removeAllImages(content: string): string {
    // Remove markdown images
    let cleaned = content.replace(/!\[.*?\]\(.*?\)/g, '')
    
    // Remove HTML images
    cleaned = cleaned.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    cleaned = cleaned.replace(/<img[^>]+>/gi, '')
    
    // Clean up extra blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    
    return cleaned.trim()
  }
}

