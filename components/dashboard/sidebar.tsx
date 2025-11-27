'use client'

import * as React from 'react'
import Link from 'next/link'
import { type LucideIcon, MessageSquare, Archive, BookOpen, FolderPlus, Image as ImageIcon, FileText, Layout, ChevronsLeft, ChevronsRight, Crown, Target, Palette, PenTool, ShieldCheck, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAgent } from '@/components/providers/agent-provider'
import { useChatModeOptional } from '@/components/chat/chat-mode-context'
import { Logo } from '@/components/ui/logo'

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
  { name: 'Research', href: '/dashboard/riset', icon: FileText },
  { name: 'Analytics', href: '/dashboard/workflow-analytics', icon: BarChart3 },
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
        if (!cancelled) setIsAdmin(Boolean(data?.isAdmin))
      } catch (error) {
        if (!cancelled) setIsAdmin(false)
      }
    }
    checkAdmin()
    return () => { cancelled = true }
  }, [])

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-black/20 backdrop-blur-2xl border-r border-white/5',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-20 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 border border-yellow-500/20 flex items-center justify-center shadow-lg shadow-yellow-500/10">
                <Logo className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Flow Intent</span>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 border border-yellow-500/20 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/10">
              <Logo className="w-5 h-5" />
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-3 py-6">
          <div className="space-y-8">
            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl group relative overflow-hidden',
                  'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20',
                  'border border-white/5 hover:border-white/10 transition-all duration-300',
                  'text-zinc-100'
                )}
                title={collapsed ? 'New Chat' : undefined}
              >
                <FolderPlus className="h-5 w-5 flex-shrink-0 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                {!collapsed && <span className="text-sm font-medium">New Chat</span>}
              </Link>

              <button
                onClick={toggleImageMode}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl w-full group relative overflow-hidden',
                  'transition-all duration-300 border',
                  isImageMode
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'
                    : 'bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-100'
                )}
                title={collapsed ? 'Create Image' : undefined}
              >
                <ImageIcon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isImageMode ? 'text-purple-400' : 'group-hover:text-purple-400'
                )} />
                {!collapsed && (
                  <span className="text-sm font-medium flex-1 text-left">Create Image</span>
                )}
                {!collapsed && isImageMode && (
                  <Badge variant="default" className="ml-auto text-[10px] bg-purple-600/50 text-purple-100 hover:bg-purple-600/60 border-0">
                    Active
                  </Badge>
                )}
              </button>
            </div>

            {/* Navigation Groups */}
            {[
              { title: 'Features', items: FEATURES },
              { title: 'Workspaces', items: WORKSPACES },
              { title: 'Admin', items: ADMIN_ITEMS, condition: isAdmin }
            ].map((group) => {
              if (group.condition === false) return null
              return (
                <div key={group.title}>
                  {!collapsed && (
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-3">
                      {group.title}
                    </h3>
                  )}
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = currentPath === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative',
                            isActive
                              ? 'bg-white/10 text-white font-medium shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]'
                              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                          )}
                          title={collapsed ? item.name : undefined}
                        >
                          <Icon className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                          )} />
                          {!collapsed && <span>{item.name}</span>}
                          {isActive && !collapsed && (
                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]" />
                          )}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              )
            })}

            {/* AI Agents */}
            <div>
              {!collapsed && (
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-3">
                  AI Agents
                </h3>
              )}
              <nav className="space-y-1">
                {AGENTS.map((agent) => {
                  const Icon = agent.icon
                  const isActive = activeAgent?.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => actions.switchAgent(agent.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative',
                        isActive
                          ? 'bg-white/10 text-white font-medium shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                      )}
                      title={collapsed ? agent.name : undefined}
                    >
                      <Icon className={cn('h-4 w-4 flex-shrink-0 transition-opacity', agent.color, isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100')} />
                      {!collapsed && <span>{agent.name}</span>}
                      {isActive && !collapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_2px_rgba(99,102,241,0.5)]" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-3 bg-black/20">
          {!collapsed && (
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl p-4 border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-500/30 transition-colors" />

              <div className="flex items-center gap-2 mb-2 relative z-10">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-xs text-white">Pro Plan</span>
              </div>
              <p className="text-[10px] text-zinc-400 mb-3 relative z-10 leading-relaxed">
                Unlock advanced AI models & unlimited queries.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-8 text-xs bg-white text-black hover:bg-zinc-200 border-0 shadow-lg shadow-black/20"
              >
                Upgrade Now
              </Button>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <ChevronsRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-zinc-500 hover:text-zinc-300 hover:bg-white/5 h-9 rounded-lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}