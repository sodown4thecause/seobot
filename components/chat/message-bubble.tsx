'use client'

import type { ReactNode } from 'react'

import { Message, MessageAvatar, MessageContent } from '@/components/ai-elements/message'
import { cn } from '@/lib/utils'

type MessageBubbleRole = 'user' | 'assistant'
type MessageBubbleLayout = 'default' | 'artifact'

type MessageBubbleProps = {
  role: MessageBubbleRole
  children: ReactNode
  actions?: ReactNode
  className?: string
  contentClassName?: string
  layout?: MessageBubbleLayout
  isStreaming?: boolean
}

export function MessageBubble({
  role,
  children,
  actions,
  className,
  contentClassName,
  layout = 'default',
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = role === 'user'
  const name = isUser ? 'You' : 'AI'

  return (
    <Message
      from={role}
      data-layout={layout}
      data-streaming={isStreaming ? 'true' : undefined}
      className={cn(
        'items-start rounded-2xl px-2 py-2 transition-colors',
        isUser
          ? 'bg-zinc-900/35 border border-zinc-800/70'
          : 'bg-zinc-950/20 border border-transparent',
        layout === 'artifact' && 'py-3',
        className
      )}
    >
      <MessageAvatar
        isUser={isUser}
        name={name}
        aria-label={name}
        className={cn(
          'mt-1 rounded-full border',
          isUser
            ? 'border-zinc-700 bg-zinc-800/80 text-zinc-200'
            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
        )}
      />
      <MessageContent
        className={cn(
          'min-w-0 gap-3',
          isUser ? 'text-zinc-100' : 'text-zinc-200',
          layout === 'artifact' && 'max-w-none',
          contentClassName
        )}
      >
        {children}
        {actions ? <div className="mt-2 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </MessageContent>
    </Message>
  )
}
