import { describe, expect, it } from 'vitest'
import fixture from '@/tests/fixtures/audit/topical-map-input.json'
import { normalizeTopicalMap } from '@/lib/audit/topical-map-normalizer'

describe('topical map normalizer', () => {
  it('maps provider payloads into shared topic nodes', () => {
    const result = normalizeTopicalMap(fixture as never)
    expect(result.nodes.length).toBeGreaterThan(0)
    expect(result.nodes[0]).toHaveProperty('sourceUrls')
    expect(result.nodes[0].topic).toBe('technical seo audit')
  })
})
