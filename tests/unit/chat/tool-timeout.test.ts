import { describe, expect, it, vi } from 'vitest'
import { tool } from 'ai'
import { z } from 'zod'
import { withToolTimeout, type ToolErrorResult } from '@/lib/chat/tool-timeout'

describe('withToolTimeout', () => {
  it('returns a structured error after a bounded timeout', async () => {
    vi.useFakeTimers()
    try {
      const wrapped = withToolTimeout('slow_tool', tool({
        description: 'Never completes',
        inputSchema: z.object({}),
        execute: async () => new Promise(() => undefined),
      }), 5)

      const pending = wrapped.execute?.({}, { toolCallId: 'call-1', messages: [], abortSignal: undefined as never })
      await vi.advanceTimersByTimeAsync(6)

      expect(await pending as ToolErrorResult).toMatchObject({
        status: 'error',
        errorCode: 'tool_timeout',
        timedOut: true,
        toolName: 'slow_tool',
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears the timeout after successful execution', async () => {
    vi.useFakeTimers()
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    try {
      const wrapped = withToolTimeout('fast_tool', tool({
        description: 'Completes',
        inputSchema: z.object({}),
        execute: async () => ({ ok: true }),
      }), 5)

      await expect(wrapped.execute?.({}, { toolCallId: 'call-1', messages: [], abortSignal: undefined as never }))
        .resolves.toEqual({ ok: true })
      expect(clearTimeoutSpy).toHaveBeenCalled()
    } finally {
      clearTimeoutSpy.mockRestore()
      vi.useRealTimers()
    }
  })
})
