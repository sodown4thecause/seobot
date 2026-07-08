import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSearchConsoleConnections } from '@/lib/search-console/store'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await getSearchConsoleConnections(userId)
  return NextResponse.json(connections)
}
