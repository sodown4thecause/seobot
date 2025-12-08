# LangWatch Integration Guide

## Overview

LangWatch provides LLM-as-a-judge evaluation and telemetry integration for the multi-agent pipeline. This integration enables data-driven improvements to content quality and system performance through automated quality assessment and continuous monitoring.

## Architecture

LangWatch is implemented as a wrapper around Langfuse's evaluation API, providing a compatible interface for LLM-as-a-judge evaluations. The integration consists of:

1. **LangWatch Client** (`lib/observability/langwatch.ts`): Core SDK for logging traces and running evaluations
2. **Evaluation Schemas** (`lib/observability/evaluation-schemas.ts`): Defined schemas for different agent types
3. **RAG Orchestrator Integration**: Integrated into the content generation pipeline

## Configuration

### Environment Variables

Add the following to your `.env.local`:

```bash
# LangWatch API Key (can use Langfuse keys if LangWatch is not available)
LANGWATCH_API_KEY=your-langwatch-api-key

# Optional: Custom LangWatch base URL
LANGWATCH_BASE_URL=https://api.langwatch.com

# Or use Langfuse keys (fallback)
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

### Usage

```typescript
import { getLangWatchClient } from '@/lib/observability/langwatch'
import { EVALUATION_SCHEMAS } from '@/lib/observability/evaluation-schemas'

const langWatch = getLangWatchClient()

// Log a trace
await langWatch.logTrace({
  traceId: 'trace-123',
  agent: 'content-writer',
  model: 'gemini-2.0-flash',
  telemetry: {
    topic: 'SEO best practices',
    wordCount: 1500,
  },
})

// Run an evaluation
const evaluation = await langWatch.evaluate({
  evaluationId: EVALUATION_SCHEMAS.EEAT,
  content: generatedContent,
  context: {
    userId: 'user-123',
    topic: 'SEO best practices',
  },
  scores: {
    eeat_score: 85,
    depth_score: 80,
    factual_score: 90,
  },
})
```

## Evaluation Schemas

The following evaluation schemas are defined:

### 1. Content Quality (`content_quality_v1`)
- **Purpose**: Evaluates overall content quality
- **Scores**: `relevance_score`, `accuracy_score`, `depth_score`, `readability_score`, `overall_score`
- **Min Passing Score**: 75

### 2. EEAT (`eeat_judge_v1`)
- **Purpose**: Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness
- **Scores**: `experience_score`, `expertise_score`, `authoritativeness_score`, `trustworthiness_score`, `eeat_score`, `depth_score`, `factual_score`
- **Min Passing Score**: 70

### 3. SEO (`seo_judge_v1`)
- **Purpose**: Evaluates SEO effectiveness
- **Scores**: `keyword_optimization_score`, `meta_optimization_score`, `structure_score`, `internal_linking_score`, `seo_score`
- **Min Passing Score**: 80

### 4. Research Quality (`research_quality_v1`)
- **Purpose**: Evaluates research quality
- **Scores**: `source_quality_score`, `coverage_score`, `relevance_score`, `recency_score`, `overall_score`
- **Min Passing Score**: 75

### 5. Content Writer (`content_writer_v1`)
- **Purpose**: Evaluates content writer output
- **Scores**: `coherence_score`, `style_score`, `structure_score`, `engagement_score`, `overall_score`
- **Min Passing Score**: 75

## Integration Points

### RAG Writer Orchestrator

The RAG Writer Orchestrator (`lib/agents/rag-writer-orchestrator.ts`) integrates LangWatch at multiple points:

1. **Trace Logging**: Logs traces for each agent call (research, content writer, scoring, QA)
2. **Evaluation**: Runs EEAT and Content Quality evaluations after each scoring/QA round
3. **Revision Triggers**: Uses evaluation results to determine if content needs revision
4. **Quality Reviews**: Stores evaluation results in `content_quality_reviews` table

### Content Quality Reviews

Evaluation results are stored in the `content_quality_reviews` table under the `qa_report.langwatch_evaluations` field:

```json
{
  "langwatch_evaluations": {
    "eeat": {
      "evaluationId": "eeat_judge_v1",
      "passed": true,
      "scores": {
        "eeat_score": 85,
        "depth_score": 80,
        "factual_score": 90
      }
    },
    "content_quality": {
      "evaluationId": "content_quality_v1",
      "passed": true,
      "scores": {
        "overall_score": 82
      }
    }
  }
}
```

## Error Handling

LangWatch calls are wrapped in try-catch blocks to ensure that evaluation failures don't break the main content generation flow. Errors are logged but don't interrupt the pipeline.

## Testing

### Unit Tests

Mock the LangWatch client in unit tests:

```typescript
import { vi } from 'vitest'

vi.mock('@/lib/observability/langwatch', () => ({
  getLangWatchClient: vi.fn(() => ({
    logTrace: vi.fn(() => Promise.resolve()),
    evaluate: vi.fn(() => Promise.resolve({
      evaluationId: 'test',
      passed: true,
      scores: {},
    })),
  })),
}))
```

### Integration Tests

Verify that LangWatch endpoints are hit during integration tests by checking that traces and evaluations are logged.

## Monitoring

View LangWatch traces and evaluations in the Langfuse dashboard (or LangWatch dashboard if using a separate service). Traces include:

- Agent name and model used
- Telemetry data (topic, word count, etc.)
- Evaluation scores and results
- Revision rounds and final status

## Future Enhancements

1. **Custom Evaluation Schemas**: Allow users to define custom evaluation schemas
2. **A/B Testing**: Compare different prompt versions using LangWatch evaluations
3. **Automated Prompt Optimization**: Use evaluation results to automatically optimize prompts
4. **Real-time Feedback**: Surface evaluation results in the UI for content creators

