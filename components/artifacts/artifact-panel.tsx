'use client'

import { X } from 'lucide-react'
import { ArtifactRenderer } from '@/components/artifacts/artifact-renderer'
import { SaveToWorkspaceButton } from '@/components/artifacts/save-to-workspace-button'
import { getArtifactDefinition } from '@/lib/artifacts/registry'
import { getChatModeAccentClasses, getChatModeUi } from '@/lib/chat/modes'
import type { ChatMode } from '@/lib/chat/modes'
import type { ArtifactState } from '@/lib/artifacts/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ArtifactPanelProps {
  artifact: ArtifactState
  chatMode: ChatMode
  conversationId?: string
  messageId?: string
  onClose: () => void
  className?: string
}

export function ArtifactPanel({
  artifact,
  chatMode,
  conversationId,
  messageId,
  onClose,
  className,
}: ArtifactPanelProps) {
  const definition = getArtifactDefinition(artifact.type)
  const modeUi = getChatModeUi(chatMode)
  const resolvedMode = artifact.metadata?.chatMode ?? chatMode
  const accent = getChatModeAccentClasses(resolvedMode)

  return (
    <div className={cn('flex flex-col h-full bg-zinc-950 relative', className)}>
      <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-zinc-800/80 pr-14">
        <div className="min-w-0 space-y-1.5 pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-[10px] uppercase tracking-wider', accent.textLabel, accent.borderPanel)}
            >
              {modeUi.selectorLabel}
            </Badge>
            {definition.status === 'planned' ? (
              <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
                Planned
              </Badge>
            ) : null}
            {artifact.status === 'streaming' || artifact.status === 'loading' ? (
              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                Streaming
              </Badge>
            ) : null}
          </div>
          <h2 className="text-base font-semibold text-zinc-100 truncate">
            {artifact.title || definition.label}
          </h2>
          {artifact.metadata?.sourceQuery ? (
            <p className="text-xs text-zinc-500 truncate" title={artifact.metadata.sourceQuery}>
              Query: {artifact.metadata.sourceQuery}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close artifact panel"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="shrink-0 px-4 py-2 border-b border-zinc-800/50 flex justify-end">
        <SaveToWorkspaceButton
          artifact={{
            ...artifact,
            metadata: { ...artifact.metadata, chatMode: resolvedMode },
          }}
          conversationId={conversationId}
          messageId={messageId}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ArtifactRenderer
          type={artifact.type}
          data={artifact.data}
          status={artifact.status}
          className="h-full"
        />
      </div>
    </div>
  )
}
