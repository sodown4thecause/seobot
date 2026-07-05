import type { ChatMode } from '@/lib/chat/modes'
import { getArtifactDefinition } from '@/lib/artifacts/registry'
import type { ArtifactState, SavedArtifactMetadata } from '@/lib/artifacts/types'

export interface ArtifactSavePayload {
  title: string
  itemType: 'component'
  data: unknown
  content?: string
  conversationId?: string
  messageId?: string
  tags: string[]
  metadata: SavedArtifactMetadata
}

export function buildArtifactTags(
  artifactType: ArtifactState['type'],
  chatMode?: ChatMode,
  domain?: string
): string[] {
  const definition = getArtifactDefinition(artifactType)
  const tags = new Set<string>(['artifact', artifactType, definition.category])
  if (chatMode) tags.add(chatMode)
  if (domain) tags.add(domain)
  return [...tags]
}

export function buildArtifactSavePayload(artifact: ArtifactState): ArtifactSavePayload {
  const { type, title, data, metadata = {} } = artifact
  const definition = getArtifactDefinition(type)
  const chatMode = metadata.chatMode

  const savedMetadata: SavedArtifactMetadata = {
    ...metadata,
    artifactType: type,
    artifactVersion: 1,
    savedFrom: 'chat-artifact-panel',
  }

  return {
    title: title || definition.label,
    itemType: 'component',
    data,
    conversationId: metadata.conversationId,
    messageId: metadata.messageId,
    tags: buildArtifactTags(type, chatMode, metadata.domain),
    metadata: savedMetadata,
  }
}
