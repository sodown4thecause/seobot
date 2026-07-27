import { describe, expect, it, vi } from 'vitest'
import {
  checkAborted,
  createLinkedAbortController,
  createTimeoutAbortSignal,
  isAbortSignal,
  withAbortSignal,
} from '@/lib/agents/utils/abort-handler'
import { AbortError } from '@/lib/errors/types'

describe('checkAborted', () => {
  it('does nothing when signal is undefined', () => {
    expect(() => checkAborted(undefined)).not.toThrow()
  })

  it('does nothing when signal is not aborted', () => {
    const controller = new AbortController()
    expect(() => checkAborted(controller.signal)).not.toThrow()
  })

  it('throws AbortError when signal is already aborted', () => {
    const controller = new AbortController()
    controller.abort()
    expect(() => checkAborted(controller.signal)).toThrow(AbortError)
  })

  it('includes context in error message', () => {
    const controller = new AbortController()
    controller.abort()
    expect(() => checkAborted(controller.signal, 'before fetch')).toThrow('before fetch')
  })

  it('uses generic message when no context provided', () => {
    const controller = new AbortController()
    controller.abort()
    let caught: Error | undefined
    try {
      checkAborted(controller.signal)
    } catch (e) {
      caught = e as Error
    }
    expect(caught?.message).toBe('Operation was aborted')
  })
})

describe('withAbortSignal', () => {
  it('runs the operation and returns its result when not aborted', async () => {
    const result = await withAbortSignal(() => Promise.resolve(42))
    expect(result).toBe(42)
  })

  it('runs without a signal', async () => {
    const result = await withAbortSignal(() => Promise.resolve('hello'))
    expect(result).toBe('hello')
  })

  it('throws AbortError if signal is already aborted before start', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      withAbortSignal(() => Promise.resolve('x'), { signal: controller.signal })
    ).rejects.toBeInstanceOf(AbortError)
  })

  it('returns fallback if signal is already aborted and fallback is provided', async () => {
    const controller = new AbortController()
    controller.abort()
    const result = await withAbortSignal(() => Promise.resolve('x'), {
      signal: controller.signal,
      fallback: 'fallback-value',
    })
    expect(result).toBe('fallback-value')
  })

  it('runs cleanup when signal is already aborted before start', async () => {
    const controller = new AbortController()
    controller.abort()
    const cleanup = vi.fn()
    await expect(
      withAbortSignal(() => Promise.resolve('x'), {
        signal: controller.signal,
        cleanup,
        fallback: undefined,
      })
    ).rejects.toBeInstanceOf(AbortError)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('re-throws non-abort errors from the operation', async () => {
    const boom = new Error('boom')
    await expect(
      withAbortSignal(() => Promise.reject(boom))
    ).rejects.toBe(boom)
  })

  it('runs cleanup when the operation throws a non-abort error (signal provided)', async () => {
    const controller = new AbortController()
    const cleanup = vi.fn()
    await expect(
      withAbortSignal(() => Promise.reject(new Error('fail')), {
        signal: controller.signal,
        cleanup,
      })
    ).rejects.toThrow('fail')
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('re-throws AbortError from the operation without wrapping', async () => {
    const original = new AbortError('inner abort')
    await expect(
      withAbortSignal(() => Promise.reject(original), {
        signal: new AbortController().signal,
      })
    ).rejects.toBe(original)
  })

  it('includes context in AbortError message when context is provided', async () => {
    const controller = new AbortController()
    controller.abort()
    let caught: Error | undefined
    try {
      await withAbortSignal(() => Promise.resolve(), {
        signal: controller.signal,
        context: 'during sync',
      })
    } catch (e) {
      caught = e as Error
    }
    expect(caught?.message).toContain('during sync')
  })
})

describe('createLinkedAbortController', () => {
  it('returns a controller that is not initially aborted with no signals', () => {
    const ctrl = createLinkedAbortController([])
    expect(ctrl.signal.aborted).toBe(false)
  })

  it('returns an immediately aborted controller if any signal is already aborted', () => {
    const c = new AbortController()
    c.abort('preaborted')
    const linked = createLinkedAbortController([c.signal])
    expect(linked.signal.aborted).toBe(true)
  })

  it('propagates abort when a linked signal fires', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const linked = createLinkedAbortController([c1.signal, c2.signal])
    expect(linked.signal.aborted).toBe(false)
    c1.abort()
    expect(linked.signal.aborted).toBe(true)
  })

  it('propagates abort from second signal', () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const linked = createLinkedAbortController([c1.signal, c2.signal])
    c2.abort()
    expect(linked.signal.aborted).toBe(true)
  })

  it('filters out undefined signals', () => {
    const c = new AbortController()
    const linked = createLinkedAbortController([undefined, c.signal, undefined])
    expect(linked.signal.aborted).toBe(false)
    c.abort()
    expect(linked.signal.aborted).toBe(true)
  })

  it('all-undefined signals returns a non-aborted controller', () => {
    const linked = createLinkedAbortController([undefined, undefined])
    expect(linked.signal.aborted).toBe(false)
  })
})

describe('createTimeoutAbortSignal', () => {
  it('returns a signal and cleanup function', () => {
    const { signal, cleanup } = createTimeoutAbortSignal(10_000)
    expect(signal).toBeDefined()
    expect(typeof cleanup).toBe('function')
    cleanup()
  })

  it('signal is not initially aborted', () => {
    const { signal, cleanup } = createTimeoutAbortSignal(10_000)
    expect(signal.aborted).toBe(false)
    cleanup()
  })

  it('signal aborts after the timeout fires', async () => {
    vi.useFakeTimers()
    const { signal } = createTimeoutAbortSignal(100)
    expect(signal.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(101)
    expect(signal.aborted).toBe(true)
    vi.useRealTimers()
  })

  it('cleanup prevents the abort from firing', async () => {
    vi.useFakeTimers()
    const { signal, cleanup } = createTimeoutAbortSignal(100)
    cleanup()
    await vi.advanceTimersByTimeAsync(200)
    expect(signal.aborted).toBe(false)
    vi.useRealTimers()
  })
})

describe('isAbortSignal', () => {
  it('returns true for a real AbortSignal', () => {
    expect(isAbortSignal(new AbortController().signal)).toBe(true)
  })

  it('returns true for a signal-like object', () => {
    const signalLike = { aborted: false, addEventListener: () => {}, removeEventListener: () => {} }
    expect(isAbortSignal(signalLike)).toBe(true)
  })

  it('returns false for null', () => {
    expect(isAbortSignal(null)).toBe(false)
  })

  it('returns false for a plain object without aborted', () => {
    expect(isAbortSignal({ reason: 'x' })).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isAbortSignal('abort')).toBe(false)
  })

  it('returns false for an array', () => {
    expect(isAbortSignal([])).toBe(false)
  })

  it('returns false for a number', () => {
    expect(isAbortSignal(0)).toBe(false)
  })
})
