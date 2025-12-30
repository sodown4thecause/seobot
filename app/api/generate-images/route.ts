import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { EnhancedImageAgent } from '@/lib/agents/enhanced-image-agent'
import { handleApiError } from '@/lib/errors/handlers'

export const maxDuration = 300 // 5 minutes for image generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, topic, keywords, brandGuidelines } = body

    if (!content || !topic) {
      return NextResponse.json(
        { error: 'Content and topic are required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    await requireUserId()

    // Generate article image set
    const imageAgent = new EnhancedImageAgent()
    const imageSet = await imageAgent.generateArticleImageSet({
      content,
      topic,
      keywords: keywords || [],
      brandGuidelines,
    })

    return NextResponse.json(imageSet)
  } catch (error) {
    console.error('[Generate Images API] Error:', error)
    return handleApiError(error, 'Failed to generate images')
  }
}

