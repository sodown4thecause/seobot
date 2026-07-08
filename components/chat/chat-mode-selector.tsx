'use client'

import { Brain, MessageCircle, PenLine, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHAT_MODE_LIST, getChatModeAccentClasses, type ChatMode } from '@/lib/chat/modes'
import { useChatModeOptional } from './chat-mode-context'

const MODE_ICONS: Record<ChatMode, React.ElementType> = {
  seo: Search,
  geo: Brain,
  content: PenLine,
  social: MessageCircle,
}

interface ChatModeSelectorProps {
  className?: string
}

export function ChatModeSelector({ className }: ChatModeSelectorProps) {
  const { chatMode, setChatMode } = useChatModeOptional()

  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800', className)}>
      {CHAT_MODE_LIST.map((mode) => {
        const Icon = MODE_ICONS[mode.id]
        const isActive = chatMode === mode.id
        const accent = getChatModeAccentClasses(mode.id)
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setChatMode(mode.id)}
            title={mode.selectorDescription}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isActive && accent.selectorActiveIcon
              )}
            />
            <span className="hidden sm:inline">{mode.selectorLabel}</span>
            <span className="sm:hidden text-xs">{mode.selectorLabel.split(' ')[0]}</span>
            {isActive && (
              <span
                className={cn(
                  'absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  accent.selectorDot
                )}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
