/** Options for invoking a tool outside the AI SDK loop (tests, orchestrators, direct calls). */
export function manualToolExecution(
  toolCallId: string,
  extra?: Record<string, unknown>,
) {
  return {
    toolCallId,
    messages: [],
    context: {},
    ...extra,
  }
}

/** Preview tool description for logs when description may be dynamic in AI SDK 7. */
export function previewToolDescription(
  description: string | ((options: { context: unknown }) => string) | undefined,
  maxLength = 50,
): string {
  if (typeof description === 'function') {
    return '[dynamic description]'
  }
  return description?.slice(0, maxLength) ?? 'unknown'
}
