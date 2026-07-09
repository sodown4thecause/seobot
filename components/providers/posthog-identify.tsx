'use client'

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { identifyPostHogUser, resetPostHogUser } from '@/components/providers/analytics-provider'

/**
 * Identifies the signed-in user in PostHog for product analytics.
 */
export function PostHogIdentify() {
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) {
      return
    }
    const userId = session?.user?.id
    if (userId) {
      identifyPostHogUser(userId, {
        email: session.user.email ?? '',
      })
      return
    }
    resetPostHogUser()
  }, [session?.user?.id, session?.user?.email, isPending])

  return null
}
