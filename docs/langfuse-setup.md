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
LANGFUSE_DEBUG=false  # Set to 'true' for debug logging
```

## Architecture

### Instrumentation (`instrumentation.ts`)

The OpenTelemetry instrumentation is registered at application startup:

```typescript
import { registerOTel } from '@vercel/otel';
import { LangfuseExporter } from 'langfuse-vercel';
import { serverEnv } from './lib/config/env';

export function register() {
  const langfuseEnabled = serverEnv.LANGFUSE_ENABLED !== 'false' && 
                          serverEnv.LANGFUSE_SECRET_KEY && 
                          serverEnv.LANGFUSE_PUBLIC_KEY;

  if (!langfuseEnabled) {
    console.log('[Langfuse] Tracing disabled');
    return;
  }

  registerOTel({
    serviceName: 'seo-platform',
    traceExporter: new LangfuseExporter({
      secretKey: serverEnv.LANGFUSE_SECRET_KEY!,
      publicKey: serverEnv.LANGFUSE_PUBLIC_KEY!,
      baseUrl: serverEnv.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
      debug: serverEnv.LANGFUSE_DEBUG === 'true',
    }),
  });
}
```

### Centralized Telemetry Helper (`lib/observability/langfuse.ts`)

All agents and API routes use the centralized `createTelemetryConfig()` helper:

```typescript
import { createTelemetryConfig } from '@/lib/observability/langfuse';

const result = await generateText({
  model: perplexity('sonar-pro'),
  prompt: '...',
  experimental_telemetry: createTelemetryConfig('research-agent', {
    topic: 'AI SEO',
    userId: user.id,
    // ... additional metadata
  }),
});
```

## Agents with Langfuse Integration

All major agents are instrumented:

1. **Research Agent** (`lib/agents/research-agent.ts`)
   - Function ID: `research-agent`
   - Provider: Perplexity
   - Metadata: topic, depth, userId, requestId

2. **Content Writer Agent** (`lib/agents/content-writer-agent.ts`)
   - Function ID: `content-writer` / `content-writer-revision`
   - Provider: Anthropic Claude Sonnet 4
   - Metadata: userId, contentType, topic, keywords, revisionRound

3. **EEAT QA Agent** (`lib/agents/eeat-qa-agent.ts`)
   - Function ID: `eeat-qa`
   - Provider: Anthropic Claude Sonnet 4
   - Metadata: userId, topic, contentLength, objective metrics

4. **SEO/AEO Agent** (`lib/agents/seo-aeo-agent.ts`)
   - Function ID: `seo-aeo`
   - Provider: Google Gemini 2.5 Flash
   - Metadata: userId, topic, keywords, targetPlatforms

5. **Enhanced Research Agent** (`lib/agents/enhanced-research-agent.ts`)
   - Uses Perplexity API (not directly AI SDK, but logged via MCP logger)

6. **Research Tool** (`lib/agents/tools.ts`)
   - Function ID: `research-tool`
   - Provider: Perplexity

## API Routes with Langfuse

1. **Chat API** (`app/api/chat/route.ts`)
   - Function ID: `chat-stream`
   - Comprehensive metadata including agent type, tools, conversation ID

2. **Content Generate API** (`app/api/content/generate/route.ts`)
   - Function ID: `content-generate-api`
   - Metadata: userId, topic, contentType, tone, keywords

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
   - Input/output (if not disabled)
   - Metadata (userId, topic, etc.)
   - Token usage
   - Latency

### Debug Mode

Enable debug logging:

```bash
LANGFUSE_DEBUG=true
```

This will log detailed telemetry information to help troubleshoot issues.

## Best Practices

1. **Consistent Function IDs**: Use descriptive, consistent function IDs
2. **Rich Metadata**: Include relevant context (userId, topic, etc.) in metadata
3. **Error Context**: Errors automatically include Langfuse context via error handlers
4. **Privacy**: Be mindful of sensitive data in metadata (use hashing if needed)

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

## Next Steps

- [ ] Set up Langfuse evaluations for content quality
- [ ] Configure prompt management in Langfuse
- [ ] Set up alerts for high error rates
- [ ] Create dashboards for cost tracking by user/agent

