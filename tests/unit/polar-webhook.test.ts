import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const validateEventMock = vi.fn()
const eqMock = vi.fn()
const orMock = vi.fn()
const whereMock = vi.fn()
const setMock = vi.fn(() => ({ where: whereMock }))
const updateMock = vi.fn(() => ({ set: setMock }))

vi.mock('@polar-sh/sdk/webhooks', () => ({
  validateEvent: validateEventMock,
  WebhookVerificationError: class WebhookVerificationError extends Error {},
}))

vi.mock('@/lib/db', () => ({
  db: {
    update: updateMock,
  },
}))

vi.mock('@/lib/db/schema', () => ({
  users: {
    clerkId: 'clerkId',
    betterAuthId: 'betterAuthId',
    polarSubscriptionId: 'polarSubscriptionId',
  },
}))

vi.mock('@/lib/auth-schema', () => ({
  user: {
    id: 'authUserId',
    subscriptionStatus: 'authSubscriptionStatus',
    updatedAt: 'authUpdatedAt',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: eqMock,
  or: orMock,
}))

describe('Polar webhook route', () => {
  beforeEach(() => {
    vi.resetModules()
    validateEventMock.mockReset()
    eqMock.mockReset()
    orMock.mockReset()
    whereMock.mockReset()
    setMock.mockClear()
    updateMock.mockClear()
    process.env.POLAR_WEBHOOK_SECRET = 'test-secret'
  })

  it('updates subscriptions by Better Auth ID when metadata contains the auth user id', async () => {
    orMock.mockReturnValue('better-auth-or-clerk-match')

    validateEventMock.mockReturnValue({
      type: 'subscription.updated',
      data: {
        id: 'sub_123',
        customer_id: 'cust_123',
        status: 'active',
        metadata: {
          userId: 'user_123',
        },
      },
    })

    const { POST } = await import('@/app/api/webhooks/polar/route')
    const request = new NextRequest('http://localhost:3000/api/webhooks/polar', {
      method: 'POST',
      body: JSON.stringify({ ok: true }),
      headers: {
        'content-type': 'application/json',
      },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(eqMock).toHaveBeenCalledWith('betterAuthId', 'user_123')
    expect(eqMock).toHaveBeenCalledWith('clerkId', 'user_123')
    expect(eqMock).toHaveBeenCalledWith('authUserId', 'user_123')
    expect(whereMock).toHaveBeenCalledWith('better-auth-or-clerk-match')
  })
})
