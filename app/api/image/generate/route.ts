import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { generateText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { serverEnv } from '@/lib/config/env'
import { z } from 'zod'

const schema = z.object({
    prompt: z.string().min(1),
    size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'),
    n: z.number().int().min(1).max(4).optional().default(2),
})

export const maxDuration = 120

const gateway = serverEnv.AI_GATEWAY_API_KEY
  ? createGateway({
      apiKey: serverEnv.AI_GATEWAY_API_KEY,
      baseURL: serverEnv.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1/ai',
    })
  : null

const google = serverEnv.GOOGLE_API_KEY
  ? createGoogleGenerativeAI({ apiKey: serverEnv.GOOGLE_API_KEY })
  : null

function toImageUrl(image: { dataUrl?: string; base64?: string; mediaType?: string }): string | null {
  if (image.dataUrl && image.dataUrl.trim().length > 0) {
    return image.dataUrl
  }

  if (image.base64 && image.base64.trim().length > 0) {
    return `data:${image.mediaType || 'image/png'};base64,${image.base64}`
  }

  return null
}

export async function POST(req: NextRequest) {
    try {
        await requireUserId()
    } catch {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body
    try {
        body = schema.parse(await req.json())
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    try {
        const model = gateway
          ? gateway('google/gemini-2.5-flash-image')
          : google
            ? google('gemini-2.5-flash-image')
            : null

        if (!model) {
          return NextResponse.json({ error: 'No image generation provider configured' }, { status: 503 })
        }

        const result = await generateText({
            model,
            providerOptions: {
              google: { responseModalities: ['TEXT', 'IMAGE'] },
            },
            prompt: body.prompt,
        })

        const images = (result.files || [])
            .filter((file) => file.mediaType.startsWith('image/'))
            .slice(0, body.n)
            .map((file) => toImageUrl(file))
            .filter(Boolean)

        if (images.length === 0) {
          return NextResponse.json({ error: 'No image was generated' }, { status: 422 })
        }

        return NextResponse.json({ images })
    } catch (error) {
        console.error('[Image Generate API]', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Image generation failed' },
            { status: 500 }
        )
    }
}
