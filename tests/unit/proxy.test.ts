import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getSessionCookieMock = vi.hoisted(() => vi.fn())

vi.mock('better-auth/cookies', () => ({
  getSessionCookie: getSessionCookieMock,
}))

import proxy from '@/proxy'

const requestFor = (path: string) => new NextRequest(`https://flowintent.com${path}`)

describe('proxy route gate', () => {
  beforeEach(() => {
    getSessionCookieMock.mockReset()
    getSessionCookieMock.mockReturnValue(null)
  })

  it.each([
    '/reddit-gap',
    '/reddit-gap/results/audit-id',
    '/api/reddit-gap',
    '/api/cron/weekly-seo-research',
    '/api/cron/weekly-geo-research',
    '/api/cron/fortnightly-industry-research',
    '/api/rag/ingest?modes=content',
    '/api/inngest',
  ])('allows unauthenticated requests to %s to reach the route handler', async (path) => {
    const response = await proxy(requestFor(path))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('redirects an unauthenticated dashboard request to login', async () => {
    const response = await proxy(requestFor('/dashboard'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://flowintent.com/login')
  })

  it('redirects an authenticated login request to the dashboard', async () => {
    getSessionCookieMock.mockReturnValue('session-cookie')

    const response = await proxy(requestFor('/login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://flowintent.com/dashboard')
  })
})
