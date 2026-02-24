'use client'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardBreadcrumbs } from '@/components/dashboard/breadcrumbs'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { JobProgress } from '@/components/dashboard/job-progress'
import { AgentProvider } from '@/components/providers/agent-provider'
import { ChatModeProvider } from '@/components/chat/chat-mode-context'
import { UserModeProvider } from '@/components/providers/user-mode-provider'
import { JargonProvider } from '@/components/providers/jargon-provider'
import { ActionProvider } from '@/components/providers/action-provider'
import { dashboardQueryClient } from '@/lib/cache/query-client'

const PAGE_NAMES: Record<string, string> = {
  overview: 'Overview',
  'website-audit': 'Website Audit',
  'rank-tracker': 'Rank Tracker',
  'competitor-monitor': 'Competitor Monitor',
  'keyword-opportunities': 'Keyword Opportunities',
  'backlink-profile': 'Backlink Profile',
  'content-performance': 'Content Performance',
  'aeo-insights': 'AEO Insights',
}

function getCurrentPageName(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const dashboardSegment = segments[1]
  if (!dashboardSegment) {
    return 'Overview'
  }

  return PAGE_NAMES[dashboardSegment] ?? dashboardSegment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const currentPage = getCurrentPageName(pathname ?? '/dashboard/overview')

  return (
    <QueryClientProvider client={dashboardQueryClient}>
      <UserModeProvider>
        <JargonProvider>
          <ActionProvider>
            <ChatModeProvider>
              <AgentProvider>
                <div className="relative flex min-h-screen overflow-hidden bg-zinc-950 text-foreground">
                  <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    currentPath={pathname ?? ''}
                  />
                  <main className={cn('relative z-10 flex min-h-screen flex-1 flex-col')}>
                    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 px-5 py-3 backdrop-blur">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <DashboardBreadcrumbs currentPage={currentPage} />
                        <div className="flex items-center gap-3">
                          <JobProgress className="hidden md:block" />
                          <RefreshButton estimatedCostUsd={0.011} />
                        </div>
                      </div>
                    </header>
                    <div className="flex-1 px-4 py-4 md:px-6">{children}</div>
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
