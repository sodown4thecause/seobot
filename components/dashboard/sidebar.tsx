"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  PenLine,
  Image,
  Workflow,
  Clock,
  Trash2,
  Search,
  TrendingUp,
  Users,
  KeyRound,
  Link as LinkIcon,
  FileText,
  Sparkles,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAgent, type Conversation } from '@/components/providers/agent-provider'
import { Logo } from '@/components/ui/logo'
import { isContentDashboardRoute, isImageDashboardRoute } from '@/lib/dashboard/sidebar-routes'

export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

// Original dashboard page links — all kept intact
const DASHBOARD_LINKS = [
  { name: 'Website Audit', href: '/dashboard/website-audit', icon: Search },
  { name: 'Rank Tracker', href: '/dashboard/rank-tracker', icon: TrendingUp },
  { name: 'Competitor Monitor', href: '/dashboard/competitor-monitor', icon: Users },
  { name: 'Keyword Opportunities', href: '/dashboard/keyword-opportunities', icon: KeyRound },
  { name: 'Backlink Profile', href: '/dashboard/backlink-profile', icon: LinkIcon },
  { name: 'Content Performance', href: '/dashboard/content-performance', icon: FileText },
  { name: 'AEO Insights', href: '/dashboard/aeo', icon: Sparkles },
] as const

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state, actions } = useAgent()
  const hasFetchedRef = React.useRef(false)
  const isContentRoute = isContentDashboardRoute(pathname)
  const isImageRoute = isImageDashboardRoute(pathname)

  // Load conversation history once on mount — fails silently if 401, history is optional
  React.useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      actions.loadConversations().catch(() => { })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // New Chat — just navigate to /dashboard (chat resets itself)
  const handleNewChat = React.useCallback(async () => {
    const agentId = state.activeAgent?.id ?? 'general'

    try {
      const conversation = await actions.createConversation(agentId, 'New Conversation')
      if (!conversation) {
        console.error('[Sidebar] Failed to create a new conversation')
        return
      }

      actions.setActiveConversation(conversation)
      router.push(`/dashboard?conversationId=${conversation.id}`)
    } catch (error) {
      console.error('[Sidebar] Failed to start a new chat:', error)
    }
  }, [actions, router, state.activeAgent?.id])
  // Content Creation → dedicated content studio page
  const handleContentCreation = React.useCallback(() => {
    router.push('/dashboard/content')
  }, [router])

  // Image Generation → dedicated image studio page
  const handleImageGen = React.useCallback(() => {
    router.push('/dashboard/image')
  }, [router])

  const handleSelectConversation = React.useCallback((conv: Conversation) => {
    actions.setActiveConversation(conv)
    router.push(`/dashboard?conversationId=${conv.id}`)
  }, [actions, router])

  const handleDeleteConversation = React.useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await actions.deleteConversation(id)
    } catch (error) {
      console.error('[Sidebar] Failed to delete conversation:', error)
    }
  }, [actions])

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'sticky top-0 z-30 hidden h-screen shrink-0 border-r border-zinc-800 bg-zinc-950 md:flex md:flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-4 h-[57px]">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="text-sm font-bold text-zinc-100 tracking-tight">Flow Intent</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 shrink-0',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat */}
      <div className="px-2 pt-3 pb-2">
        <Button
          id="new-chat-btn"
          onClick={handleNewChat}
          className={cn(
            'w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-all',
            collapsed ? 'px-0 justify-center' : 'justify-start gap-2 px-3'
          )}
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* ── AI Create section ── */}
        <div className="pb-2 border-b border-zinc-800/60">
          {!collapsed && (
            <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Create
            </p>
          )}
          <nav className="space-y-0.5">
            <SidebarBtn
              id="sidebar-content-creation"
              icon={PenLine}
              label="Content Creation"
              collapsed={collapsed}
              isActive={isContentRoute}
              onClick={handleContentCreation}
            />
            <SidebarBtn
              id="sidebar-image-generation"
              icon={Image}
              label="Image Generation"
              collapsed={collapsed}
              isActive={isImageRoute}
              onClick={handleImageGen}
            />
            <SidebarBtn
              id="sidebar-workflows"
              icon={Workflow}
              label="Workflows"
              collapsed={collapsed}
              isActive={pathname?.startsWith('/dashboard/workflows')}
              onClick={() => router.push('/dashboard/workflows')}
            />
          </nav>
        </div>

        {/* ── Conversation history ── */}
        <div className="py-2 border-b border-zinc-800/60">
          {!collapsed && (
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent Chats
            </p>
          )}

          {state.conversations.length === 0 ? (
            !collapsed && (
              <p className="px-2 py-1 text-xs text-zinc-600 italic">No conversations yet</p>
            )
          ) : (
            <nav className="space-y-0.5">
              {state.conversations.slice(0, 20).map((conv) => {
                const isActive = state.activeConversation?.id === conv.id
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      'group relative flex items-center rounded-lg transition-colors cursor-pointer select-none',
                      collapsed ? 'justify-center px-2 py-2' : 'px-2 py-1.5',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                    )}
                    onClick={() => handleSelectConversation(conv)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv)}
                    title={collapsed ? conv.title : undefined}
                  >
                    {collapsed ? (
                      <span className="text-[10px] font-bold text-zinc-500">
                        {conv.title.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate leading-tight">
                            {conv.title || 'Untitled chat'}
                          </p>
                          {conv.lastMessage?.content && (
                            <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                              {conv.lastMessage.content.slice(0, 55)}
                            </p>
                          )}
                        </div>
                        <button
                          className="ml-1 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition-all p-1 rounded"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          aria-label={`Delete ${conv.title}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </nav>
          )}
        </div>

        {/* ── Dashboard pages (all original links) ── */}
        <div className="py-2">
          {!collapsed && (
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Dashboard
            </p>
          )}
          <nav className="space-y-0.5">
            {DASHBOARD_LINKS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-2 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200',
                    collapsed && 'justify-center px-2'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', !collapsed && 'mr-2')} />
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* AEO Audit footer link */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-zinc-800/50">
          <Link
            href="/audit"
            className="block text-xs text-zinc-500 hover:text-emerald-400 transition-colors font-medium"
          >
            🔍 Free AEO Audit
          </Link>
        </div>
      )}
    </aside>
  )
}

// Button-style sidebar item (for action items that aren't nav links)
function SidebarBtn({
  id,
  icon: Icon,
  label,
  collapsed,
  onClick,
  disabled,
  isActive,
}: {
  id: string
  icon: React.ElementType
  label: string
  collapsed: boolean
  onClick?: () => void
  disabled?: boolean
  isActive?: boolean
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        collapsed ? 'justify-center px-2 py-1.5' : 'gap-2.5 px-2 py-1.5',
        isActive
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  )
}
