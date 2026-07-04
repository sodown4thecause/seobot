import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveGeoDigestTrends } from '@/lib/geo/digest-service'

const trendsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
})

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const parsed = trendsQuerySchema.safeParse({
    days: url.searchParams.get('days') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid trends query', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const digests = await resolveGeoDigestTrends(parsed.data.days)
  return NextResponse.json({ days: parsed.data.days, digests })
}
