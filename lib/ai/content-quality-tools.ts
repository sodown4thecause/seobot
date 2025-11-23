/**
 * AI SDK 6 Tools for Content Quality & Generation
 *
 * Provides Winston AI and Rytr tools for the chat interface
 * Compatible with AI SDK 6 using inputSchema instead of parameters
 */

import { tool } from 'ai'
import { z } from 'zod'
import {
  validateContentForSEO,
  checkPlagiarism,
  checkAiContent,
} from '@/lib/external-apis/winston-ai'
import {
  generateSEOContent,
  generateBlogSection,
  generateMetaTitle,
  generateMetaDescription,
  improveContent,
  expandContent,
  type RytrTone,
  type RytrUseCase,
} from '@/lib/external-apis/rytr'

/**
 * Winston AI Tools
 */

export const validateContentTool = tool({
  description: 'Validate content for SEO compliance, checking plagiarism and AI detection. Use this to ensure content is original and SEO-friendly.',
  inputSchema: z.object({
    text: z.string().describe('The content text to validate'),
  }),
  execute: async ({ text }: { text: string }) => {
    try {
      const result = await validateContentForSEO(text)
      return {
        isValid: result.isValid,
        plagiarismScore: result.plagiarismScore,
        aiScore: result.aiScore,
        issues: result.issues,
        recommendations: result.recommendations,
        summary: result.isValid
          ? '✅ Content is SEO-compliant and original'
          : `⚠️ Content has ${result.issues.length} issue(s): ${result.issues.join(', ')}`,
      }
    } catch (error) {
      console.error('[Content Tools] Validate content error:', error);
      return {
        isValid: false,
        error: 'Validation failed',
        summary: '⚠️ Validation failed due to an error',
      }
    }
  },
})

export const checkPlagiarismTool = tool({
  description: 'Check content for plagiarism and duplicate sources. Returns plagiarism score and matching sources.',
  inputSchema: z.object({
    text: z.string().describe('The content text to check for plagiarism'),
    language: z.string().default('en').describe('Language code (default: en)')
  }),
  execute: async ({ text, language }: { text: string, language?: string }) => {
    const result = await checkPlagiarism({
      text,
      language,
      checkAiContent: true,
    })
    return {
      plagiarismScore: result.score,
      isPlagiarized: result.isPlagiarized,
      sourcesFound: result.sources.length,
      sources: result.sources.slice(0, 5).map(s => ({
        url: s.url,
        title: s.title,
        matchPercentage: s.matchPercentage,
      })),
      aiGenerated: result.aiGenerated,
      summary: result.isPlagiarized
        ? `⚠️ ${result.score}% plagiarism detected from ${result.sources.length} sources`
        : `✅ Content is original (${result.score}% similarity)`,
    }
  },
})

export const checkAiContentTool = tool({
  description: 'Detect if content is AI-generated. Returns AI detection score and confidence level.',
  inputSchema: z.object({
    text: z.string().describe('The content text to check')
  }),
  execute: async ({ text }: { text: string }) => {
    const result = await checkAiContent(text)
    return {
      aiScore: result.score,
      isAiGenerated: result.isAiGenerated,
      confidence: result.confidence,
      summary: result.isAiGenerated
        ? `⚠️ Content appears AI-generated (${result.score}% confidence - ${result.confidence})`
        : `✅ Content appears human-written (${result.score}% AI score)`,
    }
  },
})

/**
 * Rytr AI Tools
 */

export const generateSEOContentTool = tool({
  description: 'Generate complete SEO-optimized content including main content, meta title, and meta description. Use this for creating new blog posts or articles.',
  inputSchema: z.object({
    topic: z.string().describe('The topic or subject to write about'),
    keywords: z.array(z.string()).describe('Target keywords to include'),
    tone: z.enum(['informative', 'casual', 'formal', 'enthusiastic', 'professional', 'friendly', 'urgent', 'inspirational', 'humorous', 'convincing']).default('informative').describe('Writing tone')
  }),
  execute: async ({ topic, keywords, tone }: { topic: string; keywords: string[]; tone?: string }) => {
    const result = await generateSEOContent({
      topic,
      keywords,
      tone: (tone as RytrTone) || 'informative',
    })
    return {
      content: result.content,
      metaTitle: result.metaTitle,
      metaDescription: result.metaDescription,
      variations: result.variations,
      summary: `✅ Generated SEO content for "${topic}" with ${keywords.length} keywords`,
    }
  },
})

