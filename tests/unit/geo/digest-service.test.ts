import { describe, expect, it, vi } from 'vitest'

import { fetchSuggestionsWithFallback } from '@/lib/geo/digest-service'

describe('GEO digest suggestion fallback', () => {
  it('keeps valid remote suggestions when the follow-up request fails', async () => {
    const remote = { actions: [], longTermLinks: [] }

    await expect(fetchSuggestionsWithFallback(remote, async () => {
      throw new Error('suggestions unavailable')
    })).resolves.toEqual(remote)
  })

  it('uses newer suggestions when the follow-up request succeeds', async () => {
    const remote = { actions: [], longTermLinks: [] }
    const newer = { actions: [{ priority: 1 }], longTermLinks: [] }

    await expect(fetchSuggestionsWithFallback(remote, async () => newer)).resolves.toEqual(newer)
  })
})
