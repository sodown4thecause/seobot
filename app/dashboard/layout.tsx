'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardBreadcrumbs } from '@/components/dashboard/breadcrumbs'
import { AgentProvider } from '@/components/providers/agent-provider'
import { ChatModeProvider } from '@/components/chat/chat-mode-context'
import { UserModeProvider } from '@/components/providers/user-mode-provider'
import { JargonProvider } from '@/components/providers/jargon-provider'
import { ActionProvider } from '@/components/providers/action-provider'
import { createDashboardQueryClient } from '@/lib/cache/query-client'

const PAGE_NAMES: Record<string, string> = {
  'website-audit': 'Website Audit',
  'rank-tracker': 'Rank Tracker',
  'competitor-monitor': 'Competitor Monitor',
  'keyword-opportunities': 'Keyword Opportunities',
  'backlink-profile': 'Backlink Profile',
  'content-performance': 'Content Performance',
  'aeo-insights': 'AEO Insights',
  'aeo': 'AEO Insights',
  'workflows': 'Workflows',
  'content': 'Content Creation',
  'content-zone': 'Content Creation',
  'image': 'Image Generation',
  'images': 'Image Generation',
}

function getCurrentPageName(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const dashboardSegment = segments[1]
  if (!dashboardSegment) return 'Dashboard'
  return (
    PAGE_NAMES[dashboardSegment] ??
    dashboardSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [queryClient] = useState(() => createDashboardQueryClient())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const currentPage = getCurrentPageName(pathname ?? '')

  return (
    <QueryClientProvider client={queryClient}>
      <UserModeProvider>
        <JargonProvider>
          <ActionProvider>
            <ChatModeProvider>
              <AgentProvider>
                <div className="relative flex min-h-screen overflow-hidden bg-zinc-950 text-foreground">
                  <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((v) => !v)}
                  />
                  <main className={cn('relative z-10 flex min-h-screen flex-1 flex-col')}>
                    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 px-5 py-3 backdrop-blur">
                      <DashboardBreadcrumbs currentPage={currentPage} />
                    </header>
                    <div className="flex-1">{children}</div>
                  </main>
                </div>
              </AgentProvider>
            </ChatModeProvider>
          </ActionProvider>
        </JargonProvider>
      </UserModeProvider>
    </QueryClientProvider>
  )
}
