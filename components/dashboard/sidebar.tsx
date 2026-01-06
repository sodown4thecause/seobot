'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  type LucideIcon,
  Home,
  Search,
  Command,
  MoreHorizontal,
  User,
  BookOpen,
  Plus,
  Pin,
  Archive,
  Edit3,
  Target,
  BarChart3,
  Workflow,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { usePathname } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAgent } from '@/components/providers/agent-provider'
import { ModeIndicator } from '@/components/user-mode/mode-indicator'

export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentPath: string
}

const MAIN_NAV = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Workflows', href: '/dashboard/workflows', icon: Workflow },
  { name: 'SEO Tools', href: '/dashboard/seo-tools', icon: Search },
  { name: 'Blog', href: '/dashboard/blog', icon: BookOpen },
  { name: 'Tutorials', href: '/dashboard/tutorials', icon: BookOpen },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Target },
  { name: 'Progress', href: '/dashboard/progress', icon: BarChart3 },
]

const safeFormatDistanceToNow = (date: Date) => {
  try {
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.warn('[Sidebar] Failed to format time distance', error)
    return date.toLocaleString()
  }
}

export function Sidebar({ collapsed, onToggle, currentPath }: SidebarProps) {
  const pathname = usePathname()
  const { state, actions } = useAgent()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return state.conversations
    const query = searchQuery.toLowerCase()
    return state.conversations.filter((conv) =>
      conv.title.toLowerCase().includes(query)
    )
  }, [state.conversations, searchQuery])

  const handleSelectConversation = (conversation: typeof state.conversations[number]) => {
    actions.setActiveConversation(conversation)
    actions.clearMessages()
    actions.loadMessages(conversation.id).catch(() => {
      // errors handled inside action; keep UI responsive
    })
  }

  const handleNewConversation = async () => {
    if (isCreating) return
    try {
      setIsCreating(true)
      const agentId = state.activeAgent?.id ?? 'general'
      const conversation = await actions.createConversation(agentId)
      if (conversation) {
        actions.setActiveConversation(conversation)
        actions.clearMessages()
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleRenameConversation = (conversationId: string, currentTitle: string) => {
    const nextTitle = window.prompt('Rename conversation', currentTitle)
    if (!nextTitle || nextTitle.trim() === '' || nextTitle === currentTitle) return
    actions.updateConversation(conversationId, { title: nextTitle.trim() })
  }

  const handleUnpinConversation = (conversationId: string) => {
    actions.updateConversation(conversationId, { status: 'active' })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-[#0c0c0e]/90 backdrop-blur-xl border-r border-white/[0.08]',
        'transition-all duration-300 ease-in-out flex flex-col',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Header */}
      <div className="p-4 pb-2 flex items-center gap-3">
        <div className="w-8 h-8 relative flex-shrink-0">
          <Logo className="w-full h-full" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-xl text-white tracking-tight">Flow Intent</span>
        )}
      </div>

      {/* Search / new chat */}
      <div className={cn('px-4 py-4', collapsed && 'flex flex-col items-center gap-3')}>
        {!collapsed ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search chats"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="bg-white/[0.05] border-0 h-10 pl-9 pr-9 text-sm rounded-xl text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 rounded p-0.5">
                <Command className="h-3 w-3 text-zinc-500" />
              </div>
            </div>
            <Button
              onClick={handleNewConversation}
              disabled={isCreating}
              className="mt-3 w-full rounded-xl bg-white text-black hover:bg-zinc-200 transition"
            >
              <Plus className="mr-2 h-4 w-4" />
              New chat
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10">
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewConversation}
              disabled={isCreating}
              className="h-10 w-10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-6 py-2">
          {/* Main Menu */}
          <nav className="space-y-1 px-2">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group',
                    isActive
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                  )} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Conversations */}
          <div className="px-2">
            {!collapsed && (
              <div className="flex items-center justify-between px-3 mb-3">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Conversations
                </h3>
                <span className="text-[11px] text-zinc-600">
                  {filteredConversations.length}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {filteredConversations.length === 0 && (
                <div className="text-center text-xs text-zinc-500 py-4">
                  {searchQuery ? 'No chats match your search.' : 'No chats yet.'}
                </div>
              )}
              {filteredConversations.map((conversation) => {
                const isActive = state.activeConversation?.id === conversation.id
                const isPinned = conversation.status === 'pinned'
                const subtitle = conversation.lastMessage?.content || 'No messages yet'
                const timestamp = conversation.updatedAt
                  ? safeFormatDistanceToNow(new Date(conversation.updatedAt))
                  : ''

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      'group relative flex items-start gap-3 rounded-xl px-3 py-3 transition-all',
                      isActive
                        ? 'bg-white/10 text-white shadow-inner'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                    )}
                  >
                    <button
                      onClick={() => handleSelectConversation(conversation)}
                      className="flex flex-1 flex-col text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {conversation.title}
                        </span>
                        {isPinned && <Pin className="h-3 w-3 text-yellow-400" />}
                      </div>
                      {!collapsed && (
                        <>
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {subtitle}
                          </p>
                          {timestamp && (
                            <span className="mt-1 text-[11px] text-zinc-600">
                              {timestamp}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition"
                          aria-label="Conversation actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleRenameConversation(conversation.id, conversation.title)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        {!isPinned ? (
                          <DropdownMenuItem onClick={() => actions.pinConversation(conversation.id)}>
                            <Pin className="mr-2 h-4 w-4" />
                            Pin chat
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUnpinConversation(conversation.id)}>
                            <Pin className="mr-2 h-4 w-4" />
                            Unpin chat
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => actions.archiveConversation(conversation.id)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Mode Indicator */}
      {!collapsed && (
        <div className="px-4 pb-2">
          <ModeIndicator variant="full" className="w-full" />
        </div>
      )}

      {/* User Profile / Footer */}
      <div className="p-4 border-t border-white/[0.05]">
        <button className={cn(
          "flex items-center gap-3 w-full rounded-xl transition-colors hover:bg-white/5 p-2",
          collapsed ? "justify-center" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            <User className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-medium text-white truncate">User Account</p>
              <p className="text-xs text-zinc-500 truncate">Free Plan</p>
            </div>
          )}
          {!collapsed && <MoreHorizontal className="h-4 w-4 text-zinc-500" />}
        </button>
      </div>
    </aside>
  )
}