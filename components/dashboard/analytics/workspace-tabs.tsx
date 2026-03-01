'use client'

import type { ReactNode } from 'react'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface WorkspaceTabItem {
  id: string
  label: string
  content: ReactNode
}

interface WorkspaceTabsProps {
  tabs: WorkspaceTabItem[]
  defaultTab?: string
}

export function resolveWorkspaceInitialTab(tabs: WorkspaceTabItem[], defaultTab?: string): string | undefined {
  if (tabs.length === 0) {
    return undefined
  }

  if (defaultTab && tabs.some((tab) => tab.id === defaultTab)) {
    return defaultTab
  }

  return tabs[0]?.id
}

export function WorkspaceTabs({ tabs, defaultTab }: WorkspaceTabsProps) {
  const initialTab = resolveWorkspaceInitialTab(tabs, defaultTab)

  if (!initialTab) {
    return null
  }

  return (
    <Tabs defaultValue={initialTab} className="space-y-4">
      <TabsList className={workspaceThemeTokens.surface.tabsList}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className={workspaceThemeTokens.text.tabsTrigger}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="space-y-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
