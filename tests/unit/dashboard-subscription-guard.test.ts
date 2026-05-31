import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.hoisted(() => vi.fn())
const redirectMock = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`)
}))
const selectRowsQueue = vi.hoisted(() => [] as unknown[][])

vi.mock('@/lib/auth-config', () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(selectRowsQueue.shift() ?? [])),
        })),
      })),
    })),
  },
}))

vi.mock('@/lib/db/schema', () => ({
  users: {
    id: 'users.id',
    betterAuthId: 'users.betterAuthId',
    subscriptionStatus: 'users.subscriptionStatus',
    polarSubscriptionId: 'users.polarSubscriptionId',
    currentPeriodEnd: 'users.currentPeriodEnd',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value })),
}))

describe('dashboard subscription guard', () => {
  beforeEach(() => {
    vi.resetModules()
    getSessionMock.mockReset()
    redirectMock.mockClear()
    selectRowsQueue.splice(0, selectRowsQueue.length)
  })

  it('redirects signed-in users without an active subscription to billing checkout', async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: 'user_123',
        email: 'customer@example.com',
      },
    })
    selectRowsQueue.push([{ id: 'app_user_123', authUserId: 'user_123', subscriptionStatus: 'inactive' }])

    const { requireSubscription } = await import('@/lib/billing/subscription-guard')

    await expect(requireSubscription('/billing/checkout')).rejects.toThrow(
      'NEXT_REDIRECT:/billing/checkout',
    )
    expect(redirectMock).toHaveBeenCalledWith('/billing/checkout')
  })

  it('always allows the admin email through dashboard subscription gating', async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: 'admin_123',
        email: 'liam@flowintent.com',
      },
    })

    const { requireSubscription } = await import('@/lib/billing/subscription-guard')

    await expect(requireSubscription('/billing/checkout')).resolves.toMatchObject({
      hasSubscription: true,
      status: 'active',
      authUserId: 'admin_123',
    })
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
