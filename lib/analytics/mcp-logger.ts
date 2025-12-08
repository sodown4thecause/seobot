/**
 * MCP Tool Logger
 * Wraps MCP tool execution with usage logging
 */

import { logAIUsage } from './usage-logger'
import type { AIProvider } from './cost-estimator'

export interface MCPToolLogParams {
  userId: string | null | undefined
  provider: AIProvider
  endpoint: string
  agentType?: string
  metadata?: Record<string, any>
}

/**
 * Wrap an MCP tool execution with logging
 */
export async function withMCPLogging<T>(
  params: MCPToolLogParams,
  toolExecution: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  let error: Error | null = null

  try {
    const result = await toolExecution()
    return result
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    throw err
  } finally {
    // Log usage (even on error)
    if (params.userId) {
      try {
        await logAIUsage({
          userId: params.userId,
          agentType: params.agentType,
          model: `${params.provider}:${params.endpoint}`,
          endpoint: params.endpoint,
          provider: params.provider,
          metadata: {
            ...params.metadata,
            duration_ms: Date.now() - startTime,
            error: error?.message,
          },
        })
      } catch (logError) {
        console.error('[MCP Logger] Failed to log usage:', logError)
      }
    }
  }
}

