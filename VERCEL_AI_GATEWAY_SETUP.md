# Vercel AI Gateway Setup Guide

This guide explains how the platform uses Vercel AI Gateway for unified AI provider management with automatic fallbacks and observability.

## Overview

All AI model requests are routed through Vercel AI Gateway, providing:
- **Unified API**: Single interface for all AI providers
- **Automatic Fallbacks**: Gemini → OpenAI fallback chain
- **Cost Optimization**: Route to most cost-effective model
- **Observability**: Built-in telemetry via Axiom
- **Rate Limiting**: Provider-level rate limit handling
- **Caching**: Response caching for identical requests

## Architecture

```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Vercel AI Gateway      │
│  (Unified Routing)      │
└────────┬────────────────┘
         │
    ┌────┴────┬────────┬──────────┐
    ▼         ▼        ▼          ▼
┌────────┐ ┌──────┐ ┌──────┐ ┌──────────┐
│ Gemini │ │ GPT-4│ │Claude│ │Perplexity│
│(Primary)│ │(Fall)│ │ (QA) │ │(Research)│
└────────┘ └──────┘ └──────┘ └──────────┘
         │
         ▼
    ┌────────┐
    │ Axiom  │
    │(Logs)  │
    └────────┘
```

## Provider Configuration

### 1. Chat & Content Generation

**Primary**: Google Gemini 2.0 Flash  
**Fallback**: OpenAI GPT-4  
**Use Cases**: Content writing, chat interface, general queries

```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

const geminiModel = createGoogleGenerativeAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.GOOGLE_API_KEY,
})('gemini-2.0-flash-exp')

const openaiModel = createOpenAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.OPENAI_API_KEY,
})('gpt-4')

// Use with automatic fallback
const result = await generateText({
  model: geminiModel,
  prompt: 'Your prompt here',
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'content-generation',
  },
})
```

### 2. QA & Review

**Primary**: Anthropic Claude Sonnet 4  
**Fallback**: OpenAI GPT-4  
**Use Cases**: EEAT QA, content review, quality assessment

```typescript
import { createAnthropic } from '@ai-sdk/anthropic'

const claudeModel = createAnthropic({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.ANTHROPIC_API_KEY,
})('claude-sonnet-4-20250514')

const qaResult = await generateObject({
  model: claudeModel,
  schema: qaReportSchema,
  prompt: 'Review this content...',
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'eeat-qa',
  },
})
```

### 3. Research

**Primary**: Perplexity Sonar Pro  
**Fallback**: Google Gemini 2.0 Flash  
**Use Cases**: Web research, fact-checking, trend analysis

```typescript
import { createOpenAI } from '@ai-sdk/openai'

const perplexityModel = createOpenAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.PERPLEXITY_API_KEY,
  compatibility: 'strict',
})('sonar-pro')

const research = await generateText({
  model: perplexityModel,
  prompt: 'Research latest trends in...',
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'research',
  },
})
```

### 4. Embeddings

**Primary**: OpenAI text-embedding-3-small  
**Fallback**: OpenAI text-embedding-ada-002  
**Use Cases**: RAG, semantic search, document similarity

```typescript
import { embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const embeddingModel = createOpenAI({
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  apiKey: process.env.OPENAI_API_KEY,
}).embedding('text-embedding-3-small')

const { embedding } = await embed({
  model: embeddingModel,
  value: 'Text to embed',
})
```

## Axiom Integration

### Setup

1. **Create Axiom Account**: https://axiom.co
2. **Create Dataset**: e.g., `seo-platform-production`
3. **Get API Token**: Settings → API Tokens
4. **Configure Environment Variables**:
   ```env
   AXIOM_TOKEN=xaat-your-token-here
   AXIOM_DATASET=seo-platform-production
   ```

### AI SDK Telemetry

Enable telemetry in all AI SDK calls:

```typescript
import { generateText } from 'ai'

const result = await generateText({
  model: yourModel,
  prompt: 'Your prompt',
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'unique-function-id', // e.g., 'content-generation'
    metadata: {
      userId: user.id,
      agentType: 'content-writer',
      contentType: 'blog',
    },
  },
})
```

### What Gets Logged

Axiom automatically captures:
- **Request Details**: Model, prompt tokens, completion tokens
- **Response Details**: Generated text, finish reason, duration
- **Costs**: Estimated cost per request
- **Errors**: Provider errors, fallback triggers
- **Metadata**: Custom metadata from telemetry config

