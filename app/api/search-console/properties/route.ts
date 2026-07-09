import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { listSearchConsoleSites } from '@/lib/search-console/client'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const properties = await listSearchConsoleSites(userId)
    return NextResponse.json({ ok: true, properties })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load Search Console properties',
      },
      { status: 400 }
    )
  }
}
