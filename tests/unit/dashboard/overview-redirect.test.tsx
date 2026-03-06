import { describe, expect, it, vi } from 'vitest'

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

import OverviewPage from '@/app/dashboard/overview/page'

describe('dashboard overview route', () => {
  it('redirects to /dashboard', () => {
    OverviewPage()
    expect(redirectMock).toHaveBeenCalledWith('/dashboard')
  })
})
