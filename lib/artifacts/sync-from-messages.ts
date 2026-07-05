import type { ChatMode } from '@/lib/chat/modes'
import { TOOL_TO_ARTIFACT } from '@/lib/artifacts/registry'
import type { ArtifactState } from '@/lib/artifacts/types'

interface ToolInvocationLike {
  toolName: string
  state: string
  result?: unknown
}

interface MessageLike {
  toolInvocations?: ToolInvocationLike[]
}

export interface SyncArtifactsOptions {
  messages: MessageLike[]
  chatMode: ChatMode
  activeArtifactId: string | null
  updateArtifact: (id: string, update: Partial<ArtifactState>) => void
  setActiveArtifactId: (id: string | null) => void
  /** When true, always open panel on tool start; when false, only if no panel open. */
  openOnStart?: boolean
  onComplete?: (artifact: Pick<ArtifactState, 'type' | 'title'>) => void
}

export function syncArtifactsFromMessages({
  messages,
  chatMode,
  activeArtifactId,
  updateArtifact,
  setActiveArtifactId,
  openOnStart = false,
  onComplete,
}: SyncArtifactsOptions): void {
  for (const message of messages) {
    const tools = message.toolInvocations
    if (!tools?.length) continue

    for (const tool of tools) {
      const definition = TOOL_TO_ARTIFACT.get(tool.toolName)
      if (!definition) continue

      const isSuccess = tool.state === 'result'
      const isExecuting = tool.state === 'call' || tool.state === 'executing'
      if (!isSuccess && !isExecuting) continue

      const panelId = definition.panelId

      if (isExecuting) {
        updateArtifact(panelId, {
          type: definition.type,
          title: definition.label,
          status: 'streaming',
          data: null,
          metadata: {
            chatMode,
            toolName: tool.toolName,
          },
        })
        if (openOnStart || !activeArtifactId) {
          setActiveArtifactId(panelId)
        }
      } else if (isSuccess) {
        updateArtifact(panelId, {
          type: definition.type,
          title: definition.label,
          status: 'complete',
          data: tool.result,
          metadata: {
            chatMode,
            toolName: tool.toolName,
          },
        })
        onComplete?.({ type: definition.type, title: definition.label })
      }
    }
  }
}
