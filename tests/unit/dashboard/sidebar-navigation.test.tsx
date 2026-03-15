import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Sidebar } from '@/components/dashboard/sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('dashboard sidebar navigation', () => {
  it('hides Overview and Free AEO Audit links', () => {
    const html = renderToStaticMarkup(
      <Sidebar collapsed={false} onToggle={() => {}} currentPath="/dashboard" />
    )

    expect(html).toContain('Website Audit')
    expect(html).not.toContain('Overview')
    expect(html).not.toContain('Free AEO Audit')
  })
})
