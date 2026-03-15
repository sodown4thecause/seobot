export function resolvePolarUserId(
  metadata?: Record<string, unknown> | null,
): string | null {
  const userId = metadata?.userId
  if (typeof userId === 'string' && userId.trim().length > 0) {
    return userId.trim()
  }

  const referenceId = metadata?.reference_id
  if (typeof referenceId === 'string' && referenceId.trim().length > 0) {
    return referenceId.trim()
  }

  return null
}
