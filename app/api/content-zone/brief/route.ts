import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import { createContentZoneBrief, contentZoneBriefRequestSchema } from '@/lib/content-zone/brief'
import { ZodError } from 'zod'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await rateLimitMiddleware(req, 'CONTENT_GENERATION')
    if (rateLimitResponse) return rateLimitResponse

    const userId = await requireUserId()
    const body = contentZoneBriefRequestSchema.parse(await req.json())

    const result = await createContentZoneBrief({ ...body, userId })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', issues: error.issues },
        { status: 400 },
      )
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Content Zone Brief] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create content brief', message },
      { status: 500 },
    )
  }
}
