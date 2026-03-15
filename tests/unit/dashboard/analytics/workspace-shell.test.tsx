import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  WorkspaceShell,
  type WorkspaceActionItem,
  type WorkspaceHistoryItem,
  type WorkspaceKpiItem,
  type WorkspaceTabItem,
} from '@/components/dashboard/analytics/workspace-shell'

describe('WorkspaceShell', () => {
  it('renders toolbar, KPIs, tabs, action queue, and history in one workspace frame', () => {
    const kpis: WorkspaceKpiItem[] = [
      { id: 'coverage', label: 'Coverage', value: '78%' },
      { id: 'citations', label: 'Citations', value: '42' },
    ]

    const tabs: WorkspaceTabItem[] = [
      { id: 'overview', label: 'Overview', content: createElement('p', undefined, 'Overview panel') },
      { id: 'insights', label: 'Insights', content: createElement('p', undefined, 'Insights panel') },
    ]

    const actionQueue: WorkspaceActionItem[] = [
      { id: 'a1', title: 'Refresh citation evidence', status: 'in_progress' },
    ]

    const history: WorkspaceHistoryItem[] = [
      { id: 'h1', label: 'Run completed', timestamp: '2026-03-01 09:15 UTC', detail: 'Scanned 24 pages' },
    ]

    const html = renderToStaticMarkup(
      createElement(WorkspaceShell, {
        workspace: 'content-performance',
        title: 'Content Performance Workspace',
        description: 'Shared shell for analytics surfaces.',
        kpis,
        tabs,
        defaultTab: 'overview',
        actionQueue,
        history,
      })
    )

    expect(html).toContain('Content Performance Workspace')
    expect(html).toContain('Shared shell for analytics surfaces.')
    expect(html).toContain('Coverage')
    expect(html).toContain('78%')
    expect(html).toContain('Overview')
    expect(html).toContain('Action Queue')
    expect(html).toContain('Refresh citation evidence')
    expect(html).toContain('History')
    expect(html).toContain('Run completed')
    expect(html).toContain('Save view')
    expect(html).toContain('Export')
  })
})
