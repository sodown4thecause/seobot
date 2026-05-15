import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { serverEnv } from '@/lib/config/env'
import { runWeeklyResearch } from '@/lib/research/weekly'

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
    const result = await runWeeklyResearch('seo')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[Cron] Weekly SEO research failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Weekly SEO research failed',
      },
      { status: 500 }
    )
  }
}
