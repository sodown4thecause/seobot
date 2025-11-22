'use client'

import * as React from 'react'
import Link from 'next/link'
import { type LucideIcon, MessageSquare, Archive, BookOpen, FolderPlus, Image as ImageIcon, FileText, Layout, ChevronsLeft, ChevronsRight, Crown, Target, Palette, PenTool, Sparkles, ShieldCheck } from 'lucide-react'
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
]

const AGENTS = [
  { id: 'seo_manager', name: 'SEO Manager', icon: Target, color: 'text-blue-500' },
  { id: 'marketing_manager', name: 'Marketing Expert', icon: Palette, color: 'text-purple-500' },
  { id: 'article_writer', name: 'Article Writer', icon: PenTool, color: 'text-green-500' },
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
        'fixed left-0 top-0 h-screen bg-zinc-900 text-zinc-100 z-40',
        'border-r border-zinc-800 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[250px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-900 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-semibold text-zinc-100 tracking-tight">Flow Intent</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
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
                'flex items-center gap-3 px-3 py-2 rounded-md',
                'bg-zinc-800 hover:bg-zinc-700 transition-colors',
                'text-zinc-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600'
              )}
              title={collapsed ? 'New Chat' : undefined}
            >
              <FolderPlus className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">New Chat</span>}
            </Link>

            {/* Create Image Button */}
            <button
              onClick={toggleImageMode}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md w-full',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600',
                isImageMode
                  ? 'bg-purple-900/20 text-purple-400 border border-purple-900/50'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
              )}
              title={collapsed ? 'Create Image' : undefined}
            >
              <Sparkles className={cn(
                'h-4 w-4 flex-shrink-0',
                isImageMode ? 'text-purple-400' : ''
              )} />
              {!collapsed && (
                <span className="text-sm font-medium flex-1 text-left">Create Image</span>
              )}
              {!collapsed && isImageMode && (
                <Badge variant="default" className="ml-auto text-[10px] bg-purple-900 text-purple-100 hover:bg-purple-800">
                  Active
                </Badge>
              )}
            </button>

            {/* Features Section */}
            <div>
              {!collapsed && (
                <>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">
                    Features
                  </h3>
                </>
              )}
              <nav className="space-y-0.5" role="navigation">
                {FEATURES.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                        'transition-colors duration-200',
                        isActive
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* AI Agents Section */}
            <div>
              {!collapsed && (
                <>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">
                    AI Agents
                  </h3>
                </>
              )}
              <nav className="space-y-0.5" role="navigation">
                {AGENTS.map((agent) => {
                  const Icon = agent.icon
                  const isActive = activeAgent?.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => actions.switchAgent(agent.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                        'transition-colors duration-200',
                        isActive
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                      )}
                      title={collapsed ? agent.name : undefined}
                    >
                      <Icon className={cn('h-4 w-4 flex-shrink-0', agent.color)} />
                      {!collapsed && <span className="font-medium">{agent.name}</span>}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Workspaces Section */}
            <div>
              {!collapsed && (
                <>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">
                    Workspaces
                  </h3>
                </>
              )}
              <nav className="space-y-0.5" role="navigation">
                {WORKSPACES.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPath === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                        'transition-colors duration-200',
                        isActive
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
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
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">
                      Admin
                    </h3>
                  </>
                )}
                <nav className="space-y-0.5" role="navigation">
                  {ADMIN_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPath === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                          'transition-colors duration-200',
                          isActive
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.name}</span>}
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
          <div className="p-4 border-t border-zinc-800">
            <div className="bg-zinc-800/50 rounded-md p-4 space-y-3 border border-zinc-800">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-zinc-100" />
                <span className="font-semibold text-sm text-zinc-100">Premium</span>
              </div>
              <p className="text-xs text-zinc-400">
                Unlock AI automation for content creation and team collaboration
              </p>
              <Button
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 transition-colors"
                size="sm"
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed Toggle Button */}
        {collapsed && (
          <div className="p-4 border-t border-zinc-800 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
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
