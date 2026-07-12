import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureElmoBrandForUser,
  inspectElmoBrandForUser,
} from '@/lib/geo/elmo-provisioning'

const mockGetBusinessProfile = vi.fn()
const mockUpsertBusinessProfile = vi.fn()
const mockGetGeoBusinessProfileForUser = vi.fn()
const mockAnalyzeElmoBrand = vi.fn()
const mockCreateElmoBrand = vi.fn()
const mockGetElmoBrand = vi.fn()

vi.mock('@/lib/db/queries', () => ({
  getBusinessProfile: (...args: unknown[]) => mockGetBusinessProfile(...args),
  upsertBusinessProfile: (...args: unknown[]) => mockUpsertBusinessProfile(...args),
}))

vi.mock('@/lib/geo/profile', () => ({
  brandFromWebsiteUrl: (url: string) => url,
  getGeoBusinessProfileForUser: (...args: unknown[]) => mockGetGeoBusinessProfileForUser(...args),
}))

vi.mock('@/lib/geo/elmo-client', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/geo/elmo-client')>()
  return {
    ...actual,
    analyzeElmoBrand: (...args: unknown[]) => mockAnalyzeElmoBrand(...args),
    createElmoBrand: (...args: unknown[]) => mockCreateElmoBrand(...args),
    getElmoBrand: (...args: unknown[]) => mockGetElmoBrand(...args),
  }
})

describe('elmo-provisioning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns existing brand without re-provisioning when elmoBrandId is stored', async () => {
    mockGetBusinessProfile.mockResolvedValue({
      userId: 'user-1',
      websiteUrl: 'https://example.com',
      elmoBrandId: 'fi-example-com-user1',
    })
    mockGetElmoBrand.mockResolvedValue({
      id: 'fi-example-com-user1',
      name: 'Example',
      domains: ['example.com'],
      aliases: [],
      enabled: true,
      onboarded: true,
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    })

    const result = await ensureElmoBrandForUser('user-1')

    expect(result.created).toBe(false)
    expect(result.brandId).toBe('fi-example-com-user1')
    expect(mockAnalyzeElmoBrand).not.toHaveBeenCalled()
    expect(mockCreateElmoBrand).not.toHaveBeenCalled()
    expect(mockUpsertBusinessProfile).not.toHaveBeenCalled()
  })

  it('provisions a brand once and stores elmoBrandId', async () => {
    mockGetBusinessProfile.mockResolvedValue({
      userId: 'user-2',
      websiteUrl: 'https://flowintent.com',
      elmoBrandId: null,
    })
    mockGetGeoBusinessProfileForUser.mockResolvedValue({
      userId: 'user-2',
      brand: 'FlowIntent',
      websiteUrl: 'https://flowintent.com',
      competitors: [],
    })
    mockAnalyzeElmoBrand.mockResolvedValue({
      brandName: 'FlowIntent',
      website: 'flowintent.com',
      additionalDomains: [],
      aliases: [],
      competitors: [{ name: 'Competitor', domains: ['competitor.com'], aliases: [] }],
      suggestedPrompts: [{ prompt: 'best ai seo tools', tags: ['category'] }],
    })
    mockCreateElmoBrand.mockResolvedValue({
      id: 'fi-flowintent-com-user2',
      name: 'FlowIntent',
      domains: ['flowintent.com'],
      aliases: [],
      enabled: true,
      onboarded: true,
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    })

    const result = await ensureElmoBrandForUser('user-2')

    expect(result.created).toBe(true)
    expect(mockCreateElmoBrand).toHaveBeenCalledTimes(1)
    expect(mockUpsertBusinessProfile).toHaveBeenCalledWith('user-2', {
      elmoBrandId: 'fi-flowintent-com-user2',
    })
  })

  it('hashes the complete user ID when deriving a brand ID', async () => {
    mockGetBusinessProfile.mockResolvedValue({
      userId: 'shared-prefix-user-a',
      websiteUrl: 'https://flowintent.com',
      elmoBrandId: null,
    })
    mockGetGeoBusinessProfileForUser.mockResolvedValue({
      userId: 'shared-prefix-user-a',
      brand: 'FlowIntent',
      websiteUrl: 'https://flowintent.com',
      competitors: [],
    })
    mockAnalyzeElmoBrand.mockResolvedValue({
      brandName: 'FlowIntent',
      website: 'flowintent.com',
      additionalDomains: [],
      aliases: [],
      competitors: [],
      suggestedPrompts: [],
    })
    mockCreateElmoBrand.mockImplementation(async ({ id }: { id: string }) => ({
      id,
      name: 'FlowIntent',
      domains: ['flowintent.com'],
      aliases: [],
      enabled: true,
      onboarded: true,
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    }))

    await ensureElmoBrandForUser('shared-prefix-user-a')
    const firstId = mockCreateElmoBrand.mock.calls[0][0].id

    vi.clearAllMocks()
    mockGetBusinessProfile.mockResolvedValue({
      userId: 'shared-prefix-user-b',
      websiteUrl: 'https://flowintent.com',
      elmoBrandId: null,
    })
    mockGetGeoBusinessProfileForUser.mockResolvedValue({ brand: 'FlowIntent' })
    mockAnalyzeElmoBrand.mockResolvedValue({
      brandName: 'FlowIntent',
      website: 'flowintent.com',
      additionalDomains: [],
      aliases: [],
      competitors: [],
      suggestedPrompts: [],
    })
    mockCreateElmoBrand.mockImplementation(async ({ id }: { id: string }) => ({
      id,
      name: 'FlowIntent',
      domains: ['flowintent.com'],
      aliases: [],
      enabled: true,
      onboarded: true,
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    }))

    await ensureElmoBrandForUser('shared-prefix-user-b')
    const secondId = mockCreateElmoBrand.mock.calls[0][0].id

    expect(firstId).toMatch(/^fi-flowintent-com-[0-9a-f]{16}$/)
    expect(secondId).toMatch(/^fi-flowintent-com-[0-9a-f]{16}$/)
    expect(firstId).not.toBe(secondId)
  })

  it('inspect returns null when no brand is stored', async () => {
    mockGetBusinessProfile.mockResolvedValue({
      userId: 'user-3',
      websiteUrl: 'https://example.com',
      elmoBrandId: null,
    })

    const brand = await inspectElmoBrandForUser('user-3')

    expect(brand).toBeNull()
    expect(mockGetElmoBrand).not.toHaveBeenCalled()
  })
})
