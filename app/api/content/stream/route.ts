import { RAGWriterOrchestrator, ProgressUpdate } from '@/lib/agents/rag-writer-orchestrator'
import { createClient } from '@/lib/supabase/server'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import { checkCreditLimit } from '@/lib/usage/limit-check'
import { z } from 'zod'
import { NextRequest } from 'next/server'

export const maxDuration = 300 // 5 minutes for content generation

const requestSchema = z.object({
    topic: z.string(),
    type: z.enum(['blog_post', 'article', 'social_media', 'landing_page']),
    keywords: z.array(z.string()),
    tone: z.string().optional(),
    wordCount: z.number().optional(),
    competitorUrls: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(req, 'CONTENT_GENERATION')
    if (rateLimitResponse) {
        return rateLimitResponse
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // Credit limit check
    const limitCheck = await checkCreditLimit(user.id, req)
    if (!limitCheck.allowed) {
        return new Response(
            JSON.stringify({
                error: limitCheck.reason || 'Credit limit exceeded',
                code: 'CREDIT_LIMIT_EXCEEDED',
                isPaused: limitCheck.isPaused,
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }

    // Validate request body
    let body
    try {
        body = requestSchema.parse(await req.json())
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // Create SSE stream for progress updates
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Helper to send SSE events
    const sendEvent = async (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        await writer.write(encoder.encode(message))
    }

        // Start content generation in background
        ; (async () => {
            try {
                const orchestrator = new RAGWriterOrchestrator()

                // Progress callback that sends SSE events
                const onProgress = async (update: ProgressUpdate) => {
                    await sendEvent('progress', update)
                }

                // Generate content with progress streaming
                const result = await orchestrator.generateContent({
                    ...body,
                    userId: user.id,
                    onProgress,
                })

                // Send final result
                await sendEvent('complete', {
                    content: result.content,
                    contentId: result.contentId,
                    qualityScores: result.qualityScores,
                    revisionCount: result.revisionCount,
                    metadata: result.metadata,
                    fraseOptimization: result.fraseOptimization,
                })

                await writer.close()
            } catch (error) {
                console.error('[Content Stream] Error:', error)
                await sendEvent('error', {
                    phase: 'error',
                    status: 'error',
                    message: 'Content generation failed',
                    details: error instanceof Error ? error.message : 'Unknown error',
                })
                await writer.close()
            }
        })()

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}
