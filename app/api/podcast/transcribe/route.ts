import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth'
import { transcribeAndOptimizePodcast } from '@/lib/podcast/podcast-service'

export const runtime = 'nodejs'

const transcribePodcastSchema = z.object({
  audioUrl: z.string().trim().min(1),
  podcastTitle: z.string().trim().min(1),
  podcastDescription: z.string().trim().optional(),
  episodeNumber: z.number().int().positive().optional(),
  targetKeywords: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const payload = transcribePodcastSchema.parse(await req.json())

    const transcription = await transcribeAndOptimizePodcast({
      ...payload,
      userId,
    })

    return NextResponse.json({ success: true, data: transcription })
  } catch (error) {
    console.error('[Podcast Transcribe] Error:', error)
    const isValidationError = error instanceof z.ZodError
    return NextResponse.json(
      {
        error: isValidationError ? 'Invalid podcast transcription payload' : 'Failed to transcribe podcast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
