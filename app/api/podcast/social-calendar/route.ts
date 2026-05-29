import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateSocialMediaCalendar } from '@/lib/podcast/podcast-service'
import { podcastErrorResponse, readPodcastJson, requirePodcastUserId } from '../http'

export const runtime = 'nodejs'

const socialCalendarSchema = z.object({
  podcastId: z.string().trim().min(1),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram'])).min(1),
  duration: z.number().int().positive(),
  postsPerDay: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const userId = await requirePodcastUserId()
    const payload = await readPodcastJson(req, socialCalendarSchema)
    const calendar = await generateSocialMediaCalendar({ ...payload, userId })

    return NextResponse.json({ success: true, data: calendar })
  } catch (error) {
    return podcastErrorResponse(error, 'Failed to generate social media calendar')
  }
}
