import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { serverEnv } from '@/lib/config/env'
import { runWeeklyResearch } from '@/lib/research/weekly'
import { getRedisClient } from '@/lib/redis/client'
import { getWeeklyRunKey, runScheduledOnce } from '@/lib/cron/scheduled-run'

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
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'
    const execute = () => runWeeklyResearch('geo')
    const redis = getRedisClient()
    if (!force && !redis) {
      throw new Error('Redis is required for scheduled-run idempotency')
    }
    const scheduled = force
      ? { executed: true as const, value: await execute() }
      : await runScheduledOnce(
          redis!,
          getWeeklyRunKey('weekly-geo-research'),
          8 * 24 * 60 * 60,
          execute
        )
    if (!scheduled.executed) {
      return NextResponse.json({ success: true, skipped: true, reason: 'already-executed' })
    }
    const result = scheduled.value
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[Cron] Weekly GEO research failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Weekly GEO research failed',
      },
      { status: 500 }
    )
  }
}
