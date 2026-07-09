/**
 * Next.js instrumentation — registers Langfuse OpenTelemetry and AI SDK telemetry.
 * Loaded when experimental.instrumentationHook is enabled in next.config.ts.
 */

import { registerTelemetry } from 'ai'
import { OpenTelemetry } from '@ai-sdk/otel'
import { isLangfuseEnabled, getLangfuseConfig } from '@/lib/observability/langfuse'
import * as Sentry from '@sentry/nextjs'

declare global {
  // eslint-disable-next-line no-var
  var langfuseSpanProcessor: { forceFlush: () => Promise<void> } | undefined
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')

    if (!isLangfuseEnabled()) {
      console.log('[Langfuse] Tracing disabled — missing keys or LANGFUSE_ENABLED=false')
    } else {
      const { LangfuseSpanProcessor } = await import('@langfuse/otel')
      const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node')

      const config = getLangfuseConfig()

      const langfuseSpanProcessor = new LangfuseSpanProcessor({
        shouldExportSpan: (span) =>
          span.otelSpan.instrumentationScope.name !== 'next.js',
      })

      const tracerProvider = new NodeTracerProvider({
        spanProcessors: [langfuseSpanProcessor],
      })

      tracerProvider.register()

      registerTelemetry(new OpenTelemetry())

      global.langfuseSpanProcessor = langfuseSpanProcessor

      console.log('[Langfuse] OpenTelemetry instrumentation registered with LangfuseSpanProcessor', {
        baseUrl: config.baseUrl,
        debug: config.debug,
      })
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
