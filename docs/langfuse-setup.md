# Langfuse Setup & Configuration Guide

## Overview

Langfuse is integrated into the SEO Platform for comprehensive AI observability, tracing, and monitoring. This document outlines the setup, configuration, and usage.

## Prerequisites

1. **Langfuse Account**: Sign up at [cloud.langfuse.com](https://cloud.langfuse.com) or self-host Langfuse
2. **API Keys**: Get your `LANGFUSE_SECRET_KEY` and `LANGFUSE_PUBLIC_KEY` from your Langfuse project settings

## Environment Variables

Add these to your `.env.local` file:

```bash
# Langfuse Configuration
LANGFUSE_ENABLED=true  # Set to 'false' to disable (defaults to true if keys are present)
LANGFUSE_SECRET_KEY=sk-lf-...  # Your Langfuse secret key
LANGFUSE_PUBLIC_KEY=pk-lf-...  # Your Langfuse public key
LANGFUSE_BASEURL=https://cloud.langfuse.com  # EU region (use https://us.cloud.langfuse.com for US)
# Note: Both LANGFUSE_BASEURL and LANGFUSE_BASE_URL are supported for compatibility
LANGFUSE_DEBUG=false  # Set to 'true' for debug logging
```

## Architecture

### Instrumentation (`instrumentation.ts`)

The OpenTelemetry instrumentation uses `@langfuse/otel` with `LangfuseSpanProcessor` for AI SDK 6 compatibility:

```typescript
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

export async function register() {
  // Only run on Node.js runtime (not edge or browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const langfuseEnabled =
      process.env.LANGFUSE_ENABLED !== 'false' &&
      process.env.LANGFUSE_SECRET_KEY &&
      process.env.LANGFUSE_PUBLIC_KEY;

    if (!langfuseEnabled) {
      console.log('[Langfuse] Tracing disabled');
      return;
    }

    const { LangfuseSpanProcessor } = await import('@langfuse/otel');
    const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');

    const langfuseSpanProcessor = new LangfuseSpanProcessor({
      shouldExportSpan: (span) => {
        return span.otelSpan.instrumentationScope.name !== 'next.js';
      },
    });

    const tracerProvider = new NodeTracerProvider({
      spanProcessors: [langfuseSpanProcessor],
    });

    tracerProvider.register();
    
    // Export for forceFlush in API routes
    global.langfuseSpanProcessor = langfuseSpanProcessor;
  }
}
```

**Note**: Ensure `next.config.ts` has `experimental.instrumentationHook: true` for this to work.

### Centralized Telemetry Helper (`lib/observability/langfuse.ts`)

All agents and API routes use the centralized `createTelemetryConfig()` helper, which supports standard Langfuse fields:

```typescript
import { createTelemetryConfig } from '@/lib/observability/langfuse';

const result = await generateText({
  model: perplexity('sonar-pro'),
  prompt: '...',
  experimental_telemetry: createTelemetryConfig('research-agent', {
    // Standard Langfuse fields (recognized for user/session tracking and trace grouping)
    userId: user.id,              // Langfuse user tracking
    sessionId: conversationId,    // Langfuse session grouping
    langfuseTraceId: parentTraceId, // Group spans under parent trace
    
    // Custom metadata
    topic: 'AI SEO',
    // ... additional metadata
  }),
});
```

**Key Langfuse Metadata Fields**:
- `userId`: Links traces to users (enables Users tab in Langfuse)
- `sessionId`: Groups related traces into sessions (enables Sessions tab)
- `langfuseTraceId`: Groups multiple AI SDK spans under one parent trace
- `tags`: Array of strings for filtering and organization

## Agents with Langfuse Integration

All major agents are instrumented:

1. **Research Agent** (`lib/agents/research-agent.ts`)
   - Function ID: `research-agent`
   - Provider: Perplexity
   - Metadata: userId, sessionId, langfuseTraceId, topic, depth, requestId

2. **Content Writer Agent** (`lib/agents/content-writer-agent.ts`)
   - Function ID: `content-writer` / `content-writer-revision`
   - Provider: Anthropic Claude Sonnet 4
   - Metadata: userId, sessionId, langfuseTraceId, contentType, topic, keywords, revisionRound

3. **EEAT QA Agent** (`lib/agents/eeat-qa-agent.ts`)
   - Function ID: `eeat-qa`
   - Provider: Anthropic Claude Sonnet 4
   - Metadata: userId, sessionId, langfuseTraceId, topic, contentLength, objective metrics

4. **SEO/AEO Agent** (`lib/agents/seo-aeo-agent.ts`)
   - Function ID: `seo-aeo`
   - Provider: Google Gemini 2.5 Flash
   - Metadata: userId, sessionId, langfuseTraceId, topic, keywords, targetPlatforms

5. **Enhanced Research Agent** (`lib/agents/enhanced-research-agent.ts`)
   - Uses Perplexity API (not directly AI SDK, but logged via MCP logger)

6. **Research Tool** (`lib/agents/tools.ts`)
   - Function ID: `research-tool`
   - Provider: Perplexity

## API Routes with Langfuse

1. **Chat API** (`app/api/chat/route.ts`)
   - Function ID: `chat-stream`
   - Metadata: userId, sessionId (mapped from conversationId), agentType, tools, conversationId

2. **Content Generate API** (`app/api/content/generate/route.ts`)
   - Function ID: `content-generate-api`
   - Metadata: userId, sessionId (generated per request), topic, contentType, tone, keywords

## Error Handling Integration

Langfuse telemetry works seamlessly with error handling:

- Errors are logged via `logAgentExecution()` which includes Langfuse context
- Retry attempts are tracked in Langfuse traces
- Provider errors include Langfuse metadata for debugging

## Verification

### Check Instrumentation

1. Start your dev server: `npm run dev`
2. Look for this log: `[Langfuse] OpenTelemetry instrumentation registered`
3. If you see `[Langfuse] Tracing disabled`, check your environment variables

### Verify Traces

1. Make a request to `/api/chat` or use any agent
2. Check your Langfuse dashboard
3. Traces should appear within a few seconds
4. Each trace should include:
   - Function ID
   - Model used
   - **Input/output** (prompts and responses automatically captured by AI SDK)
   - Metadata (userId, sessionId, topic, etc.)
   - Token usage
   - Latency

### Verify Sessions

1. Make multiple requests to `/api/chat` with the same conversation ID
2. Check the **Sessions** tab in Langfuse dashboard
3. Sessions should be grouped by `sessionId` (conversation ID for chat)
4. All traces from the same session should appear grouped together

### Verify Evaluations

1. Generate content via the RAG writer orchestrator (`/api/content/generate` or content generation flow)
2. Check Langfuse dashboard for traces with evaluation scores
3. Look for traces named `evaluation:eeat_judge_v1` and `evaluation:content_quality_v1`
4. These should be linked to the main content generation trace via `langfuseTraceId`
5. Scores should appear in the trace details (EEAT score, depth score, factual score, etc.)

### Debug Mode

Enable debug logging:

```bash
LANGFUSE_DEBUG=true
```

This will log detailed telemetry information to help troubleshoot issues.

## Best Practices

1. **Consistent Function IDs**: Use descriptive, consistent function IDs
2. **Always Include userId**: Pass `userId` wherever available to enable user tracking
3. **Session Tracking**: Use `sessionId` to group related traces (e.g., conversation ID for chat, content ID for generation)
4. **Trace Grouping**: Use `langfuseTraceId` to group multiple AI SDK spans under one parent trace (e.g., RAG orchestrator grouping all agent calls)
5. **Rich Metadata**: Include relevant context (topic, keywords, etc.) in metadata
6. **Error Context**: Errors automatically include Langfuse context via error handlers
7. **Privacy**: Be mindful of sensitive data in metadata (use hashing if needed)

## Troubleshooting

### Traces Not Appearing

1. Check environment variables are set correctly
2. Verify `instrumentation.ts` is being loaded (check Next.js logs)
3. Ensure `experimental.instrumentationHook: true` in `next.config.ts`
4. Check Langfuse dashboard for API errors

### High Latency

- Langfuse telemetry adds minimal overhead (<10ms typically)
- If experiencing issues, check network connectivity to Langfuse
- Consider using self-hosted Langfuse for lower latency

### Missing Traces

- Ensure `experimental_telemetry.isEnabled` is `true`
- Check that the function ID is unique and descriptive
- Verify the AI SDK call is actually executing (check logs)

## LangWatch Evaluations

The platform uses LangWatch (wrapper around Langfuse Node SDK) for LLM-as-a-judge evaluations:

- **EEAT Evaluations**: Automatically run after content generation via `rag-writer-orchestrator.ts`
- **Content Quality Evaluations**: Scored against multiple dimensions (relevance, depth, factual accuracy)
- **Trace Linking**: Evaluation traces are linked to main content generation traces via `langfuseTraceId`
- **Scores**: Evaluation scores appear in Langfuse as generation scores attached to evaluation traces

## Next Steps

- [x] Set up Langfuse evaluations for content quality (via LangWatch)
- [ ] Configure prompt management in Langfuse
- [ ] Set up alerts for high error rates
- [ ] Create dashboards for cost tracking by user/agent
- [ ] Set up Langfuse datasets for prompt testing

