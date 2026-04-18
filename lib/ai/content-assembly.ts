/**
 * Content Assembly Service
 * 
 * Automatically inserts images into content with proper HTML markup,
 * accessibility attributes, and schema.org metadata.
 * 
 * Features:
 * - Hero image insertion at top
 * - Section images before H2 headings
 * - Infographic insertion near statistics
 * - Proper alt text and captions
 * - Schema.org ImageObject markup
 * - Responsive image attributes
 */

export interface ImagePlacement {
  type: 'hero' | 'section' | 'infographic' | 'inline'
  url: string
  alt: string
  caption?: string
  filename?: string
  placement: 'top' | 'before_h2' | 'after_paragraph' | 'inline'
  sectionTitle?: string // For section images: which H2 it relates to
  position?: number // For inline: which paragraph/position
}

export interface ImageSet {
  hero?: {
    url: string
    alt: string
    caption?: string
  }
  sections: Array<{
    title: string
    url: string
    alt: string
    caption?: string
  }>
  infographics?: Array<{
    url: string
    alt: string
    caption: string
    relatedData: string // Which statistic/data it visualizes
  }>
  social?: {
    openGraph?: string
    twitter?: string
    pinterest?: string
    instagram?: string
  }
}

export interface ContentWithImages {
  html: string
  markdown?: string
  imageCount: number
  images: ImagePlacement[]
}

/**
 * Generate HTML for hero image with schema markup
 */