export const generateBlogSectionTool = tool({
  description: 'Generate a blog section or paragraph about a specific topic with target keywords.',
  inputSchema: z.object({
    topic: z.string().describe('The topic to write about'),
    keywords: z.array(z.string()).describe('Keywords to include naturally'),
    tone: z.enum(['informative', 'casual', 'formal', 'enthusiastic', 'professional']).optional().describe('Writing tone')
  }),
  execute: async ({ topic, keywords, tone }: { topic: string; keywords: string[]; tone?: string }) => {
    const content = await generateBlogSection(
      topic,
      keywords,
      (tone as RytrTone) || 'informative'
    )
    return {
      content,
      wordCount: content.split(/\s+/).length,
      summary: `✅ Generated ${content.split(/\s+/).length} words about "${topic}"`,
    }
  },
})

export const generateMetaTitleTool = tool({
  description: 'Generate an SEO-optimized meta title (50-60 characters) for a page.',
  inputSchema: z.object({
    topic: z.string().describe('The page topic'),
    primaryKeyword: z.string().describe('Primary keyword to include')
  }),
  execute: async ({ topic, primaryKeyword }: { topic: string, primaryKeyword: string }) => {
    const metaTitle = await generateMetaTitle(topic, primaryKeyword)
    return {
      metaTitle,
      length: metaTitle.length,
      summary: `✅ Generated meta title: "${metaTitle}" (${metaTitle.length} chars)`,
    }
  },
})

export const generateMetaDescriptionTool = tool({
  description: 'Generate an SEO-optimized meta description (155-160 characters) for a page.',
  inputSchema: z.object({
    pageTitle: z.string().describe('The page title'),
    keywords: z.array(z.string()).describe('Keywords to include')
  }),
  execute: async ({ pageTitle, keywords }: { pageTitle: string, keywords: string[] }) => {
    const metaDescription = await generateMetaDescription(pageTitle, keywords)
    return {
      metaDescription,
      length: metaDescription.length,
      summary: `✅ Generated meta description (${metaDescription.length} chars)`,
    }
  },
})

export const improveContentTool = tool({
  description: 'Improve existing content to make it more engaging, clear, and SEO-friendly.',
  inputSchema: z.object({
    text: z.string().describe('The content to improve'),
    tone: z.enum(['informative', 'casual', 'formal', 'enthusiastic', 'professional']).optional().describe('Desired tone')
  }),
  execute: async ({ text, tone }: { text: string; tone?: string }) => {
    const improved = await improveContent(text, (tone as RytrTone) || 'informative')
    return {
      originalLength: text.split(/\s+/).length,
      improvedContent: improved,
      improvedLength: improved.split(/\s+/).length,
      summary: `✅ Improved content from ${text.split(/\s+/).length} to ${improved.split(/\s+/).length} words`,
    }
  },
})

export const expandContentTool = tool({
  description: 'Expand content with more details, examples, and explanations.',
  inputSchema: z.object({
    text: z.string().describe('The content to expand'),
    tone: z.enum(['informative', 'casual', 'formal', 'enthusiastic', 'professional']).optional().describe('Writing tone')
  }),
  execute: async ({ text, tone }: { text: string; tone?: string }) => {
    const expanded = await expandContent(text, (tone as RytrTone) || 'informative')
    return {
      originalLength: text.split(/\s+/).length,
      expandedContent: expanded,
      expandedLength: expanded.split(/\s+/).length,
      summary: `✅ Expanded content from ${text.split(/\s+/).length} to ${expanded.split(/\s+/).length} words`,
    }
  },
})

/**
 * Get all content quality tools
 */
export function getContentQualityTools() {
  return {
    // Winston AI tools
    validate_content: validateContentTool,
    check_plagiarism: checkPlagiarismTool,
    check_ai_content: checkAiContentTool,
    
    // Rytr AI tools
    generate_seo_content: generateSEOContentTool,
    generate_blog_section: generateBlogSectionTool,
    generate_meta_title: generateMetaTitleTool,
    generate_meta_description: generateMetaDescriptionTool,
    improve_content: improveContentTool,
    expand_content: expandContentTool,
  }
}

