import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockServerEnv } from '../../setup'
import {
  ElmoApiError,
  elmoBrandSchema,
  getElmoBrand,
  isElmoConfigured,
  listElmoBrands,
} from '@/lib/geo/elmo-client'

describe('elmo-client', () => {
  beforeEach(() => {
    mockServerEnv.ELMO_API_URL = 'https://geo.flowintent.com'
    mockServerEnv.ELMO_API_KEY = 'test-api-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects configuration from ELMO_API_URL and ELMO_API_KEY', () => {
    expect(isElmoConfigured()).toBe(true)
    mockServerEnv.ELMO_API_KEY = undefined
    expect(isElmoConfigured()).toBe(false)
  })

  it('sends Bearer auth on requests', async () => {
    const mockBrand = {
      id: 'fi-example-com-user1234',
      name: 'Example',
      domains: ['example.com'],
      aliases: [],
      enabled: true,
      onboarded: true,
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    }

    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockBrand), { status: 200 }))

    const brand = await getElmoBrand(mockBrand.id)

    expect(brand.id).toBe(mockBrand.id)
    expect(fetch).toHaveBeenCalledWith(
      'https://geo.flowintent.com/api/v1/brands/fi-example-com-user1234',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
      }),
    )
  })

  it('throws ElmoApiError on non-OK responses', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid API key',
    }), { status: 401 }))

    await expect(getElmoBrand('missing-brand')).rejects.toMatchObject({
      status: 401,
      errorCode: 'Unauthorized',
    })
    await expect(getElmoBrand('missing-brand')).rejects.toBeInstanceOf(ElmoApiError)
  })

  it('validates list brands response with zod', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      brands: [{
        id: 'brand-1',
        name: 'Brand One',
        domains: ['brand.one'],
        aliases: ['B1'],
        enabled: true,
        onboarded: true,
        createdAt: '2026-07-04T00:00:00.000Z',
        updatedAt: '2026-07-04T00:00:00.000Z',
      }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }), { status: 200 }))

    const result = await listElmoBrands()
    expect(result.brands).toHaveLength(1)
    expect(elmoBrandSchema.parse(result.brands[0]).name).toBe('Brand One')
  })

  it('rejects malformed brand payloads', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      id: 'brand-1',
      name: 'Missing fields',
    }), { status: 200 }))

    await expect(getElmoBrand('brand-1')).rejects.toThrow()
  })
})
