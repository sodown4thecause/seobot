import { describe, expect, it } from 'vitest'
import {
  getFortnightlyRunKey,
  getWeeklyRunKey,
  runScheduledOnce,
  type ScheduledRunStore,
} from '@/lib/cron/scheduled-run'

class MemoryRunStore implements ScheduledRunStore {
  readonly values = new Map<string, string>()

  async set(
    key: string,
    value: string,
    options: { nx: true; ex: number }
  ): Promise<'OK' | null> {
    void options
    if (this.values.has(key)) {
      return null
    }
    this.values.set(key, value)
    return 'OK'
  }

  async del(key: string): Promise<number> {
    return this.values.delete(key) ? 1 : 0
  }
}

describe('scheduled run idempotency', () => {
  it('executes a claimed run once and skips duplicate delivery', async () => {
    const store = new MemoryRunStore()
    let executions = 0
    const execute = async () => {
      executions += 1
      return 'complete'
    }

    const first = await runScheduledOnce(store, 'cron:weekly-seo:2026-07-19', 604800, execute)
    const duplicate = await runScheduledOnce(
      store,
      'cron:weekly-seo:2026-07-19',
      604800,
      execute
    )

    expect(first).toEqual({ executed: true, value: 'complete' })
    expect(duplicate).toEqual({ executed: false })
    expect(executions).toBe(1)
  })

  it('releases a claim when a completed batch reports failure', async () => {
    const store = new MemoryRunStore()
    const result = await runScheduledOnce(
      store,
      'cron:weekly-rag:2026-07-19',
      604800,
      async () => [{ status: 'failed' }],
      (results) => results.every(({ status }) => status !== 'failed')
    )

    expect(result).toEqual({ executed: true, value: [{ status: 'failed' }] })
    expect(store.values.has('cron:weekly-rag:2026-07-19')).toBe(false)
  })

  it('releases a claim when execution fails so an operator can retry', async () => {
    const store = new MemoryRunStore()

    await expect(
      runScheduledOnce(store, 'cron:weekly-geo:2026-07-19', 604800, async () => {
        throw new Error('provider unavailable')
      })
    ).rejects.toThrow('provider unavailable')

    expect(store.values.has('cron:weekly-geo:2026-07-19')).toBe(false)
  })

  it('uses stable UTC cadence keys at period boundaries', () => {
    expect(getWeeklyRunKey('weekly-seo', new Date('2026-07-25T23:59:59Z')))
      .toBe('cron:weekly-seo:2026-07-19')
    expect(getWeeklyRunKey('weekly-seo', new Date('2026-07-26T00:00:00Z')))
      .toBe('cron:weekly-seo:2026-07-26')
    expect(getFortnightlyRunKey('industry-research', new Date('2026-07-14T23:59:59Z')))
      .toBe('cron:industry-research:2026-07-01')
    expect(getFortnightlyRunKey('industry-research', new Date('2026-07-15T00:00:00Z')))
      .toBe('cron:industry-research:2026-07-15')
  })
})
