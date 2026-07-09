import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WebsiteAuditPage from '@/app/dashboard/website-audit/page'
import RankTrackerPage from '@/app/dashboard/rank-tracker/page'
import ContentPerformancePage from '@/app/dashboard/content-performance/page'
import AeoInsightsPage from '@/app/dashboard/aeo/page'

vi.mock('recharts', () => {
  const passthrough = ({ children }: { children?: unknown }) => createElement('div', undefined, children as never)

  return {
    ResponsiveContainer: passthrough,
    BarChart: passthrough,
    Bar: passthrough,
    CartesianGrid: passthrough,
    Cell: passthrough,
    Tooltip: passthrough,
    XAxis: passthrough,
    YAxis: passthrough,
    LineChart: passthrough,
    Line: passthrough,
    AreaChart: passthrough,
    Area: passthrough,
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: 'test-user', email: 'test@test.com' } } }),
  },
}))

vi.mock('@/components/providers/agent-provider', () => ({
  useAgent: () => ({ state: { conversations: [] }, actions: { createConversation: vi.fn(), setActiveConversation: vi.fn() } }),
}))

function renderPage(Component: () => React.ReactElement) {
  const queryClient = new QueryClient()
  return renderToStaticMarkup(
    createElement(QueryClientProvider, { client: queryClient }, createElement(Component))
  )
}

describe('dashboard route pages', () => {
  it('renders website audit workspace content', () => {
    const html = renderPage(WebsiteAuditPage)

    expect(html).toContain('Website Audit Workspace')
    expect(html).toContain('Run audit')
    expect(html).toContain('Issue Queue')
  })

  it('renders rank tracker workspace content', () => {
    const html = renderPage(RankTrackerPage)

    expect(html).toContain('Rank Tracker Workspace')
    expect(html).toContain('Run rank tracker')
    expect(html).toContain('Keyword Movements')
  })

  it('renders content performance workspace content', () => {
    const html = renderPage(ContentPerformancePage)

    expect(html).toContain('Content Performance')
    expect(html).toContain('Content ROI')
    expect(html).toContain('Action Queue')
  })

  it('renders aeo insights workspace content', () => {
    const html = renderPage(AeoInsightsPage)

    expect(html).toContain('AEO Command Center')
    expect(html).toContain('Citation Tracking Coming Soon')
    expect(html).toContain('AEO Workflows')
  })
})
