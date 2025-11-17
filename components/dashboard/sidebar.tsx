'use client'

import * as React from 'react'
import Link from 'next/link'
import { type LucideIcon, MessageSquare, Archive, BookOpen, FolderPlus, Image as ImageIcon, FileText, Layout, ChevronsLeft, ChevronsRight, Crown, Target, Palette, PenTool, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAgent } from '@/components/providers/agent-provider'
import { useChatModeOptional } from '@/components/chat/chat-mode-context'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  current?: boolean
}

export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentPath: string
}

const FEATURES: NavItem[] = [
  { name: 'Chat', href: '/dashboard', icon: MessageSquare },
  { name: 'Archived', href: '/dashboard/archived', icon: Archive },
  { name: 'Library', href: '/dashboard/library', icon: BookOpen },
]

const WORKSPACES: NavItem[] = [
  { name: 'New Project', href: '/dashboard/content/create', icon: FolderPlus },
  { name: 'Image Creation', href: '/images', icon: ImageIcon },
  { name: 'Presentation', href: '/dashboard/presentation', icon: Layout },
  { name: 'Riset', href: '/dashboard/riset', icon: FileText },
  { name: 'Workflow Analytics', href: '/dashboard/workflow-analytics', icon: BarChart3 },
]

const AGENTS = [
  { id: 'seo_manager', name: 'SEO Manager', icon: Target, color: 'text-blue-400' },
  { id: 'marketing_manager', name: 'Marketing Expert', icon: Palette, color: 'text-purple-400' },
  { id: 'article_writer', name: 'Article Writer', icon: PenTool, color: 'text-green-400' },
]

const ADMIN_ITEMS: NavItem[] = [
  { name: 'Admin', href: '/dashboard/admin', icon: ShieldCheck },
]

export function Sidebar({ collapsed, onToggle, currentPath }: SidebarProps) {
  const { state, actions } = useAgent()
  const { activeAgent } = state
  const { isImageMode, toggleImageMode } = useChatModeOptional()
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/profile')
        if (!res.ok) {
          if (!cancelled) setIsAdmin(false)
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setIsAdmin(Boolean(data?.isAdmin))
        }
      } catch (error) {
        if (!cancelled) {
          setIsAdmin(false)
        }
      }
    }

    checkAdmin()

    return () => {
      cancelled = true
    }
  }, [])
  
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[#1e1e2e] text-white z-40',
        'border-r border-white/10 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[250px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-semibold text-white tracking-tight">Flow Intent</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-primary flex items-center justify-center mx-auto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {/* New Chat Button */}
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg',
                'bg-white/5 hover:bg-white/10 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60'
              )}
              title={collapsed ? 'New Chat' : undefined}
            >
              <FolderPlus className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">New Chat</span>}
            </Link>

            {/* Create Image Button */}
            <button
              onClick={toggleImageMode}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg w-full',
                'transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60',
                isImageMode
                  ? 'glass border border-white/20 ring-1 ring-purple-400/30 text-white bg-purple-500/10'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              )}
              title={collapsed ? 'Create Image' : undefined}
            >
              <Sparkles className={cn(
                'h-5 w-5 flex-shrink-0',
                isImageMode ? 'text-purple-400' : ''
              )} />
              {!collapsed && (
                <span className="text-sm font-medium flex-1 text-left">Create Image</span>
              )}
              {!collapsed && isImageMode && (
                <Badge variant="default" className="ml-auto text-xs bg-purple-500 hover:bg-purple-600">
                  Active
                </Badge>
              )}
            </button>

            {/* Features Section */}
            <div>
              {!collapsed && (
                <>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-3">
                    Features
                  </h3>
                  <Separator className="bg-white/10 mb-3" />
                </>
              )}
              <nav className="space-y-1" role="navigation">
                {FEATURES.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg',
                        'transition-all duration-300',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60',
                        isActive
                          ? 'glass border border-white/20 ring-1 ring-cyan-bright/30 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* AI Agents Section */}
            <div>
              {!collapsed && (
                <>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-3">
                    AI Agents
                  </h3>
                  <Separator className="bg-white/10 mb-3" />
                </>
              )}
              <nav className="space-y-1" role="navigation">
                {AGENTS.map((agent) => {
                  const Icon = agent.icon
                  const isActive = activeAgent?.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => actions.switchAgent(agent.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                        'transition-all duration-300',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60',
                        isActive
                          ? 'glass border border-white/20 ring-1 ring-cyan-bright/30 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                      title={collapsed ? agent.name : undefined}
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', agent.color)} />
                      {!collapsed && <span className="text-sm font-medium">{agent.name}</span>}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Workspaces Section */}
            <div>
              {!collapsed && (
                <>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-3">
                    Workspaces
                  </h3>
                  <Separator className="bg-white/10 mb-3" />
                </>
              )}
              <nav className="space-y-1" role="navigation">
                {WORKSPACES.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg',
                        'transition-all duration-300',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60',
                        isActive
                          ? 'glass border border-white/20 ring-1 ring-cyan-bright/30 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <div>
                {!collapsed && (
                  <>
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-3">
                      Admin
                    </h3>
                    <Separator className="bg-white/10 mb-3" />
                  </>
                )}
                <nav className="space-y-1" role="navigation">
                  {ADMIN_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPath === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg',
                          'transition-all duration-300',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-bright/60',
                          isActive
                            ? 'glass border border-white/20 ring-1 ring-cyan-bright/30 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Upgrade Card at Bottom */}
        {!collapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="glass-dark rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-white" />
                <span className="font-semibold text-sm">Upgrade to premium</span>
              </div>
              <p className="text-xs text-white/70">
                Unlock AI automation for content creation and team collaboration
              </p>
              <Button
                className="w-full purple-gradient text-white hover:scale-105 transition-transform duration-300 shadow-purple"
                size="sm"
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed Toggle Button */}
        {collapsed && (
          <div className="p-4 border-t border-white/10 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              title="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
