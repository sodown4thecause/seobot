const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function selectMessageId(
  clientId: string | undefined,
  conversationId: string,
  existingConversationId: string | null
): string {
  if (clientId && isUuid(clientId) && (!existingConversationId || existingConversationId === conversationId)) {
    return clientId
  }

  return crypto.randomUUID()
}
