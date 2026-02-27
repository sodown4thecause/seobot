import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@clerk/nextjs/server'
import { POST } from '@/app/api/jobs/refresh/route'

const { mockSendRefreshRequest, mockInvalidateDashboardCache } = vi.hoisted(() => ({
  mockSendRefreshRequest: vi.fn(),
  mockInvalidateDashboardCache: vi.fn(),
}))

vi.mock('@/lib/jobs/inngest-client', () => ({
  sendRefreshRequest: mockSendRefreshRequest,
}))

vi.mock('@/lib/cache/redis-client', () => ({
  invalidateDashboardCache: mockInvalidateDashboardCache,
}))

describe('jobs refresh route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>)
  })

  it('returns structured 500 and skips cache invalidation when enqueue fails', async () => {
    mockSendRefreshRequest.mockRejectedValueOnce(new Error('Inngest unavailable'))

    const request = new Request('http://localhost:3000/api/jobs/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: 'https://example.com' }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({ error: 'Failed to start refresh job' })
    expect(mockInvalidateDashboardCache).not.toHaveBeenCalled()
  })

  it('still succeeds when cache invalidation fails', async () => {
    mockSendRefreshRequest.mockResolvedValueOnce(undefined)
    mockInvalidateDashboardCache.mockRejectedValueOnce(new Error('Redis unavailable'))

    const request = new Request('http://localhost:3000/api/jobs/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl: 'https://example.com' }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true, invalidatedCache: false })
  })
})
