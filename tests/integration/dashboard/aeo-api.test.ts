import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  buildAeoInsightsSnapshot: vi.fn(),
}))

vi.mock('@/lib/auth/clerk', () => ({
  getUserId: mocks.getUserId,
}))

vi.mock('@/lib/dashboard/aeo/service', () => ({
  buildAeoInsightsSnapshot: mocks.buildAeoInsightsSnapshot,
}))

import { GET as getSnapshot } from '@/app/api/dashboard/aeo/snapshot/route'
import { POST as postRefresh } from '@/app/api/dashboard/aeo/refresh/route'

describe('aeo dashboard API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserId.mockResolvedValue('user_123')
    mocks.buildAeoInsightsSnapshot.mockResolvedValue({
      workspace: 'aeo-insights',
      generatedAt: '2026-03-01T00:00:00.000Z',
      kpis: [{ id: 'llm-visibility', label: 'LLM Visibility Score', value: '64' }],
      modules: [{ id: 'visibility', title: 'Visibility', status: 'ready' }],
    })
  })

  it('returns 401 for unauthenticated snapshot request', async () => {
    mocks.getUserId.mockResolvedValueOnce(null)
    const response = await getSnapshot(new NextRequest('http://localhost:3000/api/dashboard/aeo/snapshot', { method: 'GET' }))

    expect(response.status).toBe(401)
  })

  it('returns normalized snapshot payload', async () => {
    const response = await getSnapshot(
      new NextRequest('http://localhost:3000/api/dashboard/aeo/snapshot?keyword=seo+reporting', { method: 'GET' })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.workspace).toBe('aeo-insights')
    expect(Array.isArray(payload.data.modules)).toBe(true)
  })

  it('returns refresh payload for valid request', async () => {
    const response = await postRefresh(
      new NextRequest('http://localhost:3000/api/dashboard/aeo/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com', promptCluster: 'buyer intent' }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.refreshQueued).toBe(true)
    expect(payload.jobId).toBeTypeOf('string')
  })
})
