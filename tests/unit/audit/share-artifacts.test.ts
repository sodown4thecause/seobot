import { describe, expect, it } from 'vitest'
import { buildShareCopy } from '@/lib/audit/share-artifacts'

describe('share artifact safety', () => {
  it('avoids direct competitor-negative phrasing', () => {
    const text = buildShareCopy({
      brand: 'FlowIntent',
      score: 64,
      action: 'Publish source-backed comparison pages for buyer questions.',
    })

    expect(text.toLowerCase()).not.toContain('competitor x is bad')
    expect(text.toLowerCase()).not.toContain('destroy your competitors')
    expect(text.toLowerCase()).toContain('your')
  })
})
