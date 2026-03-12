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

  it('does not rewrite brand names that include the word Invisible', () => {
    const text = buildShareCopy({
      brand: 'Invisible Inc',
      score: 64,
      action: 'Keep building source-backed pages.',
    })

    expect(text).toContain('Invisible Inc topical authority score is 64/100')
  })
})
