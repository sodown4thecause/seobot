export function resolvePolarUserId(
  metadata?: Record<string, unknown> | null,
): string | null {
  const userId = metadata?.userId
  if (typeof userId === 'string' && userId.length > 0) {
    return userId
  }

  const referenceId = metadata?.reference_id
  if (typeof referenceId === 'string' && referenceId.length > 0) {
    return referenceId
  }

  return null
}
