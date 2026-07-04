const AUTH_ERROR_MESSAGES: Record<string, string> = {
  account_not_linked:
    'This Google account uses an email already registered with a different sign-in method. Sign in with email and password first, then link Google from your account settings.',
  unable_to_link_account:
    'We could not link your Google account. Try signing in with email and password instead.',
  access_denied: 'Google sign-in was cancelled.',
}

export function getAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null

  const normalized = code.trim().toLowerCase()
  if (AUTH_ERROR_MESSAGES[normalized]) {
    return AUTH_ERROR_MESSAGES[normalized]
  }

  return `Sign-in failed (${normalized.replace(/_/g, ' ')}).`
}
