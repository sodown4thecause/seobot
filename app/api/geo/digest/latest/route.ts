import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { resolveLatestGeoDigest } from '@/lib/geo/digest-service'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const digest = await resolveLatestGeoDigest()
  if (!digest) {
    return NextResponse.json({ error: 'No GEO digest available yet' }, { status: 404 })
  }

  return NextResponse.json(digest)
}
