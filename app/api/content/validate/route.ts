/**
 * Content Validation API
 * 
 * Validates content for SEO compliance using Winston AI
 * - Plagiarism detection
 * - AI content detection
 * - SEO recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateContentForSEO, checkPlagiarism } from '@/lib/external-apis/winston-ai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { text, checkAi = true } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      )
    }

    console.log('[Content Validation] Validating content:', {
      userId: user.id,
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

