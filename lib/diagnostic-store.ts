import 'server-only'

import { nanoid } from 'nanoid'

import type { DiagnosticResultPublic, DiagnosticResultStored } from '@/lib/diagnostic-types'

interface ResultEntry {
  result: DiagnosticResultStored
  expiresAtMs: number
}

interface InputCacheEntry {
  id: string
  expiresAtMs: number
}

const resultStore = new Map<string, ResultEntry>()
const inputCache = new Map<string, InputCacheEntry>()

function pruneExpired(): void {
  const now = Date.now()

  for (const [id, entry] of resultStore.entries()) {
    if (entry.expiresAtMs <= now) {
      resultStore.delete(id)
    }
  }

  for (const [key, entry] of inputCache.entries()) {
    if (entry.expiresAtMs <= now || !resultStore.has(entry.id)) {
      inputCache.delete(key)
    }
  }
}

export function buildDiagnosticCacheKey(domain: string, keywords: string[]): string {
  const normalizedKeywords = [...keywords]
    .map((keyword) => keyword.toLowerCase().trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort()

  return `${domain.toLowerCase()}::${normalizedKeywords.join('|')}`
}

export function createDiagnosticResultId(): string {
  return nanoid(12)
}

export function getCachedResultIdForInput(inputKey: string): string | null {
  pruneExpired()
  const entry = inputCache.get(inputKey)
  if (!entry) return null
  if (!resultStore.has(entry.id)) {
    inputCache.delete(inputKey)
    return null
  }
  return entry.id
}

export function saveDiagnosticResult(args: {
  inputKey: string
  result: DiagnosticResultStored
  ttlMs: number
}): void {
  pruneExpired()

  const expiresAtMs = Date.now() + args.ttlMs
  resultStore.set(args.result.id, {
    result: args.result,
    expiresAtMs,
  })
  inputCache.set(args.inputKey, {
    id: args.result.id,
    expiresAtMs,
  })
}

export function getDiagnosticResult(id: string): DiagnosticResultStored | null {
  pruneExpired()
  const entry = resultStore.get(id)
  return entry?.result ?? null
}

export function toPublicDiagnosticResult(result: DiagnosticResultStored): DiagnosticResultPublic {
  const { debugRuns: _debugRuns, ...publicResult } = result
  return publicResult
}
