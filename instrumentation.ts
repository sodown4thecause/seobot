/**
 * Next.js Instrumentation with Langfuse OpenTelemetry
 * 
 * Uses the new @langfuse/otel package with LangfuseSpanProcessor
 * for AI SDK 6 compatibility.
 * 
 * @see https://langfuse.com/docs/integrations/vercel-ai-sdk
 */

export async function register() {
  // Only run on Node.js runtime (not edge or browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Check if Langfuse is enabled (default to true if env vars are set)
    const langfuseEnabled =
      process.env.LANGFUSE_ENABLED !== 'false' &&
      process.env.LANGFUSE_SECRET_KEY &&
      process.env.LANGFUSE_PUBLIC_KEY;

    if (!langfuseEnabled) {
      console.log('[Langfuse] Tracing disabled (LANGFUSE_ENABLED=false or missing credentials)');
      return;
    }

    try {
      // Dynamic imports to avoid loading Node.js modules in non-Node contexts
      const { LangfuseSpanProcessor } = await import('@langfuse/otel');
      const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');

      // Optional: Filter out Next.js infrastructure spans to reduce noise
      const shouldExportSpan = (span: any) => {
        return span.otelSpan.instrumentationScope.name !== 'next.js';
      };

      // Support both LANGFUSE_BASEURL and LANGFUSE_BASE_URL for compatibility
      const baseUrl = process.env.LANGFUSE_BASEURL || 
                      process.env.LANGFUSE_BASE_URL || 
                      'https://cloud.langfuse.com'
      
      const debug = process.env.LANGFUSE_DEBUG === 'true'

      // Create LangfuseSpanProcessor with configuration
      const langfuseSpanProcessor = new LangfuseSpanProcessor({
        shouldExportSpan,
        // Langfuse credentials are read from environment variables:
        // LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL (or LANGFUSE_BASEURL)
        // Base URL is set via environment variable or defaults to cloud.langfuse.com
      });

      // Create and register the tracer provider
      const tracerProvider = new NodeTracerProvider({
        spanProcessors: [langfuseSpanProcessor],
      });

      tracerProvider.register();

      // Export span processor for forceFlush in API routes
      // @ts-ignore - exporting for use in API routes
      global.langfuseSpanProcessor = langfuseSpanProcessor;

      if (debug) {
        console.log('[Langfuse] OpenTelemetry instrumentation registered with LangfuseSpanProcessor');
        console.log('[Langfuse] Base URL:', baseUrl);
        console.log('[Langfuse] Debug mode: enabled');
      } else {
        console.log('[Langfuse] OpenTelemetry instrumentation registered with LangfuseSpanProcessor');
      }
    } catch (error) {
      console.error('[Langfuse] Failed to initialize OpenTelemetry:', error);
    }
  }
}












