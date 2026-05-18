import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { serverEnv } from '@/lib/config/env'
import { runWeeklyIngestion } from '@/lib/rag/weekly-ingestion'
import { CHAT_MODES, isChatMode } from '@/lib/chat/modes'
import type { ChatMode } from '@/lib/chat/modes'

export const maxDuration = 300

function isAuthorized(authHeader: string | null): boolean {
  if (!serverEnv.CRON_SECRET || !authHeader?.startsWith('Bearer ')) return false
  const token = Buffer.from(authHeader.slice('Bearer '.length))
  const secret = Buffer.from(serverEnv.CRON_SECRET)
  return token.length === secret.length && timingSafeEqual(token, secret)
}

/**
 * Weekly RAG ingestion endpoint (cron-triggered).
 *
 * Populates the per-mode weekly RAG namespaces (`seo`, `geo`, `content`).
 * Accepts an optional `?modes=seo,content` query param to ingest a subset;
 * defaults to all three modes.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!isAuthorized(authHeader)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const modesParam = new URL(req.url).searchParams.get('modes')
    let modes: ChatMode[]
    if (modesParam) {
      const raw = modesParam.split(',').map(v => v.trim())
      const invalid = raw.filter(v => !isChatMode(v))
      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid mode(s): ${invalid.join(', ')}. Valid modes: ${CHAT_MODES.join(', ')}` },
          { status: 400 }
        )
      }
      modes = raw as ChatMode[]
    } else {
      modes = [...CHAT_MODES]
    }
    const results = await runWeeklyIngestion(modes)
    const failed = results.filter(result => result.status === 'failed')

    return NextResponse.json(
      { success: failed.length === 0, results },
      { status: failed.length > 0 && failed.length === results.length ? 500 : 200 }
    )
  } catch (error) {
    console.error('[Cron] Weekly RAG ingestion failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Weekly RAG ingestion failed',
      },
      { status: 500 }
    )
  }
}
