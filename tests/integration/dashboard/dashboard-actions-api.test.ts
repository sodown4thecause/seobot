import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  runDashboardAction: vi.fn(),
}))

vi.mock('@/lib/auth/clerk', () => ({
  getUserId: mocks.getUserId,
}))

vi.mock('@/lib/dashboard/actions/orchestrator', () => ({
  runDashboardAction: mocks.runDashboardAction,
}))

import { POST as postContentAction } from '@/app/api/dashboard/content-performance/actions/[action]/route'
import { POST as postAeoAction } from '@/app/api/dashboard/aeo/actions/[action]/route'

function context(action: string) {
  return { params: Promise.resolve({ action }) }
}

describe('dashboard action routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserId.mockResolvedValue('user_123')
    mocks.runDashboardAction.mockResolvedValue({
      jobId: '11111111-1111-4111-8111-111111111111',
      status: 'queued',
      trace: { tool: 'generate-brief', summary: 'ok' },
    })
  })

  it('returns 401 for unauthenticated requests', async () => {
    mocks.getUserId.mockResolvedValueOnce(null)

    const response = await postContentAction(
      new NextRequest('http://localhost:3000/api/dashboard/content-performance/actions/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com' }),
      }),
      context('generate-brief')
    )

    expect(response.status).toBe(401)
  })

  it('queues content performance action and returns job metadata', async () => {
    const response = await postContentAction(
      new NextRequest('http://localhost:3000/api/dashboard/content-performance/actions/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com' }),
      }),
      context('generate-brief')
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.jobId).toBeTypeOf('string')
    expect(mocks.runDashboardAction).toHaveBeenCalled()
  })

  it('queues aeo action and returns job metadata', async () => {
    const response = await postAeoAction(
      new NextRequest('http://localhost:3000/api/dashboard/aeo/actions/track-query-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'example.com' }),
      }),
      context('track-query-set')
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.trace).toBeDefined()
    expect(mocks.runDashboardAction).toHaveBeenCalled()
  })
})
