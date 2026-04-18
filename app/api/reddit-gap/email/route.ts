import { NextRequest, NextResponse } from 'next/server'
import { sendRedditGapEmail } from '@/lib/reddit-gap/email'
import { requireUserId } from '@/lib/auth/clerk'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/redis/rate-limit'
import type { RedditGapResults } from '@/lib/reddit-gap/types'

export interface EmailRequest {
  email: string
  results: RedditGapResults
  auditId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    let userId: string | null = null
    try {
      userId = await requireUserId()
    } catch {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check rate limiting - 3 emails per hour per user
    const rateLimitResult = await rateLimitMiddleware(request, 'EXPORT', userId)
    if (rateLimitResult) return rateLimitResult

    const body: EmailRequest = await request.json()
    
    const { email, results, auditId } = body
    
    if (!email || !results) {
      return NextResponse.json(
        { error: 'Missing required fields: email and results' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Send the email
    const sent = await sendRedditGapEmail({
      email,
      results,
      auditId
    })

    if (sent) {
      return NextResponse.json(
        { success: true, message: 'Content gap brief sent successfully' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Failed to send email - email service not configured' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Reddit Gap Email API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
