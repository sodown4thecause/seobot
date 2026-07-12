import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchLatestDigestFromApi, fetchSuggestionsFromApi, getLatestGeoDigest } = vi.hoisted(() => ({
  fetchLatestDigestFromApi: vi.fn(),
  fetchSuggestionsFromApi: vi.fn(),
  getLatestGeoDigest: vi.fn(),
}))

vi.mock('@/lib/geo/geo-api-client', () => ({
  isGeoApiConfigured: () => true,
  fetchLatestDigestFromApi,
  fetchSuggestionsFromApi,
  fetchDigestFromApiByDate: vi.fn(),
  fetchGeoHealthFromApi: vi.fn(),
  fetchGeoTrendsFromApi: vi.fn(),
}))

vi.mock('@/lib/geo/digest-store', () => ({
  getLatestGeoDigest,
  getGeoDigestByDate: vi.fn(),
  listGeoDigestTrends: vi.fn(),
}))

describe('resolveLatestGeoDigest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps embedded remote suggestions when the follow-up suggestions request fails', async () => {
    const embeddedSuggestions = { opportunities: [] }
    fetchLatestDigestFromApi.mockResolvedValue({
      digestDate: '2026-07-12',
      brand: 'FlowIntent',
      digest: { date: '2026-07-12', brand: 'FlowIntent' },
      suggestions: embeddedSuggestions,
      degradedSections: [],
    })
    fetchSuggestionsFromApi.mockRejectedValue(new Error('suggestions unavailable'))

    const { resolveLatestGeoDigest } = await import('@/lib/geo/digest-service')
    const result = await resolveLatestGeoDigest()

    expect(result?.source).toBe('geo-api')
    expect(result?.suggestions).toBe(embeddedSuggestions)
    expect(getLatestGeoDigest).not.toHaveBeenCalled()
  })
})
