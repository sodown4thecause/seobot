import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { resolveGeoDigestByDate } from '@/lib/geo/digest-service'

interface RouteParams {
  params: Promise<{ date: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  const digest = await resolveGeoDigestByDate(date)
  if (!digest) {
    return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
  }

  return NextResponse.json(digest)
}
