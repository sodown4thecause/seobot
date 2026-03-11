type ConversationRecord = {
  id: string
}

type BootstrapConversationRecordOptions = {
  overrideId?: string
  createConversation: () => Promise<ConversationRecord | null>
  listConversations: () => Promise<ConversationRecord[]>
}

export function buildWorkflowAutoSendKey(workflowId?: string, conversationId?: string): string | undefined {
  if (!workflowId || !conversationId) {
    return undefined
  }

  return `${workflowId}:${conversationId}`
}

export async function bootstrapConversationRecord({
  overrideId,
  createConversation,
  listConversations,
}: BootstrapConversationRecordOptions): Promise<ConversationRecord | null> {
  if (overrideId) {
    return { id: overrideId }
  }

  try {
    const createdConversation = await createConversation()
    if (createdConversation) {
      return createdConversation
    }
  } catch {
    // Fall back to the latest existing conversation when creation fails.
  }

  const existingConversations = await listConversations()
  return existingConversations[0] ?? null
}
