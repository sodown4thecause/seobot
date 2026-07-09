import type { ChatMode } from '@/lib/chat/modes'
import { TOOL_TO_ARTIFACT } from '@/lib/artifacts/registry'
import type { ArtifactState } from '@/lib/artifacts/types'

interface ToolInvocationLike {
  toolName: string
  state: string
  result?: unknown
}

interface MessagePartLike {
  type?: string
  state?: string
  toolCallId?: string
  output?: unknown
  result?: unknown
}

interface MessageLike {
  toolInvocations?: ToolInvocationLike[]
  parts?: MessagePartLike[]
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

interface NormalizedToolCall {
  toolName: string
  phase: 'executing' | 'success'
  result?: unknown
}

/** Structured tool errors should not hydrate an artifact panel as "complete". */
function isErrorResult(result: unknown): boolean {
  return (
    !!result &&
    typeof result === 'object' &&
    (result as { status?: unknown }).status === 'error'
  )
}

/**
 * Normalize tool calls from both message shapes:
 * - AI SDK 6 `parts` with `type: 'tool-<name>'` and states like
 *   `input-streaming` / `input-available` / `output-available`
 * - legacy `toolInvocations` with states `call` / `executing` / `result`
 */
function collectToolCalls(message: MessageLike): NormalizedToolCall[] {
  const calls: NormalizedToolCall[] = []
  const seenToolCallIds = new Set<string>()

  for (const part of message.parts ?? []) {
    if (!part?.type?.startsWith('tool-')) continue
    const toolName = part.type.slice('tool-'.length)
    if (part.toolCallId) seenToolCallIds.add(part.toolCallId)
    seenToolCallIds.add(`name:${toolName}`)

    const state = part.state ?? ''
    if (state === 'output-available' || state === 'result') {
      calls.push({ toolName, phase: 'success', result: part.output ?? part.result })
    } else if (state === 'input-streaming' || state === 'input-available' || state === 'call' || state === 'executing') {
      calls.push({ toolName, phase: 'executing' })
    }
  }

  for (const tool of message.toolInvocations ?? []) {
    const withId = tool as ToolInvocationLike & { toolCallId?: string }
    if (withId.toolCallId && seenToolCallIds.has(withId.toolCallId)) continue
    if (seenToolCallIds.has(`name:${tool.toolName}`)) continue

    if (tool.state === 'result') {
      calls.push({ toolName: tool.toolName, phase: 'success', result: tool.result })
    } else if (tool.state === 'call' || tool.state === 'executing') {
      calls.push({ toolName: tool.toolName, phase: 'executing' })
    }
  }

  return calls
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
    for (const call of collectToolCalls(message)) {
      const definition = TOOL_TO_ARTIFACT.get(call.toolName)
      if (!definition) continue

      const panelId = definition.panelId

      if (call.phase === 'executing') {
        updateArtifact(panelId, {
          type: definition.type,
          title: definition.label,
          status: 'streaming',
          data: null,
          metadata: {
            chatMode,
            toolName: call.toolName,
          },
        })
        if (openOnStart || !activeArtifactId) {
          setActiveArtifactId(panelId)
        }
      } else if (isErrorResult(call.result)) {
        updateArtifact(panelId, {
          type: definition.type,
          title: definition.label,
          status: 'error',
          data: call.result,
          metadata: {
            chatMode,
            toolName: call.toolName,
          },
        })
      } else {
        updateArtifact(panelId, {
          type: definition.type,
          title: definition.label,
          status: 'complete',
          data: call.result,
          metadata: {
            chatMode,
            toolName: call.toolName,
          },
        })
        onComplete?.({ type: definition.type, title: definition.label })
      }
    }
  }
}
