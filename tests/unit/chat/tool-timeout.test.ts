import { describe, expect, it, vi } from 'vitest'
import { tool } from 'ai'
import { z } from 'zod'
import {
  withToolTimeout,
  withToolTimeouts,
  getToolTimeoutMs,
  DEFAULT_TOOL_TIMEOUT_MS,
  type ToolErrorResult,
} from '@/lib/chat/tool-timeout'

const makeTool = (execute: (args: { value: string }) => Promise<unknown>) =>
  tool({
    description: 'test tool',
    inputSchema: z.object({ value: z.string() }),
    execute,
  })

type ExecutableTool = { execute: (args: { value: string }, options?: unknown) => Promise<unknown> }

describe('withToolTimeout', () => {
  it('passes through successful results', async () => {
    const wrapped = withToolTimeout('demo', makeTool(async ({ value }) => ({ ok: true, value })), 1000)
    const result = await (wrapped as unknown as ExecutableTool).execute({ value: 'hello' })
    expect(result).toEqual({ ok: true, value: 'hello' })
  })

  it('resolves with a structured timeout result instead of hanging', async () => {
    vi.useFakeTimers()
    try {
      const neverResolves = makeTool(() => new Promise(() => { }))
      const wrapped = withToolTimeout('on_page_instant_pages', neverResolves, 5000)

      const pending = (wrapped as unknown as ExecutableTool).execute({ value: 'x' })
      await vi.advanceTimersByTimeAsync(5001)
      const result = (await pending) as ToolErrorResult

      expect(result.status).toBe('error')
      expect(result.errorCode).toBe('tool_timeout')
      expect(result.timedOut).toBe(true)
      expect(result.toolName).toBe('on_page_instant_pages')
      expect(result.errorMessage).toContain('5s')
    } finally {
      vi.useRealTimers()
    }
  })

  it('normalizes thrown errors into structured, sanitized results', async () => {
    const failing = makeTool(async () => {
      throw new Error('A positive credit balance is required at https://vercel.com/team')
    })
    const wrapped = withToolTimeout('serp_organic_live_advanced', failing, 1000)
    const result = (await (wrapped as unknown as ExecutableTool).execute({ value: 'x' })) as ToolErrorResult

    expect(result.status).toBe('error')
    expect(result.errorCode).toBe('provider_credits_exhausted')
    expect(result.errorMessage).not.toContain('vercel.com')
  })

  it('leaves tools without execute untouched', () => {
    const clientTool = { description: 'client-only', inputSchema: z.object({}) }
    const wrapped = withToolTimeout('client_ui', clientTool as never)
    expect(wrapped).toBe(clientTool)
  })
})

describe('getToolTimeoutMs', () => {
  it('uses the default for unknown tools', () => {
    expect(getToolTimeoutMs('some_random_tool')).toBe(DEFAULT_TOOL_TIMEOUT_MS)
  })

  it('applies overrides for known slow tools', () => {
    expect(getToolTimeoutMs('on_page_instant_pages')).toBeGreaterThan(DEFAULT_TOOL_TIMEOUT_MS)
    expect(getToolTimeoutMs('generate_content_package')).toBeGreaterThan(DEFAULT_TOOL_TIMEOUT_MS)
  })
})

describe('withToolTimeouts', () => {
  it('wraps every tool in the set', async () => {
    const tools = {
      a: makeTool(async () => 'result-a'),
      b: makeTool(async () => {
        throw new Error('rate limit exceeded')
      }),
    }
    const wrapped = withToolTimeouts(tools, 1000)

    expect(Object.keys(wrapped)).toEqual(['a', 'b'])
    await expect((wrapped.a as unknown as ExecutableTool).execute({ value: 'x' })).resolves.toBe('result-a')
    const failed = (await (wrapped.b as unknown as ExecutableTool).execute({ value: 'x' })) as ToolErrorResult
    expect(failed.status).toBe('error')
    expect(failed.errorCode).toBe('provider_rate_limited')
  })
})
