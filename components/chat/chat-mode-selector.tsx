'use client'

import { Brain, MessageCircle, PenLine, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buildDashboardModeHref } from '@/lib/chat/conversation-mode'
import { PRIMARY_CHAT_MODE_LIST, type ChatMode } from '@/lib/chat/modes'
import { useChatModeOptional } from './chat-mode-context'

const MODE_ICONS: Record<ChatMode, React.ElementType> = {
  seo: Search,
  geo: Brain,
  content: PenLine,
  social: MessageCircle,
}

const MODE_KICKERS: Record<ChatMode, string> = {
  seo: 'Search demand',
  geo: 'AI visibility',
  content: 'Publishing',
  social: 'Market signals',
}

interface ChatModeSelectorProps {
  className?: string
  variant?: 'compact' | 'header'
}

export function ChatModeSelector({ className, variant = 'compact' }: ChatModeSelectorProps) {
  const { chatMode, setChatMode } = useChatModeOptional()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectMode = (mode: ChatMode) => {
    setChatMode(mode)

    if (pathname !== '/dashboard') return

    router.replace(buildDashboardModeHref(searchParams?.toString() ?? '', mode), { scroll: false })
  }

  if (variant === 'header') {
    return (
      <div
        className={cn(
          'flex min-w-0 items-stretch overflow-x-auto border-x border-zinc-800 bg-zinc-950',
          className
        )}
        role="tablist"
        aria-label="FlowIntent work mode"
      >
        {PRIMARY_CHAT_MODE_LIST.map((mode) => {
          const Icon = MODE_ICONS[mode.id]
          const isActive = chatMode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectMode(mode.id)}
              className={cn(
                'group relative flex min-w-[132px] items-center gap-2.5 border-r border-zinc-800 px-4 py-2.5 text-left transition-colors last:border-r-0',
                isActive
                  ? 'bg-zinc-900 text-zinc-50'
                  : 'text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200'
              )}
            >
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-0.5 bg-red-500 transition-transform',
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'
                )}
              />
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-red-400' : 'text-zinc-600')} />
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-none">{mode.selectorLabel.replace(' Mode', '')}</span>
                <span className="mt-1 block truncate text-[10px] leading-none text-zinc-600">{MODE_KICKERS[mode.id]}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn('inline-flex max-w-full items-center gap-0 overflow-x-auto border border-zinc-800 bg-zinc-950 p-0.5', className)}
      role="tablist"
      aria-label="FlowIntent work mode"
    >
      {PRIMARY_CHAT_MODE_LIST.map((mode) => {
        const Icon = MODE_ICONS[mode.id]
        const isActive = chatMode === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => selectMode(mode.id)}
            title={mode.selectorDescription}
            className={cn(
              'flex shrink-0 items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors',
              isActive
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', isActive && 'text-red-600')} />
            <span>{mode.selectorLabel.replace(' Mode', '')}</span>
          </button>
        )
      })}
    </div>
  )
}
