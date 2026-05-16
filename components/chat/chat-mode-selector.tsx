'use client'

import { Search, Brain, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ChatMode, useChatMode } from './chat-mode-context'

const MODES: { id: ChatMode; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'seo',
    label: 'SEO Mode',
    icon: Search,
    description: 'Keyword research, SERP analysis & technical SEO',
  },
  {
    id: 'geo',
    label: 'GEO / AEO',
    icon: Brain,
    description: 'Track brand mentions across ChatGPT, Gemini, Perplexity & AI Overviews',
  },
  {
    id: 'content',
    label: 'Content Mode',
    icon: PenLine,
    description: 'Generate blog posts, articles & content with AI-powered images',
  },
]

interface ChatModeSelectorProps {
  className?: string
}

export function ChatModeSelector({ className }: ChatModeSelectorProps) {
  const { chatMode, setChatMode } = useChatMode()

  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800', className)}>
      {MODES.map((mode) => {
        const Icon = mode.icon
        const isActive = chatMode === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setChatMode(mode.id)}
            title={mode.description}
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive && mode.id === 'seo' && 'text-emerald-400', isActive && mode.id === 'geo' && 'text-violet-400', isActive && mode.id === 'content' && 'text-amber-400')} />
            <span className="hidden sm:inline">{mode.label}</span>
            <span className="sm:hidden text-xs">{mode.label.split(' ')[0]}</span>
            {isActive && (
              <span className={cn(
                'absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                mode.id === 'seo' && 'bg-emerald-400',
                mode.id === 'geo' && 'bg-violet-400',
                mode.id === 'content' && 'bg-amber-400',
              )} />
            )}
          </button>
        )
      })}
    </div>
  )
}
