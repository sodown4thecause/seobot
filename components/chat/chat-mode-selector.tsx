'use client'

import { CHAT_MODE_LABELS, type ChatMode } from '@/lib/chat/modes'
import { cn } from '@/lib/utils'

interface ChatModeSelectorProps {
  value: ChatMode
  onChange: (mode: ChatMode) => void
}

const modeDescriptions: Record<ChatMode, string> = {
  seo: 'SERP, keyword, technical SEO, backlinks, and ranking strategy',
  geo: 'AI visibility, citations, brand mentions, answer engines, and sentiment',
  content: 'Case studies, proof assets, whitepapers, insights, and content planning',
}

const modes = Object.keys(CHAT_MODE_LABELS) as ChatMode[]

export function ChatModeSelector({ value, onChange }: ChatModeSelectorProps) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Chat mode">
        {modes.map((mode) => {
          const selected = value === mode
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={selected}
              title={modeDescriptions[mode]}
              onClick={() => onChange(mode)}
              className={cn(
                'h-9 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                selected
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100'
                  : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
              )}
            >
              {CHAT_MODE_LABELS[mode]}
            </button>
          )
        })}
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        Current mode: <span className="text-zinc-300">{CHAT_MODE_LABELS[value]}</span>
      </div>
    </div>
  )
}
