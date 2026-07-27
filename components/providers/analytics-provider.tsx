'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!posthogKey) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}

export function identifyPostHogUser(userId: string, traits?: Record<string, string | number | boolean>) {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }
  posthog.identify(userId, traits)
}

export function resetPostHogUser() {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }
  posthog.reset()
}

export function captureClientException(
  error: unknown,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }

  const cleanProperties = properties
    ? Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
      )
    : undefined

  posthog.captureException(error, cleanProperties)
}

export function captureProductEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }
  const cleanProps = properties
    ? Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
      )
    : undefined
  posthog.capture(event, cleanProps)
}
