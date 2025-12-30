import { RAGWriterOrchestrator, ProgressUpdate } from '@/lib/agents/rag-writer-orchestrator'
import { requireUserId } from '@/lib/auth/clerk'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
// TODO: Re-implement credit limit checking with Drizzle ORM
// import { checkCreditLimit } from '@/lib/usage/limit-check'
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
    const userId = await requireUserId()

    // TODO: Re-implement credit limit checking with Drizzle ORM
    // Credit limit check
    // const limitCheck = await checkCreditLimit(userId, req)
    // if (!limitCheck.allowed) {
    //     return new Response(
    //         JSON.stringify({
    //             error: limitCheck.reason || 'Credit limit exceeded',
    //             code: 'CREDIT_LIMIT_EXCEEDED',
    //             isPaused: limitCheck.isPaused,
    //         }),
    //         {
    //             status: 403,
    //             headers: { 'Content-Type': 'application/json' },
    //         }
    //     )
    // }

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

    // Create AbortController for client-disconnect handling
    const abortController = new AbortController()

    // Wire request signal to abort controller
    req.signal.addEventListener('abort', () => {
        console.log('[Content Stream] Client disconnected, aborting generation')
        abortController.abort()
    })

        // Start content generation in background
        ; (async () => {
            try {
                const orchestrator = new RAGWriterOrchestrator()

                // Progress callback that sends SSE events
                const onProgress = async (update: ProgressUpdate) => {
                    await sendEvent('progress', update)
                }

                // Generate content with progress streaming and abort signal
                const result = await orchestrator.generateContent({
                    ...body,
                    userId,
                    onProgress,
                    abortSignal: abortController.signal,
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
            } catch (error) {
                // Handle abort separately from other errors
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log('[Content Stream] Generation aborted by client disconnect')
                    try {
                        await sendEvent('aborted', {
                            phase: 'aborted',
                            status: 'error',
                            message: 'Content generation cancelled',
                        })
                    } catch (sendError) {
                        console.debug('[Content Stream] Failed to send abort event (stream closed)')
                    }
                } else {
                    console.error('[Content Stream] Error:', error)
                    // Try to send error event, but don't throw if stream is already closed
                    try {
                        await sendEvent('error', {
                            phase: 'error',
                            status: 'error',
                            message: 'Content generation failed',
                            details: error instanceof Error ? error.message : 'Unknown error',
                        })
                    } catch (sendError) {
                        // Stream already closed or client disconnected - log but don't throw
                        console.warn('[Content Stream] Failed to send error event (stream may be closed):', sendError)
                    }
                }
            } finally {
                // Always close the writer to prevent resource leaks
                try {
                    await writer.close()
                } catch (closeError) {
                    // Writer already closed - this is fine
                    console.debug('[Content Stream] Writer already closed')
                }
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
