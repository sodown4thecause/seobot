"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  MessageSquarePlus,
  MessageSquare,
  Clock,
  Trash2,
  Search,
  TrendingUp,
  Users,
  KeyRound,
  Link as LinkIcon,
  FileText,
  Sparkles,
  FolderOpen,
} from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAgent, type Conversation } from '@/components/providers/agent-provider'
import { useChatModeOptional } from '@/components/chat/chat-mode-context'
import { buildDashboardChatHref } from '@/lib/chat/conversation-mode'

export interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const DEFAULT_VISIBLE_RECENT_CHATS = 5

const DASHBOARD_LINK_GROUPS = [
  {
    title: 'Workspace',
    hint: 'Saved artifacts and library items from all modes',
    links: [{ name: 'Workspace', href: '/dashboard/workspace', icon: FolderOpen }],
  },
  {
    title: 'SEO & content data',
    hint: 'Rankings, keywords, audits — pairs with SEO & Content modes',
    links: [
      { name: 'Website Audit', href: '/dashboard/website-audit', icon: Search },
      { name: 'Rank Tracker', href: '/dashboard/rank-tracker', icon: TrendingUp },
      { name: 'Competitor Monitor', href: '/dashboard/competitor-monitor', icon: Users },
      { name: 'Keyword Opportunities', href: '/dashboard/keyword-opportunities', icon: KeyRound },
      { name: 'Backlink Profile', href: '/dashboard/backlink-profile', icon: LinkIcon },
      { name: 'Content Performance', href: '/dashboard/content-performance', icon: FileText },
    ],
  },
  {
    title: 'GEO / AEO',
    hint: 'AI visibility snapshots — pairs with GEO / AEO mode',
    links: [
      { name: 'AEO Insights', href: '/dashboard/aeo', icon: Sparkles },
      { name: 'GEO / AEO Chat', href: '/dashboard?mode=geo', icon: MessageSquare },
    ],
  },
] as const

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { state, actions } = useAgent()
  const { chatMode } = useChatModeOptional()
  const hasFetchedRef = React.useRef(false)
  const [showAllConversations, setShowAllConversations] = React.useState(false)
  const visibleConversations = showAllConversations
    ? state.conversations
    : state.conversations.slice(0, DEFAULT_VISIBLE_RECENT_CHATS)
  const hasHiddenConversations = state.conversations.length > DEFAULT_VISIBLE_RECENT_CHATS

  React.useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      actions.loadConversations().catch(() => { })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewChat = React.useCallback(async () => {
    const agentId = state.activeAgent?.id ?? 'general'
    try {
      const conversation = await actions.createConversation(
        agentId,
        'New Conversation',
        chatMode
      )
      if (!conversation) return
      actions.setActiveConversation(conversation)
      router.push(
        buildDashboardChatHref({ conversationId: conversation.id, mode: chatMode })
      )
    } catch (error) {
      console.error('[Sidebar] Failed to start a new chat:', error)
    }
  }, [actions, chatMode, router, state.activeAgent?.id])

  const handleSelectConversation = React.useCallback((conv: Conversation) => {
    actions.setActiveConversation(conv)
    const mode = conv.chatMode ?? undefined
    router.push(buildDashboardChatHref({ conversationId: conv.id, mode }))
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
    <>
      {/* Pull tab — always visible on the left edge */}
      <button
        onClick={onToggle}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center',
          'w-5 h-14 rounded-r-lg bg-zinc-800 border border-l-0 border-zinc-700',
          'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-300',
          open ? 'left-[260px]' : 'left-0'
        )}
      >
        <ChevronRight className={cn('h-3 w-3 transition-transform duration-300', open && 'rotate-180')} />
      </button>

      {/* Overlay — closes sidebar on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-[260px] shrink-0',
          'border-r border-zinc-800 bg-zinc-950 flex flex-col',
          'transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 h-[57px]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-white flex items-center justify-center text-black font-black italic text-sm transition-transform group-hover:scale-105">
              FI
            </div>
            <span className="font-bold text-sm tracking-tighter text-zinc-100 uppercase italic">Flow Intent</span>
          </Link>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3 pb-2">
          <Button
            id="new-chat-btn"
            onClick={handleNewChat}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-all justify-start gap-2 px-3"
          >
            <MessageSquarePlus className="h-4 w-4 shrink-0" />
            <span>New Chat</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          {/* ── Dashboard pages ── */}
          <div className="py-2 border-b border-zinc-800/60 space-y-3">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Analytics workspaces
            </p>
            {DASHBOARD_LINK_GROUPS.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {group.title}
                </p>
                <p className="px-2 pb-1 text-[10px] leading-snug text-zinc-600">{group.hint}</p>
                <nav className="space-y-0.5">
                  {group.links.map((item) => {
                    const Icon = item.icon
                    const isGeoChatLink = item.href.includes('mode=geo')
                    const isActive = isGeoChatLink
                      ? pathname === '/dashboard' && searchParams?.get('mode') === 'geo'
                      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    const isGeoGroup = group.title === 'GEO / AEO'
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-lg px-2 py-1.5 text-sm transition-colors gap-2',
                          isActive
                            ? isGeoGroup
                              ? 'bg-violet-500/10 text-violet-300'
                              : 'bg-emerald-500/10 text-emerald-300'
                            : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* ── Conversation history ── */}
          <div className="py-2">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent Chats
            </p>

            {state.conversations.length === 0 ? (
              <p className="px-2 py-1 text-xs text-zinc-600 italic">No conversations yet</p>
            ) : (
              <nav className="space-y-0.5">
                {visibleConversations.map((conv) => {
                  const isActive = state.activeConversation?.id === conv.id
                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        'group relative flex items-center rounded-lg px-2 py-1.5 transition-colors cursor-pointer select-none',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                      )}
                      onClick={() => handleSelectConversation(conv)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectConversation(conv)}
                    >
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
                    </div>
                  )
                })}
                {hasHiddenConversations && (
                  <button
                    type="button"
                    onClick={() => setShowAllConversations((v) => !v)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800/70 hover:text-zinc-200"
                  >
                    {showAllConversations ? 'Less' : 'More'}
                  </button>
                )}
              </nav>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