function generateHeroImageHTML(hero: ImageSet['hero']): string {
  if (!hero) return ''

  return `<figure class="hero-image" itemscope itemtype="https://schema.org/ImageObject">
  <img 
    src="${hero.url}" 
    alt="${hero.alt}" 
    itemprop="contentUrl" 
    loading="eager"
    fetchpriority="high"
    width="1200"
    height="675"
    style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 2rem;"
  />
  ${hero.caption ? `<figcaption itemprop="caption" style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 0.5rem;">${hero.caption}</figcaption>` : ''}
  <meta itemprop="description" content="${hero.alt}" />
  <meta itemprop="name" content="Hero image" />
</figure>\n\n`
}

/**
 * Generate HTML for section image
 */
function generateSectionImageHTML(section: ImageSet['sections'][0]): string {
  return `<figure class="section-image" itemscope itemtype="https://schema.org/ImageObject">
  <img 
    src="${section.url}" 
    alt="${section.alt}" 
    itemprop="contentUrl" 
    loading="lazy"
    width="800"
    height="600"
    style="width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0;"
  />
  ${section.caption ? `<figcaption itemprop="caption" style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 0.5rem;">${section.caption}</figcaption>` : ''}
  <meta itemprop="description" content="${section.alt}" />
</figure>\n\n`
}

/**
 * Generate HTML for infographic
 */
function generateInfographicHTML(infographic: NonNullable<ImageSet['infographics']>[0]): string {
  return `<figure class="infographic" itemscope itemtype="https://schema.org/ImageObject">
  <img 
    src="${infographic.url}" 
    alt="${infographic.alt}" 
    itemprop="contentUrl" 
    loading="lazy"
    width="1000"
    height="800"
    style="width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  />
  <figcaption itemprop="caption" style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
    ${infographic.caption}
  </figcaption>
  <meta itemprop="description" content="${infographic.alt}" />
</figure>\n\n`
}

/**
 * Parse markdown/HTML content into sections
 */
function parseContentSections(content: string): Array<{ type: 'text' | 'heading'; level?: number; text: string; content: string }> {
  const lines = content.split('\n')
  const sections: Array<{ type: 'text' | 'heading'; level?: number; text: string; content: string }> = []
  
  let currentSection: { type: 'text' | 'heading'; level?: number; text: string; content: string } | null = null

  for (const line of lines) {
    // Check for markdown heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
        content: line + '\n',
      }
    } else {
      if (!currentSection) {
        currentSection = {
          type: 'text',
          text: '',
          content: '',
        }
      }
      currentSection.content += line + '\n'
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

/**
 * Insert images into content at appropriate positions
 */
export function insertImagesIntoContent(
  content: string,
  images: ImageSet
): ContentWithImages {
  let html = ''
  let imageCount = 0
  const imagePlacements: ImagePlacement[] = []

  // Parse content into sections
  const sections = parseContentSections(content)

  // Insert hero image at top (before first heading or content)
  if (images.hero) {
    html += generateHeroImageHTML(images.hero)
    imageCount++
    imagePlacements.push({
      type: 'hero',
      url: images.hero.url,
      alt: images.hero.alt,
      caption: images.hero.caption,
      placement: 'top',
    })
  }

  // Track which section images we've used
  let sectionImageIndex = 0

  // Process each section
  for (const section of sections) {
    // If this is an H2 heading and we have section images left
    if (section.type === 'heading' && section.level === 2 && sectionImageIndex < images.sections.length) {
      const sectionImage = images.sections[sectionImageIndex]
      
      // Check if this section image is meant for this heading
      if (!sectionImage.title || section.text.toLowerCase().includes(sectionImage.title.toLowerCase()) || sectionImage.title.toLowerCase().includes(section.text.toLowerCase())) {
        // Insert image before the heading
        html += generateSectionImageHTML(sectionImage)
        imageCount++
        imagePlacements.push({
          type: 'section',
          url: sectionImage.url,
          alt: sectionImage.alt,
          caption: sectionImage.caption,
          placement: 'before_h2',
          sectionTitle: section.text,
        })
        sectionImageIndex++
      }
    }

    // Add the section content
    html += section.content

    // Check for statistics in content for infographic insertion
    if (images.infographics && images.infographics.length > 0) {
      for (const infographic of images.infographics) {
        // If section content mentions statistics or data related to infographic
        if (section.content.toLowerCase().includes(infographic.relatedData.toLowerCase())) {
          html += generateInfographicHTML(infographic)
          imageCount++
          imagePlacements.push({
            type: 'infographic',
            url: infographic.url,
            alt: infographic.alt,
            caption: infographic.caption,
            placement: 'after_paragraph',
          })
          // Remove infographic from array so we don't insert it again
          const index = images.infographics.indexOf(infographic)
          images.infographics.splice(index, 1)
        }
      }
    }
  }

  // Insert any remaining section images at the end
  while (sectionImageIndex < images.sections.length) {
    html += generateSectionImageHTML(images.sections[sectionImageIndex])
    imageCount++
    imagePlacements.push({
      type: 'section',
      url: images.sections[sectionImageIndex].url,
      alt: images.sections[sectionImageIndex].alt,
      caption: images.sections[sectionImageIndex].caption,
      placement: 'after_paragraph',
    })
    sectionImageIndex++
  }

  return {
    html,
    imageCount,
    images: imagePlacements,
  }
}

/**
 * Convert markdown to HTML-ready format for image insertion
 */
export function prepareContentForImages(markdown: string): string {
  // Basic markdown to HTML conversion for headings
  // This is simplified - in production, use a proper markdown parser
  let html = markdown

  // Convert headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Convert paragraphs (simple approach)
  html = html
    .split('\n\n')
    .map((para) => {
      if (para.startsWith('<h') || para.trim() === '') return para
      return `<p>${para}</p>`
    })
    .join('\n\n')

  return html
}

/**
 * Extract H2 headings from content for section image matching
 */
export function extractH2Headings(content: string): string[] {
  const headings: string[] = []
  
  // Match markdown H2 headings
  const markdownH2 = content.match(/^## (.+)$/gm)
  if (markdownH2) {
    headings.push(...markdownH2.map((h) => h.replace(/^## /, '')))
  }

  // Match HTML H2 headings
  const htmlH2 = content.match(/<h2[^>]*>(.+?)<\/h2>/gi)
  if (htmlH2) {
    headings.push(...htmlH2.map((h) => h.replace(/<\/?h2[^>]*>/gi, '')))
  }

  return headings
}

/**
 * Generate complete content package with images inserted
 * This is the main function to use in workflows
 */
export function assembleContentWithImages(
  content: string,
  images: ImageSet,
  options: {
    format?: 'markdown' | 'html'
    includeOpenGraph?: boolean
  } = {}
): ContentWithImages {
  const { format = 'markdown', includeOpenGraph = true } = options

  // If content is markdown, prepare it
  const preparedContent = format === 'markdown' ? content : prepareContentForImages(content)

  // Insert images
  const result = insertImagesIntoContent(preparedContent, images)

  // Add Open Graph meta tags if requested
  if (includeOpenGraph && images.social?.openGraph) {
    const ogMeta = `<!-- Open Graph Meta Tags -->
<meta property="og:image" content="${images.social.openGraph}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
${images.social.twitter ? `<meta name="twitter:image" content="${images.social.twitter}" />` : ''}
\n\n`
    
    result.html = ogMeta + result.html
  }

  return result
}

// _review