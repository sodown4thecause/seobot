'use client'

import { formatDistanceToNow } from 'date-fns'
import { getArtifactDefinition } from '@/lib/artifacts/registry'
import type { ArtifactPreviewSummary } from '@/lib/artifacts/preview'
import { getChatModeAccentClasses, getChatModeUi, type ChatMode } from '@/lib/chat/modes'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ArtifactPreviewCardProps {
  id: string
  title: string
  createdAt: string
  preview: ArtifactPreviewSummary
  selected?: boolean
  onSelect: (id: string) => void
}

function resolveChatMode(value?: string): ChatMode {
  if (value === 'geo' || value === 'content') return value
  return 'seo'
}

export function ArtifactPreviewCard({
  id,
  title,
  createdAt,
  preview,
  selected,
  onSelect,
}: ArtifactPreviewCardProps) {
  const definition = getArtifactDefinition(preview.artifactType)
  const chatMode = resolveChatMode(preview.chatMode)
  const modeUi = getChatModeUi(chatMode)
  const accent = getChatModeAccentClasses(chatMode)

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="text-left w-full"
    >
      <Card
        className={cn(
          'p-4 border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors h-full',
          selected && 'ring-1 ring-zinc-500 border-zinc-600'
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className={cn(
              'text-[10px] font-mono uppercase tracking-widest',
              accent.textLabel
            )}
          >
            {modeUi.selectorLabel}
          </span>
          <span className="text-[10px] text-zinc-600 shrink-0">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2">{title}</h3>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{definition.label}</p>
        <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{preview.statusLine}</p>
        {preview.sourceQuery ? (
          <p className="text-[11px] text-zinc-600 mt-2 line-clamp-1 italic">
            &ldquo;{preview.sourceQuery}&rdquo;
          </p>
        ) : null}
      </Card>
    </button>
  )
}