### Querying Logs

```apl
// Find all content generation requests
['seo-platform-production']
| where functionId == 'content-generation'
| summarize count(), avg(duration), sum(totalTokens) by model

// Find expensive requests
['seo-platform-production']
| where totalTokens > 10000
| project timestamp, functionId, model, totalTokens, estimatedCost

// Find errors and fallbacks
['seo-platform-production']
| where isError == true or fallbackTriggered == true
| project timestamp, functionId, model, errorMessage
```

## Fallback Strategy

### Automatic Fallbacks

The gateway automatically falls back when:
- Primary provider returns 5xx error
- Rate limit exceeded (429)
- Timeout (>30s)
- Model unavailable

### Manual Fallback Implementation

```typescript
async function generateWithFallback(prompt: string) {
  try {
    return await generateText({
      model: geminiModel,
      prompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'content-generation',
      },
    })
  } catch (error) {
    console.error('Gemini failed, falling back to OpenAI:', error)
    
    return await generateText({
      model: openaiModel,
      prompt,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'content-generation-fallback',
        metadata: { fallbackReason: error.message },
      },
    })
  }
}
```

## Cost Optimization

### Model Selection Strategy

1. **Gemini 2.0 Flash**: Cheapest, fastest for most tasks
2. **GPT-4**: Higher quality, use for complex tasks or fallback
3. **Claude Sonnet 4**: Best for QA/review tasks
4. **Perplexity Sonar Pro**: Best for research with citations

### Cost Tracking

```typescript
// Track costs in database
await supabase.from('api_usage').insert({
  user_id: userId,
  endpoint: 'content-generation',
  model_used: 'gemini-2.0-flash-exp',
  tokens_used: result.usage.totalTokens,
  cost_usd: estimateCost(result.usage, 'gemini-2.0-flash-exp'),
})
```

### Caching Strategy

```typescript
// Cache expensive research results
const cacheKey = `research:${hash(prompt)}`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const result = await generateText({ model, prompt })
await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600) // 1 hour
return result
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Request Volume**: Requests per minute/hour
2. **Token Usage**: Total tokens consumed
3. **Cost**: Daily/monthly spend
4. **Latency**: p50, p95, p99 response times
5. **Error Rate**: Failed requests percentage
6. **Fallback Rate**: How often fallbacks are triggered

### Axiom Alerts

Create alerts for:
- High error rate (>1%)
- High cost (>$100/day)
- Slow responses (p95 >5s)
- Frequent fallbacks (>10%)

## Environment Variables

```env
# Vercel AI Gateway
VERCEL_AI_GATEWAY_URL=https://gateway.vercel.ai/v1

# AI Provider Keys (used via gateway)
GOOGLE_API_KEY=your-google-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key

# Axiom Observability
AXIOM_TOKEN=xaat-your-token
AXIOM_DATASET=seo-platform-production
```

## Best Practices

1. **Always Enable Telemetry**: Use `experimental_telemetry` in all AI SDK calls
2. **Use Descriptive Function IDs**: Makes filtering in Axiom easier
3. **Add Metadata**: Include userId, agentType, contentType for better insights
4. **Implement Fallbacks**: Don't rely on a single provider
5. **Cache Aggressively**: Reduce costs and improve performance
6. **Monitor Costs**: Set up daily budget alerts
7. **Test Fallbacks**: Regularly test fallback scenarios
8. **Review Logs**: Weekly review of Axiom logs for optimization opportunities

## Troubleshooting

### Gateway Not Working

1. Check `VERCEL_AI_GATEWAY_URL` is set correctly
2. Verify API keys are valid
3. Check Vercel AI Gateway dashboard for errors
4. Review Axiom logs for error messages

### High Costs

1. Review Axiom logs for high token usage
2. Implement caching for repeated queries
3. Use cheaper models (Gemini) where possible
4. Set usage caps per user

### Slow Responses

1. Check Axiom for latency metrics
2. Implement streaming for long responses
3. Use faster models (Gemini Flash)
4. Add timeout handling

### Fallbacks Not Triggering

1. Verify fallback logic is implemented
2. Check error handling in code
3. Review Axiom logs for error types
4. Test manually with provider outages

## Additional Resources

- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/)
- [Axiom Docs](https://axiom.co/docs)
- [AI SDK Telemetry Guide](https://sdk.vercel.ai/docs/ai-sdk-core/telemetry)

