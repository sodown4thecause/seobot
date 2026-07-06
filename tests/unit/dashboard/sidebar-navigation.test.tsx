import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Sidebar } from '@/components/dashboard/sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/components/providers/agent-provider', () => ({
  useAgent: () => ({
    state: { conversations: [] },
    actions: {},
  }),
}))

describe('dashboard sidebar navigation', () => {
  it('hides Overview and Free AEO Audit links', () => {
    const html = renderToStaticMarkup(
      <Sidebar open={false} onToggle={() => {}} />
    )

    expect(html).toContain('Website Audit')
    expect(html).not.toContain('Overview')
    expect(html).not.toContain('Free AEO Audit')
  })
})
