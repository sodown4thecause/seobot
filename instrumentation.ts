/**
 * Next.js instrumentation — registers Langfuse OpenTelemetry and AI SDK telemetry.
 * Loaded when experimental.instrumentationHook is enabled in next.config.ts.
 */

import { registerTelemetry } from 'ai'
import { OpenTelemetry } from '@ai-sdk/otel'
import { isLangfuseEnabled, getLangfuseConfig } from '@/lib/observability/langfuse'

declare global {
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

type RequestErrorRequest = {
  path: string
  method: string
}

type RequestErrorContext = {
  routerKind?: string
  routePath?: string
  routeType?: string
  renderSource?: string
  revalidateReason?: string
  renderType?: string
}

export async function onRequestError(
  error: unknown,
  request: RequestErrorRequest,
  context: RequestErrorContext
) {
  const { captureServerException } = await import('@/lib/analytics/posthog-server')
  await captureServerException(error, {
    distinctId: 'server',
    properties: {
      runtime: process.env.NEXT_RUNTIME,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
      renderType: context.renderType,
    },
  })
}
