import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { refreshJobs } from '@/lib/db/schema'
import { getRedisClient } from '@/lib/redis/client'

const encoder = new TextEncoder()
const SSE_CONNECTION_TTL_SECONDS = 300

function connectionKey(userId: string): string {
  return `jobs:sse:connections:${userId}`
}

async function reserveConnection(userId: string): Promise<'ok' | 'limit-exceeded' | 'redis-unavailable'> {
  const redis = getRedisClient()
  if (!redis) {
    return 'redis-unavailable'
  }

  const key = connectionKey(userId)
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, SSE_CONNECTION_TTL_SECONDS)
  }

  if (count > 1) {
    await redis.decr(key)
    return 'limit-exceeded'
  }

  return 'ok'
}

async function releaseConnection(userId: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    return
  }

  const key = connectionKey(userId)
  const count = await redis.decr(key)

  if (count <= 0) {
    await redis.del(key)
  }
}

async function refreshConnectionTtl(userId: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    return
  }

  await redis.expire(connectionKey(userId), SSE_CONNECTION_TTL_SECONDS)
}

function toSSE(data: string): Uint8Array {
  return encoder.encode(`data: ${data}\n\n`)
}

export async function GET(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connectionResult = await reserveConnection(userId)
  if (connectionResult === 'limit-exceeded') {
    return NextResponse.json({ error: 'Only one SSE connection allowed' }, { status: 429 })
  }

  if (connectionResult === 'redis-unavailable') {
    return NextResponse.json({ error: 'SSE unavailable. Please try again shortly.' }, { status: 503 })
  }

  let intervalId: ReturnType<typeof setInterval> | null = null
  let released = false

  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const releaseOnce = async () => {
    if (released) {
      return
    }

    released = true
    await releaseConnection(userId)
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastPayload = ''
      let closed = false

      const closeStream = () => {
        if (closed) {
          return
        }

        closed = true
        cleanup()
        void releaseOnce()
        try {
          controller.close()
        } catch {
          // no-op: controller may already be closed/cancelled
        }
      }

      const sendLatestJob = async () => {
        try {
          await refreshConnectionTtl(userId)

          const latest = await db
            .select({
              jobId: refreshJobs.id,
              progress: refreshJobs.progress,
              status: refreshJobs.status,
              updatedAt: refreshJobs.updatedAt,
            })
            .from(refreshJobs)
            .where(
              and(
                eq(refreshJobs.userId, userId),
                inArray(refreshJobs.status, ['queued', 'processing', 'complete', 'failed', 'cancelled'])
              )
            )
            .orderBy(desc(refreshJobs.updatedAt))
            .limit(1)

          if (closed) {
            return
          }

          const job = latest[0]
          if (!job) {
            return
          }

          const payload = JSON.stringify({
            jobId: job.jobId,
            progress: job.progress ?? 0,
            status: job.status,
            updatedAt: job.updatedAt?.toISOString(),
          })

          if (payload !== lastPayload) {
            controller.enqueue(toSSE(payload))
            lastPayload = payload
          }

          if (job.status === 'complete' || job.status === 'failed' || job.status === 'cancelled') {
            closeStream()
          }
        } catch (error) {
          console.error('[Jobs SSE] Failed to send latest job update:', error)
        }
      }

      void sendLatestJob()
      intervalId = setInterval(() => {
        void sendLatestJob()
      }, 2000)

      request.signal.addEventListener('abort', () => {
        closeStream()
      })
    },
    cancel() {
      cleanup()
      void releaseOnce()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
