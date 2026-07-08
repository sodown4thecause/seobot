import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/auth-schema'
import { hasGoogleSearchConsoleScope } from '@/lib/search-console/client'

export const runtime = 'nodejs'

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [account] = await db
      .select({ scope: authSchema.account.scope })
      .from(authSchema.account)
      .where(and(
        eq(authSchema.account.userId, userId),
        eq(authSchema.account.providerId, 'google'),
      ))
      .limit(1)

    if (!account) {
      return NextResponse.json({ ok: true, needsReconnect: false, hasGoogleAccount: false })
    }

    const needsReconnect = !hasGoogleSearchConsoleScope(account.scope)
    return NextResponse.json({ ok: true, needsReconnect, hasGoogleAccount: true })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to check Google Search Console scope',
      },
      { status: 400 }
    )
  }
}