import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { serverEnv } from '@/lib/config/env'
import { CHAT_MODES, isChatMode, type ChatMode } from '@/lib/chat/modes'
import { runFortnightlyIndustryResearch } from '@/lib/research/fortnightly-industry'

export const maxDuration = 300

function isAuthorized(authHeader: string | null): boolean {
  if (!serverEnv.CRON_SECRET || !authHeader?.startsWith('Bearer ')) return false
  const token = Buffer.from(authHeader.slice('Bearer '.length))
  const secret = Buffer.from(serverEnv.CRON_SECRET)
  return token.length === secret.length && timingSafeEqual(token, secret)
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!isAuthorized(authHeader)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const modesParam = new URL(req.url).searchParams.get('modes')
    let modes: ChatMode[] = ['seo', 'geo', 'content', 'social']

    if (modesParam) {
      const rawModes = modesParam.split(',').map(value => value.trim()).filter(Boolean)
      const invalid = rawModes.filter(value => !isChatMode(value))
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid mode(s): ${invalid.join(', ')}. Valid modes: ${CHAT_MODES.join(', ')}`,
          },
          { status: 400 }
        )
      }
      modes = rawModes as ChatMode[]
    }

    const results = await runFortnightlyIndustryResearch(modes)
    const failed = results.filter(result => result.status === 'failed')

    return NextResponse.json(
      { success: failed.length === 0, results },
      { status: failed.length > 0 && failed.length === results.length ? 500 : 200 }
    )
  } catch (error) {
    console.error('[Cron] Fortnightly industry research failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Fortnightly industry research failed',
      },
      { status: 500 }
    )
  }
}
