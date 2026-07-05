import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { resolveGeoHealth } from '@/lib/geo/digest-service'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const health = await resolveGeoHealth()
  return NextResponse.json(health, { status: health.ok ? 200 : 503 })
}
