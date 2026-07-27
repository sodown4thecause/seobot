import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

import { LandingPageContent } from '@/components/landing/landing-page-content'

describe('landing page server shell', () => {
  it('renders crawler-visible heading and links without request navigation hooks', () => {
    const html = renderToStaticMarkup(<LandingPageContent />)

    expect(html).toContain('<h1')
    expect(html).toMatch(/<a [^>]*href=/)
  })
})
