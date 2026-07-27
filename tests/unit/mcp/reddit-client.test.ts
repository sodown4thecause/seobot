import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearTokenCache, getRedditAccessToken } from '@/lib/mcp/reddit/client'

describe('Reddit OAuth configuration', () => {
  afterEach(() => {
    clearTokenCache()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('fails before making a network request when credentials are missing', async () => {
    vi.stubEnv('REDDIT_CLIENT_ID', '')
    vi.stubEnv('REDDIT_CLIENT_SECRET', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getRedditAccessToken()).rejects.toThrow(
      'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
