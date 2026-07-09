'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

let initialized = false

function initPostHog() {
  if (typeof window === 'undefined' || !posthogKey || initialized) {
    return
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  })
  initialized = true
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  if (!posthogKey) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}

export function identifyPostHogUser(userId: string, traits?: Record<string, string | number | boolean>) {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }
  initPostHog()
  posthog.identify(userId, traits)
}

export function resetPostHogUser() {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }
  posthog.reset()
}

export function captureProductEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
) {
  if (!posthogKey || typeof window === 'undefined') {
    return
  }
  initPostHog()
  const cleanProps = properties
    ? Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
      )
    : undefined
  posthog.capture(event, cleanProps)
}
