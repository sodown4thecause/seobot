import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth'
import { generateBlogPostFromPodcast } from '@/lib/podcast/podcast-service'

export const runtime = 'nodejs'

const blogPostSchema = z.object({
  podcastId: z.string().trim().min(1),
  targetAudience: z.string().trim().min(1),
  tone: z.enum(['professional', 'casual', 'educational']),
  includeQuotes: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    await requireUserId()
    const payload = blogPostSchema.parse(await req.json())
    const blogPost = await generateBlogPostFromPodcast(payload)

    return NextResponse.json({ success: true, data: blogPost })
  } catch (error) {
    console.error('[Podcast Blog Post] Error:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        error: isValidationError ? 'Invalid podcast blog post payload' : 'Failed to generate blog post',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
