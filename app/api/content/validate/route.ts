/**
 * Content Validation API
 * 
 * Validates content for SEO compliance using Winston AI
 * - Plagiarism detection
 * - AI content detection
 * - SEO recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { validateContentForSEO, checkPlagiarism } from '@/lib/external-apis/winston-ai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireUserId()

    const { text, checkAi = true } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    console.log('[Content Validation] Validating content:', {
      userId,
      textLength: text.length,
      checkAi,
    })

    // Validate content for SEO
    const validation = await validateContentForSEO(text)

    console.log('[Content Validation] Validation complete:', {
      isValid: validation.isValid,
      plagiarismScore: validation.plagiarismScore,
      aiScore: validation.aiScore,
      issuesCount: validation.issues.length,
    })

    return NextResponse.json({
      success: true,
      validation,
    })
  } catch (error) {
    console.error('[Content Validation] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to validate content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

