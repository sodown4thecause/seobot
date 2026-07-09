import 'server-only'

import { after } from 'next/server'
import { appLogger } from '@/lib/observability/app-logger'

export function scheduleLangfuseFlush(): void {
  const processor = global.langfuseSpanProcessor
  if (!processor) {
    return
  }

  after(async () => {
    try {
      await processor.forceFlush()
    } catch (error) {
      appLogger.error('Langfuse forceFlush failed', {
        metadata: { error: error instanceof Error ? error.message : String(error) },
      })
    }
  })
}
