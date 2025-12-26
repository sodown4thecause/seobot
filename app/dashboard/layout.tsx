'use client'
import { LayoutDashboard, Search, Sparkles } from 'lucide-react'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { AgentProvider } from '@/components/providers/agent-provider'
import { ChatModeProvider } from '@/components/chat/chat-mode-context'
import { UserModeProvider } from '@/components/providers/user-mode-provider'
import { JargonProvider } from '@/components/providers/jargon-provider'
import { ActionProvider } from '@/components/providers/action-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <UserModeProvider>
      <JargonProvider>
        <ActionProvider>
          <ChatModeProvider>
            <AgentProvider>
              <div className="min-h-screen bg-[#1a1a1a] flex text-foreground relative overflow-hidden">

            {/* Sidebar */}
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              currentPath={pathname}
            />

            {/* Main Content Area */}
            <main
              className={cn(
                'flex-1 min-h-screen transition-all duration-300 relative z-10',
                sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
              )}
            >
              {children}
            </main>
              </div>
            </AgentProvider>
          </ChatModeProvider>
        </ActionProvider>
      </JargonProvider>
    </UserModeProvider>
  )
}
