import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth'

export async function readPodcastJson<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T> {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    throw new PodcastRouteError('Invalid JSON body', 400)
  }

  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new PodcastRouteError('Invalid podcast request payload', 400)
    }

    throw error
  }
}

export async function requirePodcastUserId(): Promise<string> {
  try {
    return await requireUserId()
  } catch {
    throw new PodcastRouteError('Authentication required', 401)
  }
}

export class PodcastRouteError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'PodcastRouteError'
  }
}

export function podcastErrorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof PodcastRouteError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    )
  }

  if (error instanceof Error && error.message === 'Podcast not found') {
    return NextResponse.json(
      { error: 'Podcast not found' },
      { status: 404 },
    )
  }

  console.error('[Podcast API] Unexpected error:', error)
  return NextResponse.json(
    { error: fallback },
    { status: 500 },
  )
}
