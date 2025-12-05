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
 * Create standardized telemetry configuration for AI SDK calls
 * 
 * @param functionId - Unique identifier for this function/agent
 * @param metadata - Additional metadata to include in the trace
 * @returns Telemetry configuration object compatible with AI SDK TelemetrySettings
 */
export function createTelemetryConfig(
  functionId: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
): {
  isEnabled: boolean
  functionId: string
  metadata?: Record<string, string | number | boolean | null | undefined>
} {
  // Filter out undefined values to ensure type compatibility
  const cleanMetadata = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(([_, value]) => value !== undefined)
      ) as Record<string, string | number | boolean | null>
    : undefined

  return {
    isEnabled: isLangfuseEnabled(),
    functionId,
    ...(cleanMetadata && Object.keys(cleanMetadata).length > 0 && { metadata: cleanMetadata }),
  }
}

/**
 * Get Langfuse configuration for instrumentation
 */
export function getLangfuseConfig() {
  return {
    enabled: isLangfuseEnabled(),
    secretKey: serverEnv.LANGFUSE_SECRET_KEY,
    publicKey: serverEnv.LANGFUSE_PUBLIC_KEY,
    baseUrl: serverEnv.LANGFUSE_BASEURL || 'https://cloud.langfuse.com',
    debug: serverEnv.LANGFUSE_DEBUG === 'true',
  }
}

