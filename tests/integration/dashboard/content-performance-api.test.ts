import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  buildContentPerformanceSnapshot: vi.fn(),
}))

vi.mock('@/lib/auth/clerk', () => ({
  getUserId: mocks.getUserId,
}))

vi.mock('@/lib/dashboard/content-performance/service', () => ({
  buildContentPerformanceSnapshot: mocks.buildContentPerformanceSnapshot,
}))

import { GET as getSnapshot } from '@/app/api/dashboard/content-performance/snapshot/route'
import { POST as postRefresh } from '@/app/api/dashboard/content-performance/refresh/route'

describe('content performance dashboard API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserId.mockResolvedValue('user_123')
    mocks.buildContentPerformanceSnapshot.mockResolvedValue({
      workspace: 'content-performance',
      generatedAt: '2026-03-01T00:00:00.000Z',
      kpis: [{ id: 'content-roi', label: 'Content ROI Index', value: '70' }],
      modules: [{ id: 'content-roi', title: 'Content ROI', status: 'ready' }],
    })
  })

  it('returns 401 for unauthenticated snapshot request', async () => {
    mocks.getUserId.mockResolvedValueOnce(null)
    const response = await getSnapshot(
      new NextRequest('http://localhost:3000/api/dashboard/content-performance/snapshot', { method: 'GET' })
    )

    expect(response.status).toBe(401)
  })

  it('returns normalized snapshot payload', async () => {
    const response = await getSnapshot(
      new NextRequest('http://localhost:3000/api/dashboard/content-performance/snapshot?domain=example.com', { method: 'GET' })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.workspace).toBe('content-performance')
    expect(Array.isArray(payload.data.modules)).toBe(true)
  })

  it('returns refresh payload for valid request', async () => {
    const response = await postRefresh(
      new NextRequest('http://localhost:3000/api/dashboard/content-performance/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com', device: 'desktop' }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.refreshQueued).toBe(true)
    expect(payload.jobId).toBeTypeOf('string')
  })
})
