'use client'

import { Suspense, useState } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardChatModeSync } from '@/components/chat/dashboard-chat-mode-sync'
import { ChatModeSelector } from '@/components/chat/chat-mode-selector'
import { QueryClientProvider } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardBreadcrumbs } from '@/components/dashboard/breadcrumbs'
import { AgentProvider } from '@/components/providers/agent-provider'
import { ChatModeProvider } from '@/components/chat/chat-mode-context'
import { UserModeProvider } from '@/components/providers/user-mode-provider'
import { JargonProvider } from '@/components/providers/jargon-provider'
import { ActionProvider } from '@/components/providers/action-provider'
import { PostHogIdentify } from '@/components/providers/posthog-identify'
import { UsageSummaryCard } from '@/components/dashboard/usage-summary-card'
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
  'content': 'Workspace',
  'content-zone': 'Workspace',
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

interface DashboardClientLayoutProps {
  children: React.ReactNode
}

export function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
  const pathname = usePathname()
  const [queryClient] = useState(() => createDashboardQueryClient())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentPage = getCurrentPageName(pathname ?? '')
  const isChatDashboard = pathname === '/dashboard'

  return (
    <QueryClientProvider client={queryClient}>
      <UserModeProvider>
        <JargonProvider>
          <ActionProvider>
            <ChatModeProvider>
              <AgentProvider>
                <Suspense fallback={null}>
                  <DashboardChatModeSync />
                  <PostHogIdentify />
                </Suspense>
                <div className="relative flex h-screen overflow-hidden bg-zinc-950 text-foreground">
                  <Suspense fallback={null}>
                    <Sidebar
                      open={sidebarOpen}
                      onToggle={() => setSidebarOpen((v) => !v)}
                    />
                  </Suspense>
                  <main className={cn('relative z-10 flex h-full flex-1 flex-col')}>
                    <header className="shrink-0 border-b border-zinc-800 bg-[#090909]">
                      <div className="flex min-h-14 items-stretch">
                        <div className="flex min-w-[180px] items-center px-5">
                          <DashboardBreadcrumbs currentPage={currentPage} />
                        </div>
                        {isChatDashboard && (
                          <div className="hidden min-w-0 flex-1 items-stretch lg:flex">
                            <ChatModeSelector variant="header" className="mx-auto" />
                          </div>
                        )}
                        <div className="ml-auto hidden items-center border-l border-zinc-800 px-4 xl:flex">
                          <UsageSummaryCard className="min-w-[220px]" />
                        </div>
                      </div>
                    </header>
                    <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
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
