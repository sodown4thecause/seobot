export function getChatRetryAction(messages: ReadonlyArray<{ role: string }>): 'regenerate' | 'none' {
  return messages.some((message) => message.role === 'user') ? 'regenerate' : 'none'
}
