# Problem Statement
The chat interface is not streaming responses in the multi\-agent RAG system\. Messages appear all at once after completion instead of streaming token\-by\-token\. The system uses AI SDK 6 \(`ai@6.0.0-beta.8`\), `@ai-sdk/react@2.0.97`, and Vercel AI Gateway\.
**CRITICAL**: The current AI SDK versions are severely outdated:
* Current: `ai@6.0.0-beta.8` → Latest: `ai@6.0.0-beta.105` \(97 versions behind\!\)
* Current: `@ai-sdk/react@2.0.97` → Should use: `@ai-sdk/react@3.0.0-beta.105` \(for AI SDK 6\)
Many streaming bugs and issues have been fixed in later betas\. **Upgrading is mandatory before debugging further\.**
# Current State Analysis
## Backend \(route\.ts\)
* Uses `streamText()` from AI SDK 6 correctly
* Returns `result.toUIMessageStreamResponse()` which is the correct method for AI SDK 6
* Model is accessed via `vercelGateway.languageModel('openai/gpt-4o')`
* Gateway provider wraps OpenAI with custom baseURL and headers
* Runtime is set to `edge`
## Frontend \(ai\-chat\-interface\.tsx\)
* Uses `useChat()` from `@ai-sdk/react`
* Passes messages directly to `append()` function
* Has `onFinish` callback but no `onError` handler showing errors
## Key Issues Identified
1. **Missing API endpoint in useChat**: The `useChat()` hook doesn't specify an `api` parameter, so it defaults to `/api/chat` but may not be configured correctly
2. **Message format mismatch**: The hook uses `append({ role: 'user', content: data.text })` but AI SDK 6 expects a specific message format
3. **No streaming protocol specified**: AI SDK 6 supports different stream protocols, and the default may not match what's being sent
4. **Gateway configuration**: The Vercel Gateway might not be properly configured for streaming
5. **Edge runtime**: Edge runtime can sometimes have issues with streaming depending on deployment platform
# Root Cause Analysis
Based on the AI SDK 6 documentation:
* The `toUIMessageStreamResponse()` method returns a proper streaming response
* The `useChat()` hook should automatically handle streaming when configured correctly
* The issue is likely in the **connection between frontend and backend** OR **how messages are being sent**
## Most Likely Causes \(Priority Order\)
1. **Missing explicit API endpoint**: `useChat()` needs explicit `api: '/api/chat'` configuration
2. **Incorrect message sending**: Should use `sendMessage({ text: input })` not `append()`
3. **Body parameter format**: The `body` option should match what the backend expects
4. **Stream protocol mismatch**: Frontend and backend may be using different protocols
5. **Gateway streaming configuration**: The Vercel Gateway proxy might not preserve streaming
# Proposed Solution
## Step 0: Upgrade AI SDK to Latest Beta \(MUST DO FIRST\)
**This is the most critical step** \- upgrade to the latest AI SDK 6 beta which has 97\+ bug fixes since beta\.8:
```warp-runnable-command
npm install ai@beta @ai-sdk/react@beta @ai-sdk/openai@latest @ai-sdk/google@latest @ai-sdk/gateway@latest
```
Expected versions:
* `ai@6.0.0-beta.105` \(from `6.0.0-beta.8`\)
* `@ai-sdk/react@3.0.0-beta.105` \(from `2.0.97`\)
* `@ai-sdk/openai@latest`
* `@ai-sdk/google@latest`
* `@ai-sdk/gateway@latest`
Note: AI SDK 6 has minimal breaking changes, but `@ai-sdk/react@3.x` is required for AI SDK 6 compatibility\.
After upgrade:
1. Clear node\_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
2. Check for any TypeScript errors
3. Review migration guide: [https://v6\\\.ai\\\-sdk\\\.dev/docs/introduction](https://v6.ai-sdk.dev/docs/introduction)
## Step 1: Fix Frontend useChat Configuration
Update `ai-chat-interface.tsx` to use the correct AI SDK 6 pattern:
* Explicitly set `api: '/api/chat'`
* Use `sendMessage()` instead of `append()` for sending messages
* Add proper error handling with `onError`
* Ensure `body` parameter correctly passes context
* Add streaming status handling
## Step 2: Verify Backend Streaming Response
Ensure `route.ts` is correctly configured:
* Confirm `toUIMessageStreamResponse()` is being called
* Add error logging for streaming failures
* Verify the response headers are correct for streaming
* Check that the gateway provider doesn't block streaming
## Step 3: Update Gateway Provider for Streaming
Modify `gateway-provider.ts` to ensure streaming works:
* Verify the OpenAI client configuration supports streaming
* Ensure headers don't interfere with streaming
* Test with direct OpenAI provider first, then gateway
## Step 4: Add Response Headers for Streaming
Ensure proper HTTP headers in the backend:
* `Content-Type: text/event-stream` or appropriate streaming type
* `Cache-Control: no-cache`
* `Connection: keep-alive`
* `Transfer-Encoding: chunked` \(handled by `toUIMessageStreamResponse()` but verify\)
## Step 5: Test and Validate
* Test with simple prompt to verify streaming works
* Check browser Network tab to see if response is actually streaming
* Verify SSE \(Server\-Sent Events\) are being received
* Test with both Gateway and direct provider
# Implementation Details
## Frontend Changes \(ai\-chat\-interface\.tsx\)
```typescript
const chat = useChat({
  api: '/api/chat', // Explicit API endpoint
  body: { context }, // Pass context correctly  
  streamProtocol: 'ui-message', // AI SDK 6 default, but explicit
  initialMessages: initialMessage ? [{ role: 'assistant', content: initialMessage, id: 'initial' }] : undefined,
  onFinish: (message) => {
    console.log('[Chat] Message finished:', message)
    scrollToBottom()
  },
  onError: (error) => {
    console.error('[Chat] Stream error:', error)
    // Show user-friendly error
  },
})
// Use sendMessage instead of append
const sendMessage = (data: { text: string }) => {
  if (chat?.sendMessage) {
    chat.sendMessage({ text: data.text })
  }
}
```
## Backend Changes \(route\.ts\)
Add explicit streaming headers \(though `toUIMessageStreamResponse()` should handle this\):
```typescript
const result = streamText({
  model: vercelGateway.languageModel(CHAT_MODEL_ID),
  messages: messages as any,
  system: systemPrompt,
  tools: allTools,
  experimental_telemetry: {
    isEnabled: true,
    functionId: "chat-api",
    metadata: {
      environment: process.env.NODE_ENV || "development",
      runtime: "edge",
      model: CHAT_MODEL_ID,
      provider: "gateway",
    },
  },
  onFinish: async ({ response }) => {
    // ... existing code
  },
  onError: (error) => {
    console.error('[Chat API] Streaming error:', error)
  },
})
return result.toUIMessageStreamResponse({
  headers: {
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
})
```
## Gateway Provider Changes \(gateway\-provider\.ts\)
Ensure streaming is not blocked:
```typescript
const gateway = serverEnv.AI_GATEWAY_API_KEY
  ? createOpenAI({
      baseURL: serverEnv.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1',
      apiKey: serverEnv.AI_GATEWAY_API_KEY,
      // Remove duplicate Authorization header as apiKey should handle it
      // headers: { 'Authorization': `Bearer ${serverEnv.AI_GATEWAY_API_KEY}` },
    })
  : null
```
# Testing Strategy
1. Test with browser DevTools Network tab open to see actual streaming
2. Add console logs to track when chunks arrive
3. Test fallback: Use direct OpenAI provider without gateway first
4. Verify SSE format in Network tab \(should see `data:` prefixed chunks\)
5. Test with simple prompt like "Count to 10 slowly"
# Success Criteria
* Messages stream token\-by\-token in real\-time
* No delay before first token appears
* Loading state shows correctly during streaming
* Error handling works properly
* Tool calls stream correctly
* Works with both Gateway and direct providers
