import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateBlogPostFromPodcast } from '@/lib/podcast/podcast-service'
import { podcastErrorResponse, readPodcastJson, requirePodcastUserId } from '../http'

export const runtime = 'nodejs'

const blogPostSchema = z.object({
  podcastId: z.string().trim().min(1),
  targetAudience: z.string().trim().min(1),
  tone: z.enum(['professional', 'casual', 'educational']),
  includeQuotes: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const userId = await requirePodcastUserId()
    const payload = await readPodcastJson(req, blogPostSchema)
    const blogPost = await generateBlogPostFromPodcast({ ...payload, userId })

    return NextResponse.json({ success: true, data: blogPost })
  } catch (error) {
    return podcastErrorResponse(error, 'Failed to generate blog post')
  }
}
