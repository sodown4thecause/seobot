'use client'
import { LayoutDashboard, Search, Sparkles } from 'lucide-react'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/dashboard/sidebar'
import { AgentProvider } from '@/components/providers/agent-provider'
import { ChatModeProvider } from '@/components/chat/chat-mode-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ChatModeProvider>
      <AgentProvider>
        <div className="min-h-screen purple-gradient flex">
          {/* Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            currentPath={pathname}
          />

          {/* Main Content Area */}
          <main
            className={cn(
              'flex-1 min-h-screen p-6 md:p-8 transition-all duration-300',
              sidebarCollapsed ? 'ml-[72px]' : 'ml-[250px]'
            )}
          >
            {children}
          </main>
        </div>
      </AgentProvider>
    </ChatModeProvider>
  )
}
