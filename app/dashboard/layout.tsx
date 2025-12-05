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
        <div className="min-h-screen bg-background flex text-foreground relative overflow-hidden">
          {/* Dashboard Background Ambience */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-glow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 noise-overlay" />

          </div>

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
  )
}
