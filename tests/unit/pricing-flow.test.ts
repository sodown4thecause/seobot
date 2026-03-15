import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const currentUserMock = vi.fn()
const createCheckoutMock = vi.fn()

vi.mock('@clerk/nextjs', () => ({
  SignUp: ({ fallbackRedirectUrl }: { fallbackRedirectUrl: string }) =>
    createElement('div', { 'data-fallback-redirect-url': fallbackRedirectUrl }, 'Mock SignUp'),
}))

vi.mock('@polar-sh/sdk', () => ({
  Polar: vi.fn(() => ({
    checkouts: {
      create: createCheckoutMock,
    },
  })),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  currentUser: currentUserMock,
}))

describe('pricing page flow', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    currentUserMock.mockReset()
    createCheckoutMock.mockReset()
    delete process.env.POLAR_PRODUCT_ID
    delete process.env.POLAR_ACCESS_TOKEN
  })

  it('renders the updated public pricing copy', async () => {
    authMock.mockResolvedValue({ userId: null })

    const { default: PricesPage } = await import('@/app/prices/page')
    const element = await PricesPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('$39.99')
    expect(html).toContain('30-day free trial')
    expect(html).toContain('Start 30-day free trial')
  })

  it('keeps signup redirecting through billing checkout', async () => {
    const { default: SignUpPage } = await import('@/app/sign-up/[[...sign-up]]/page')
    const html = renderToStaticMarkup(createElement(SignUpPage))

    expect(html).toContain('/billing/checkout')
  })

  it('redirects authenticated users from billing checkout to the hosted Polar link', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    currentUserMock.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'test-user',
      primaryEmailAddress: {
        emailAddress: 'test@example.com',
      },
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    })

    const { GET } = await import('@/app/billing/checkout/route')
    const response = await GET(new NextRequest('http://localhost:3000/billing/checkout'))
    const location = response.headers.get('location')

    expect(location).not.toBeNull()

    const redirectUrl = new URL(location ?? 'https://buy.polar.sh')
    expect(`${redirectUrl.origin}${redirectUrl.pathname}`).toBe(
      'https://buy.polar.sh/polar_cl_03BxHIAE3KpoGAZaeC4oTlrwl3FCa89iB1Cw80Ncp60',
    )
    expect(redirectUrl.searchParams.get('customer_email')).toBe('test@example.com')
    expect(redirectUrl.searchParams.get('customer_name')).toBe('Test User')
    expect(redirectUrl.searchParams.get('reference_id')).toBe('user_123')
  })

  it('creates a Polar checkout session with user metadata when product config is set', async () => {
    process.env.POLAR_ACCESS_TOKEN = 'polar_test_token'
    process.env.POLAR_PRODUCT_ID = 'prod_123'
    createCheckoutMock.mockResolvedValue({
      url: 'https://polar.sh/checkout/session_123',
    })

    authMock.mockResolvedValue({ userId: 'user_123' })
    currentUserMock.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'test-user',
      primaryEmailAddress: {
        emailAddress: 'test@example.com',
      },
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    })

    const { GET } = await import('@/app/billing/checkout/route')
    const response = await GET(new NextRequest('http://localhost:3000/billing/checkout'))

    expect(createCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ['prod_123'],
        externalCustomerId: 'user_123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        metadata: { userId: 'user_123' },
      }),
    )
    expect(response.headers.get('location')).toBe('https://polar.sh/checkout/session_123')
  })

  it('falls back to the hosted Polar link when checkout session creation fails', async () => {
    process.env.POLAR_ACCESS_TOKEN = 'polar_test_token'
    process.env.POLAR_PRODUCT_ID = 'prod_123'
    createCheckoutMock.mockRejectedValue(new Error('polar unavailable'))

    authMock.mockResolvedValue({ userId: 'user_123' })
    currentUserMock.mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
      username: 'test-user',
      primaryEmailAddress: {
        emailAddress: 'test@example.com',
      },
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    })

    const { GET } = await import('@/app/billing/checkout/route')
    const response = await GET(new NextRequest('http://localhost:3000/billing/checkout'))
    const location = response.headers.get('location')

    expect(location).not.toBeNull()

    const redirectUrl = new URL(location ?? 'https://buy.polar.sh')
    expect(`${redirectUrl.origin}${redirectUrl.pathname}`).toBe(
      'https://buy.polar.sh/polar_cl_03BxHIAE3KpoGAZaeC4oTlrwl3FCa89iB1Cw80Ncp60',
    )
    expect(redirectUrl.searchParams.get('customer_email')).toBe('test@example.com')
    expect(redirectUrl.searchParams.get('customer_name')).toBe('Test User')
    expect(redirectUrl.searchParams.get('reference_id')).toBe('user_123')
  })

  it('trims metadata IDs before resolving Polar webhook users', async () => {
    const { resolvePolarUserId } = await import('@/lib/billing/polar-metadata')

    expect(resolvePolarUserId({ reference_id: 'user_123' })).toBe('user_123')
    expect(resolvePolarUserId({ userId: 'user_456', reference_id: 'user_123' })).toBe('user_456')
    expect(resolvePolarUserId({ userId: '   ', reference_id: ' user_789 ' })).toBe('user_789')
    expect(resolvePolarUserId(undefined)).toBeNull()
  })
})
