import 'server-only'

import { after } from 'next/server'

/**
 * Schedule a Langfuse span flush after the response is sent.
 * Critical for serverless — ensures traces export before the function exits.
 */
export function scheduleLangfuseFlush(): void {
  const processor = global.langfuseSpanProcessor
  if (!processor) {
    return
  }

  after(async () => {
    try {
      await processor.forceFlush()
    } catch (error) {
      console.error('[Langfuse] forceFlush failed:', error)
    }
  })
}
