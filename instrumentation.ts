/**
 * Next.js instrumentation — registers Langfuse OpenTelemetry and AI SDK telemetry.
 * Loaded when experimental.instrumentationHook is enabled in next.config.ts.
 */

import { registerTelemetry } from 'ai'
import { OpenTelemetry } from '@ai-sdk/otel'
import { isLangfuseEnabled, getLangfuseConfig } from '@/lib/observability/langfuse'

declare global {
  // eslint-disable-next-line no-var
  var langfuseSpanProcessor: { forceFlush: () => Promise<void> } | undefined
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!isLangfuseEnabled()) {
      console.log('[Langfuse] Tracing disabled — missing keys or LANGFUSE_ENABLED=false')
    } else {
      const { LangfuseSpanProcessor } = await import('@langfuse/otel')
      const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node')

      const config = getLangfuseConfig()

      const langfuseSpanProcessor = new LangfuseSpanProcessor({
        baseUrl: config.baseUrl,
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

}
