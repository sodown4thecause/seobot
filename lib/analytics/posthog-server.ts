import 'server-only'

import { PostHog } from 'posthog-node'
import { serverEnv } from '@/lib/config/env'

let posthogClient: PostHog | null = null

function getPostHogClient(): PostHog | null {
  const key = serverEnv.NEXT_PUBLIC_POSTHOG_KEY
  const host = serverEnv.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  if (!key) {
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(key, { host })
  }

  return posthogClient
}

export async function captureServerProductEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): Promise<void> {
  const client = getPostHogClient()
  if (!client) {
    return
  }

  const cleanProps = properties
    ? Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined && value !== null)
      )
    : undefined

  client.capture({
    distinctId,
    event,
    properties: cleanProps,
  })

  await client.flush().catch(() => {})
}
