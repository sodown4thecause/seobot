import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { generateImageWithGatewayGemini } from '@/lib/ai/image-generation'
import { z } from 'zod'

const schema = z.object({
    prompt: z.string().min(1),
    size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'),
    n: z.number().int().min(1).max(4).optional().default(2),
})

export const maxDuration = 120

export async function POST(req: NextRequest) {
    try {
        await requireUserId()
    } catch {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body
    try {
        body = schema.parse(await req.json())
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    try {
        const result = await generateImageWithGatewayGemini({
            prompt: body.prompt,
            size: body.size,
            n: body.n,
            abortTimeoutMs: 90000,
        })

        const images = result.images
            .map((img) => img.dataUrl || `data:${img.mediaType};base64,${img.base64}`)
            .filter(Boolean)

        return NextResponse.json({ images })
    } catch (error) {
        console.error('[Image Generate API]', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Image generation failed' },
            { status: 500 }
        )
    }
}
