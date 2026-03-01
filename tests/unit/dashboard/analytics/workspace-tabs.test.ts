import { describe, expect, it } from 'vitest'
import { resolveWorkspaceInitialTab, type WorkspaceTabItem } from '@/components/dashboard/analytics/workspace-tabs'

const tabs: WorkspaceTabItem[] = [
  { id: 'overview', label: 'Overview', content: null },
  { id: 'insights', label: 'Insights', content: null },
]

describe('resolveWorkspaceInitialTab', () => {
  it('uses provided default tab when it exists', () => {
    expect(resolveWorkspaceInitialTab(tabs, 'insights')).toBe('insights')
  })

  it('falls back to first tab when provided default tab does not exist', () => {
    expect(resolveWorkspaceInitialTab(tabs, 'missing-tab')).toBe('overview')
  })

  it('returns undefined when tab list is empty', () => {
    expect(resolveWorkspaceInitialTab([], 'overview')).toBeUndefined()
  })
})
