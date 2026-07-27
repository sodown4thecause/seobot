import { describe, expect, it } from 'vitest'
import { publicRedditGapAuditSelection } from '@/lib/reddit-gap/public-audit'

describe('public Reddit gap report projection', () => {
  it('does not select lead or request metadata for client serialization', () => {
    const selectedColumns = Object.keys(publicRedditGapAuditSelection)

    expect(selectedColumns).not.toContain('email')
    expect(selectedColumns).not.toContain('ipAddress')
    expect(selectedColumns).not.toContain('userAgent')
    expect(selectedColumns).toContain('contentGaps')
    expect(selectedColumns).toContain('scorecard')
  })
})
