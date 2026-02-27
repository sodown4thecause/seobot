import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WebsiteAuditPage from '@/app/dashboard/website-audit/page'
import RankTrackerPage from '@/app/dashboard/rank-tracker/page'

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
})
