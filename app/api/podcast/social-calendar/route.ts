import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth'
import { generateSocialMediaCalendar } from '@/lib/podcast/podcast-service'

export const runtime = 'nodejs'

const socialCalendarSchema = z.object({
  podcastId: z.string().trim().min(1),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram'])).min(1),
  duration: z.number().int().positive(),
  postsPerDay: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  try {
    await requireUserId()
    const payload = socialCalendarSchema.parse(await req.json())
    const calendar = await generateSocialMediaCalendar(payload)

    return NextResponse.json({ success: true, data: calendar })
  } catch (error) {
    console.error('[Podcast Social Calendar] Error:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        error: isValidationError ? 'Invalid podcast social calendar payload' : 'Failed to generate social media calendar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
