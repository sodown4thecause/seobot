import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { refreshJobs } from '@/lib/db/schema'

const encoder = new TextEncoder()
const userConnectionCount = new Map<string, number>()

function toSSE(data: string): Uint8Array {
  return encoder.encode(`data: ${data}\n\n`)
}

export async function GET(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeCount = userConnectionCount.get(userId) ?? 0
  if (activeCount >= 1) {
    return NextResponse.json({ error: 'Only one SSE connection allowed' }, { status: 429 })
  }

  userConnectionCount.set(userId, activeCount + 1)

  let intervalId: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let lastPayload = ''

      const sendLatestJob = async () => {
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
      }

      void sendLatestJob()
      intervalId = setInterval(() => {
        void sendLatestJob()
      }, 2000)

      request.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
        userConnectionCount.set(userId, Math.max((userConnectionCount.get(userId) ?? 1) - 1, 0))
        controller.close()
      })
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId)
      }
      userConnectionCount.set(userId, Math.max((userConnectionCount.get(userId) ?? 1) - 1, 0))
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
