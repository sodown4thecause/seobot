/**
 * Langfuse operational configuration — evaluators, alerts, prompt management hooks.
 * Configure matching resources in the Langfuse UI using these IDs.
 */

import 'server-only'

import { EVALUATION_SCHEMAS } from '@/lib/observability/evaluation-schemas'
import { serverEnv } from '@/lib/config/env'

/** Langfuse LLM-as-judge evaluator IDs (create in Langfuse → Evaluators) */
export const LANGFUSE_EVALUATORS = {
  contentQuality: EVALUATION_SCHEMAS.CONTENT_QUALITY,
  eeat: EVALUATION_SCHEMAS.EEAT,
  seo: EVALUATION_SCHEMAS.SEO,
  research: EVALUATION_SCHEMAS.RESEARCH,
  contentWriter: EVALUATION_SCHEMAS.CONTENT_WRITER,
} as const

/** Recommended Langfuse custom dashboard panels (create in Langfuse → Dashboards) */
export const LANGFUSE_DASHBOARD_PANELS = [
  { id: 'cost-by-mode', metric: 'metadata.mode', aggregation: 'sum_cost' },
  { id: 'latency-p95-chat', functionId: 'chat-stream', aggregation: 'p95_latency' },
  { id: 'error-rate-by-agent', groupBy: 'metadata.agentType', aggregation: 'error_rate' },
  { id: 'tool-call-volume', spanName: 'ai.toolCall', aggregation: 'count' },
] as const

/** Webhook URL for Langfuse alerts (set LANGFUSE_ALERT_WEBHOOK_URL in env) */
export function getLangfuseAlertWebhookUrl(): string | undefined {
  return serverEnv.LANGFUSE_ALERT_WEBHOOK_URL
}

/**
 * Build telemetry metadata to link a Langfuse Prompt Management version to a generation.
 * Fetch prompt via Langfuse SDK, then pass result of this helper in createTelemetryConfig metadata.
 */
export function buildLangfusePromptMetadata(prompt: { toJSON: () => unknown }) {
  return {
    langfusePrompt: prompt.toJSON(),
    langfuseUpdateParent: true,
  }
}

/** Tags applied to production chat traces for filtering in Langfuse */
export function buildProductionTraceTags(mode?: string): string[] {
  const tags = ['flowintent', 'production']
  if (mode) {
    tags.push(`mode:${mode}`)
  }
  return tags
}
