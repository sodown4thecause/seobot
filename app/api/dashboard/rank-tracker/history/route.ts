import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { listDashboardHistory } from '@/lib/dashboard/repository'

export const runtime = 'nodejs'

const historyQuerySchema = z.object({
  websiteUrl: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const parsedQuery = historyQuerySchema.safeParse({
      websiteUrl: request.nextUrl.searchParams.get('websiteUrl') ?? undefined,
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
    })

    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Invalid query parameters', issues: parsedQuery.error.issues }, { status: 400 })
    }

    const items = await listDashboardHistory({
      userId,
      dataType: 'ranks',
      websiteUrl: parsedQuery.data.websiteUrl,
      limit: parsedQuery.data.limit,
    })

    return NextResponse.json({
      dataType: 'ranks',
      count: items.length,
      items,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load rank tracker history' },
      { status: 500 }
    )
  }
}
