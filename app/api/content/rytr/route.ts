/**
 * Rytr Content Generation API
 * 
 * Generates SEO-optimized content using Rytr AI
 * - Blog sections
 * - Meta titles and descriptions
 * - Content variations
 * - Content improvement
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import {
  generateSEOContent,
  generateBlogSection,
  generateMetaTitle,
  generateMetaDescription,
  improveContent,
  expandContent,
  generateVariations,
  type RytrTone,
  type RytrUseCase,
} from '@/lib/external-apis/rytr'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireUserId()

    const body = await req.json()
    const { action, ...params } = body

    console.log('[Rytr API] Request:', {
      userId,
      action,
      params: Object.keys(params),
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any

    switch (action) {
      case 'generate_seo_content':
        result = await generateSEOContent({
          topic: params.topic,
          keywords: params.keywords || [],
          tone: params.tone as RytrTone,
          useCase: params.useCase as RytrUseCase,
        })
        break

      case 'generate_blog_section':
        result = {
          content: await generateBlogSection(
            params.topic,
            params.keywords || [],
            params.tone as RytrTone
          ),
        }
        break

      case 'generate_meta_title':
        result = {
          metaTitle: await generateMetaTitle(
            params.topic,
            params.primaryKeyword
          ),
        }
        break

      case 'generate_meta_description':
        result = {
          metaDescription: await generateMetaDescription(
            params.pageTitle,
            params.keywords || []
          ),
        }
        break

      case 'improve_content':
        result = {
          improvedContent: await improveContent(
            params.text,
            params.tone as RytrTone
          ),
        }
        break

      case 'expand_content':
        result = {
          expandedContent: await expandContent(
            params.text,
            params.tone as RytrTone
          ),
        }
        break

      case 'generate_variations':
        result = {
          variations: await generateVariations(
            params.useCase as RytrUseCase,
            params.input,
            params.count || 3,
            params.tone as RytrTone
          ),
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    console.log('[Rytr API] Success:', {
      action,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resultKeys: Object.keys(result as any),
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Rytr API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

