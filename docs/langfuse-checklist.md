# Langfuse Readiness Checklist

## ✅ Configuration

- [x] **Environment Variables**: All Langfuse env vars configured in `lib/config/env.ts`
  - `LANGFUSE_ENABLED` (optional, defaults to true)
  - `LANGFUSE_SECRET_KEY` (required)
  - `LANGFUSE_PUBLIC_KEY` (required)
  - `LANGFUSE_BASEURL` (optional, defaults to cloud.langfuse.com)
  - `LANGFUSE_DEBUG` (optional, for debugging)

- [x] **Instrumentation**: `instrumentation.ts` properly configured
  - Uses `serverEnv` for secure access
  - Checks if Langfuse is enabled before registering
  - Properly configures `LangfuseExporter`

- [x] **Next.js Config**: `next.config.ts` has `instrumentationHook: true`
  - Required for Next.js to load `instrumentation.ts`

## ✅ Centralized Helper

- [x] **Telemetry Helper**: `lib/observability/langfuse.ts` created
  - `isLangfuseEnabled()` - Checks if Langfuse is configured
  - `createTelemetryConfig()` - Standardized telemetry config
  - `getLangfuseConfig()` - Returns config for instrumentation

## ✅ Agents Instrumented

- [x] **Research Agent** (`lib/agents/research-agent.ts`)
  - Uses `createTelemetryConfig('research-agent', {...})`
  - Includes: topic, depth, userId, requestId, provider, model

- [x] **Content Writer Agent** (`lib/agents/content-writer-agent.ts`)
  - Uses `createTelemetryConfig('content-writer', {...})`
  - Includes: userId, contentType, topic, keywords, revisionRound, provider, model

- [x] **EEAT QA Agent** (`lib/agents/eeat-qa-agent.ts`)
  - Uses `createTelemetryConfig('eeat-qa', {...})`
  - Includes: userId, topic, contentLength, objective metrics, provider, model

- [x] **SEO/AEO Agent** (`lib/agents/seo-aeo-agent.ts`)
  - Uses `createTelemetryConfig('seo-aeo', {...})`
  - Includes: userId, topic, keywords, targetPlatforms, provider, model

- [x] **Research Tool** (`lib/agents/tools.ts`)
  - Uses `createTelemetryConfig('research-tool', {...})`
  - Includes: query, depth, provider, model

## ✅ API Routes Instrumented

- [x] **Chat API** (`app/api/chat/route.ts`)
  - Uses `createTelemetryConfig('chat-stream', {...})`
  - Includes: userId, agentType, conversationId, toolsCount, mcpToolsEnabled

- [x] **Content Generate API** (`app/api/content/generate/route.ts`)
  - Uses `createTelemetryConfig('content-generate-api', {...})`
  - Includes: userId, topic, contentType, tone, keywords

## ✅ Additional Services

- [x] **Humanization Service** (`lib/external-apis/humanization-service.ts`)
  - Uses `createTelemetryConfig('humanization-service', {...})`
  - Includes: hasGuidance, contentLength, provider, model

- [x] **Image Generation** (`lib/ai/image-generation.ts`)
  - Image suggestions: `createTelemetryConfig('image-suggestions', {...})`
  - Prompt enhancement: `createTelemetryConfig('image-prompt-enhance', {...})`
  - Alt text generation: `createTelemetryConfig('image-alt-text-generation', {...})`
  - Image editing: `createTelemetryConfig('image-edit', {...})`

## ✅ Error Handling Integration

- [x] **Error Logger** (`lib/errors/logger.ts`)
  - `logError()` includes Langfuse context
  - `logAgentExecution()` wraps agent calls with error logging

- [x] **Agent Retry** (`lib/errors/retry.ts`)
  - `withAgentRetry()` preserves Langfuse context through retries
  - Errors include agent/provider metadata for Langfuse

## ✅ Documentation

- [x] **Setup Guide**: `docs/langfuse-setup.md` created
  - Environment setup instructions
  - Architecture overview
  - Agent and API route documentation
  - Troubleshooting guide

- [x] **Readme**: `langfuse.md` exists with general information

## Verification Steps

1. **Check Environment Variables**:
   ```bash
   npm run validate:env
   ```

2. **Verify Instrumentation**:
   - Start dev server: `npm run dev`
   - Look for: `[Langfuse] OpenTelemetry instrumentation registered`

3. **Test Traces**:
   - Make a request to `/api/chat`
   - Check Langfuse dashboard for traces
   - Verify metadata is present

4. **Check Error Logging**:
   - Trigger an error in an agent
   - Verify error appears in Langfuse with proper context

## Next Steps

- [ ] Set up Langfuse evaluations for content quality
- [ ] Configure prompt management in Langfuse
- [ ] Set up alerts for high error rates
- [ ] Create dashboards for cost tracking by user/agent
- [ ] Implement LLM-as-a-judge evaluations

