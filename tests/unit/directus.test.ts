import { beforeEach, describe, expect, it, vi } from 'vitest'

const createDirectusMock = vi.fn(() => ({
  with(extension: unknown) {
    return extension && typeof extension === 'object' && 'kind' in (extension as Record<string, unknown>)
      ? this
      : this
  },
}))

const restMock = vi.fn(() => ({ kind: 'rest' }))
const staticTokenMock = vi.fn(() => ({ kind: 'token' }))

vi.mock('@directus/sdk', () => ({
  createDirectus: createDirectusMock,
  rest: restMock,
  staticToken: staticTokenMock,
}))

describe('directus helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('normalizes the base URL and builds asset URLs safely', async () => {
    vi.doMock('@/lib/config/env', () => ({
      serverEnv: {
        DIRECTUS_URL: 'https://directus.example.com/',
        DIRECTUS_TOKEN: undefined,
      },
    }))

    const directus = await import('@/lib/directus')

    expect(directus.normalizeDirectusBaseUrl('https://directus.example.com/')).toBe('https://directus.example.com')
    expect(directus.normalizeDirectusBaseUrl('https://directus.example.com')).toBe('https://directus.example.com')
    expect(
      directus.buildDirectusAssetUrl('https://directus.example.com', 'asset-id', { width: 1200 })
    ).toBe('https://directus.example.com/assets/asset-id?width=1200')
    expect(
      directus.buildDirectusAssetUrl('https://directus.example.com/', 'asset-id', { height: 630, fit: 'cover' })
    ).toBe('https://directus.example.com/assets/asset-id?height=630&fit=cover')
    expect(directus.getAssetUrl('asset-id')).toBe('https://directus.example.com/assets/asset-id')
  })

  it('throws when DIRECTUS_URL is missing', async () => {
    vi.doMock('@/lib/config/env', () => ({
      serverEnv: {
        DIRECTUS_URL: undefined,
        DIRECTUS_TOKEN: undefined,
      },
    }))

    await expect(import('@/lib/directus')).rejects.toThrow('DIRECTUS_URL environment variable is required')
  })
})
