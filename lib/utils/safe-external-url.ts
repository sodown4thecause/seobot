export function toSafeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export function isSafeExternalUrl(value: unknown): boolean {
  return toSafeExternalUrl(value) !== null
}

export function getSafeHostname(value: unknown): string | null {
  const safeUrl = toSafeExternalUrl(value)
  if (!safeUrl) return null

  try {
    return new URL(safeUrl).hostname || null
  } catch {
    return null
  }
}
