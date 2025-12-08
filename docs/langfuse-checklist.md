# Langfuse Readiness Checklist

## ✅ Configuration

- [x] **Environment Variables**: All Langfuse env vars configured in `lib/config/env.ts`
  - `LANGFUSE_ENABLED` (optional, defaults to true)
  - `LANGFUSE_SECRET_KEY` (required)
  - `LANGFUSE_PUBLIC_KEY` (required)
  - `LANGFUSE_BASEURL` or `LANGFUSE_BASE_URL` (optional, defaults to cloud.langfuse.com, both supported)
  - `LANGFUSE_DEBUG` (optional, for debugging)

- [x] **Instrumentation**: `instrumentation.ts` properly configured
  - Uses `@langfuse/otel` with `LangfuseSpanProcessor` for AI SDK 6 compatibility
  - Checks if Langfuse is enabled before registering
  - Properly configures `NodeTracerProvider` with `LangfuseSpanProcessor`
  - Exports `langfuseSpanProcessor` to global for forceFlush in API routes

- [x] **Next.js Config**: `next.config.ts` has `experimental.instrumentationHook: true`
  - Required for Next.js to load `instrumentation.ts`

## ✅ Centralized Helper

- [x] **Telemetry Helper**: `lib/observability/langfuse.ts` created
  - `isLangfuseEnabled()` - Checks if Langfuse is configured
  - `createTelemetryConfig()` - Standardized telemetry config with support for `userId`, `sessionId`, `langfuseTraceId`, `tags`
  - `getLangfuseConfig()` - Returns config for instrumentation (supports both `LANGFUSE_BASEURL` and `LANGFUSE_BASE_URL`)
  - `LangfuseStandardMetadata` interface - Type-safe standard Langfuse metadata fields

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
  - Includes: userId, sessionId (mapped from conversationId), agentType, conversationId, toolsCount, mcpToolsEnabled

- [x] **Content Generate API** (`app/api/content/generate/route.ts`)
  - Uses `createTelemetryConfig('content-generate-api', {...})`
  - Includes: userId, sessionId (generated per request), topic, contentType, tone, keywords

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
   - Look for: `[Langfuse] OpenTelemetry instrumentation registered with LangfuseSpanProcessor`
   - If `LANGFUSE_DEBUG=true`, you should also see base URL and debug mode confirmation

3. **Test Traces**:
   - Make a request to `/api/chat` or generate content
   - Check Langfuse dashboard for traces
   - **Verify queries are captured**: Each trace should show non-empty `input` (prompt) and `output` (response)
   - Verify metadata is present (userId, sessionId, functionId, etc.)

4. **Test Sessions**:
   - Make multiple chat requests with the same conversation ID
   - Check the **Sessions** tab in Langfuse dashboard
   - Verify traces are grouped by `sessionId` (conversation ID)
   - Each session should show all related traces

5. **Test Evaluations**:
   - Generate content via RAG writer orchestrator
   - Check Langfuse dashboard for evaluation traces (`evaluation:eeat_judge_v1`, `evaluation:content_quality_v1`)
   - Verify evaluation traces are linked to main content generation trace
   - Check that scores appear in trace details (EEAT score, depth score, factual score)

6. **Check Error Logging**:
   - Trigger an error in an agent
   - Verify error appears in Langfuse with proper context

## ✅ LangWatch Evaluations

- [x] **LangWatch Integration**: `lib/observability/langwatch.ts` wraps Langfuse Node SDK
  - Supports `userId`, `sessionId`, and `langfuseTraceId` for trace linking
  - Evaluation traces linked to parent traces via `langfuseTraceId`
  - Scores recorded via `generation.score()` API

- [x] **RAG Orchestrator Integration**: `lib/agents/rag-writer-orchestrator.ts`
  - Runs EEAT and Content Quality evaluations after each scoring round
  - Passes `userId`, `sessionId`, and `langfuseTraceId` to evaluation calls
  - Stores evaluation results in `content_quality_reviews` table

## Next Steps

- [x] Set up Langfuse evaluations for content quality (via LangWatch)
- [ ] Configure prompt management in Langfuse
- [ ] Set up alerts for high error rates
- [ ] Create dashboards for cost tracking by user/agent
- [ ] Set up Langfuse datasets for prompt testing

