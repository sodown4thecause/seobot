'use client'

import { SaveToLibraryButton } from '@/components/chat/generative-ui/save-to-library-button'
import { buildArtifactSavePayload } from '@/lib/artifacts/build-save-payload'
import type { ArtifactState } from '@/lib/artifacts/types'
import { cn } from '@/lib/utils'

export interface SaveToWorkspaceButtonProps {
  artifact: ArtifactState
  conversationId?: string
  messageId?: string
  className?: string
  disabled?: boolean
}

export function SaveToWorkspaceButton({
  artifact,
  conversationId,
  messageId,
  className,
  disabled,
}: SaveToWorkspaceButtonProps) {
  const canSave = artifact.status === 'complete' && artifact.data != null
  const payload = buildArtifactSavePayload({
    ...artifact,
    metadata: {
      ...artifact.metadata,
      conversationId: conversationId ?? artifact.metadata?.conversationId,
      messageId: messageId ?? artifact.metadata?.messageId,
    },
  })

  return (
    <SaveToLibraryButton
      title={payload.title}
      itemType={payload.itemType}
      data={payload.data}
      content={payload.content}
      conversationId={payload.conversationId}
      messageId={payload.messageId}
      metadata={payload.metadata as unknown as Record<string, unknown>}
      tags={payload.tags}
      variant="outline"
      size="sm"
      className={cn(
        'border-zinc-700 text-zinc-200 hover:bg-zinc-800',
        className
      )}
      disabled={disabled || !canSave}
      label="Save to Workspace"
    />
  )
}
