import { NextResponse } from 'next/server'
import { serverEnv } from '@/lib/config/env'
import { runWeeklyResearch } from '@/lib/research/weekly'

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (serverEnv.CRON_SECRET && authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await runWeeklyResearch('geo')
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
