/**
 * Langfuse v5 compatibility helpers for trace attribute updates.
 * Replaces the removed updateActiveTrace() API from @langfuse/tracing v4.
 */

import 'server-only'

import {
  propagateAttributes,
  setActiveTraceIO,
} from '@langfuse/tracing'

export interface UpdateActiveTraceParams {
  name?: string
  sessionId?: string
  userId?: string
  input?: unknown
  output?: unknown
  tags?: string[]
  metadata?: Record<string, unknown>
}

function toStringMetadata(metadata: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue
    result[key] = typeof value === 'string' ? value : JSON.stringify(value)
  }
  return result
}

/**
 * Update the active Langfuse trace with correlating attributes and optional I/O.
 * Maps v4 updateActiveTrace() to v5 propagateAttributes + setActiveTraceIO.
 */
export function updateActiveTrace(params: UpdateActiveTraceParams): void {
  const metadata = params.metadata ? toStringMetadata(params.metadata) : undefined

  propagateAttributes(
    {
      traceName: params.name,
      userId: params.userId,
      sessionId: params.sessionId,
      tags: params.tags,
      metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
    },
    () => {
      if (params.input !== undefined || params.output !== undefined) {
        setActiveTraceIO({
          ...(params.input !== undefined ? { input: params.input } : {}),
          ...(params.output !== undefined ? { output: params.output } : {}),
        })
      }
    },
  )
}
