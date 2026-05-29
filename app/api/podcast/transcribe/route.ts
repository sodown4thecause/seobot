import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { transcribeAndOptimizePodcast } from '@/lib/podcast/podcast-service'
import { podcastErrorResponse, readPodcastJson, requirePodcastUserId } from '../http'

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
    const userId = await requirePodcastUserId()
    const payload = await readPodcastJson(req, transcribePodcastSchema)

    const transcription = await transcribeAndOptimizePodcast({
      ...payload,
      targetKeywords: payload.targetKeywords ?? [],
      userId,
    })

    return NextResponse.json({ success: true, data: transcription })
  } catch (error) {
    return podcastErrorResponse(error, 'Failed to transcribe podcast')
  }
}
