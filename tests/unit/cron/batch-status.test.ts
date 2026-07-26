import { describe, expect, it } from 'vitest'
import { getBatchHttpStatus } from '@/lib/cron/batch-status'

describe('cron batch response status', () => {
  it('returns 200 only when every batch item completes', () => {
    expect(getBatchHttpStatus([{ status: 'complete' }, { status: 'complete' }])).toBe(200)
  })

  it('returns 500 when any batch item fails', () => {
    expect(getBatchHttpStatus([{ status: 'complete' }, { status: 'failed' }])).toBe(500)
  })
})
