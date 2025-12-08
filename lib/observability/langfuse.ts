/**
 * Langfuse Telemetry Configuration
 * 
 * Centralized configuration for Langfuse telemetry across the application
 */

import { serverEnv } from '@/lib/config/env'

/**
 * Check if Langfuse is enabled and configured
 */
export function isLangfuseEnabled(): boolean {
  return (
    serverEnv.LANGFUSE_ENABLED !== 'false' &&
    !!serverEnv.LANGFUSE_SECRET_KEY &&
    !!serverEnv.LANGFUSE_PUBLIC_KEY
  )
}

/**
 * OpenTelemetry compatible AttributeValue type (no null allowed)
 */
type OTelAttributeValue = string | number | boolean | string[] | number[] | boolean[]

/**
 * Standard Langfuse metadata fields recognized by Langfuse for trace grouping and session tracking
 */
export interface LangfuseStandardMetadata {
  /** Langfuse user ID for user tracking */
  userId?: string
  /** Langfuse session ID for session grouping */
  sessionId?: string
  /** Langfuse trace ID for grouping multiple spans under one trace */
  langfuseTraceId?: string
  /** Custom tags for filtering and organization */
  tags?: string[]
  /** Langfuse prompt reference (from Langfuse prompt management) */
  langfusePrompt?: any
  /** Whether to update parent trace with execution results */
  langfuseUpdateParent?: boolean
}

/**
 * Extended metadata type that includes standard Langfuse fields plus custom attributes
 */
export type TelemetryMetadata = LangfuseStandardMetadata & Record<string, string | number | boolean | string[] | number[] | boolean[] | null | undefined>

/**
 * Create standardized telemetry configuration for AI SDK calls
 *
 * @param functionId - Unique identifier for this function/agent
 * @param metadata - Additional metadata to include in the trace. Standard Langfuse fields (userId, sessionId, langfuseTraceId, tags) are recognized and properly handled.
 * @returns Telemetry configuration object compatible with AI SDK TelemetrySettings
 */
export function createTelemetryConfig(
  functionId: string,
  metadata?: TelemetryMetadata
): {
  isEnabled: boolean
  functionId: string
  metadata?: Record<string, OTelAttributeValue>
} {
  // Filter out undefined and null values to ensure type compatibility with OpenTelemetry
  const cleanMetadata = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(([_, value]) => value !== undefined && value !== null)
      ) as Record<string, OTelAttributeValue>
    : undefined

  return {
    isEnabled: isLangfuseEnabled(),
    functionId,
    ...(cleanMetadata && Object.keys(cleanMetadata).length > 0 && { metadata: cleanMetadata }),
  }
}

/**
 * Get Langfuse configuration for instrumentation
 * Supports both LANGFUSE_BASEURL and LANGFUSE_BASE_URL for compatibility
 */
export function getLangfuseConfig() {
  // Support both env var naming conventions
  const baseUrl = serverEnv.LANGFUSE_BASEURL || 
                  serverEnv.LANGFUSE_BASE_URL || 
                  'https://cloud.langfuse.com'
  
  return {
    enabled: isLangfuseEnabled(),
    secretKey: serverEnv.LANGFUSE_SECRET_KEY,
    publicKey: serverEnv.LANGFUSE_PUBLIC_KEY,
    baseUrl,
    debug: serverEnv.LANGFUSE_DEBUG === 'true',
  }
}

