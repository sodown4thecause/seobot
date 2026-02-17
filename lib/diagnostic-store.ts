import 'server-only'

import { nanoid } from 'nanoid'

import type { DiagnosticResultPublic, DiagnosticResultStored } from '@/lib/diagnostic-types'
import { cacheGet, cacheSet, cacheDelete } from '@/lib/redis/client'

const DIAGNOSTIC_PREFIX = 'diagnostic:result:'
const DIAGNOSTIC_INPUT_PREFIX = 'diagnostic:input:'

interface ResultEntry {
  result: DiagnosticResultStored
  expiresAtMs: number
}

interface InputCacheEntry {
  id: string
  expiresAtMs: number
}

export function buildDiagnosticCacheKey(domain: string, keywords: string[]): string {
  const normalizedKeywords = [...keywords]
    .map((keyword) => keyword.toLowerCase().trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort()

  const normalizedDomain = domain
    .toLowerCase()
    .trim()
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .replace(/\.+$/, '')
    .replace(/:\d+$/, '')

  return `${normalizedDomain}::${normalizedKeywords.join('|')}`
}

export function createDiagnosticResultId(): string {
  return nanoid(12)
}

export async function getCachedResultIdForInput(inputKey: string): Promise<string | null> {
  const entry = await cacheGet<InputCacheEntry>(`${DIAGNOSTIC_INPUT_PREFIX}${inputKey}`)
  if (!entry) return null
  if (entry.expiresAtMs <= Date.now()) {
    await cacheDelete(`${DIAGNOSTIC_INPUT_PREFIX}${inputKey}`)
    return null
  }
  const result = await cacheGet<ResultEntry>(`${DIAGNOSTIC_PREFIX}${entry.id}`)
  if (!result) {
    await cacheDelete(`${DIAGNOSTIC_INPUT_PREFIX}${inputKey}`)
    return null
  }
  return entry.id
}

export async function saveDiagnosticResult(args: {
  inputKey: string
  result: DiagnosticResultStored
  ttlMs: number
}): Promise<void> {
  const ttlSeconds = Math.ceil(args.ttlMs / 1000)
  const expiresAtMs = Date.now() + args.ttlMs

  await Promise.all([
    cacheSet(`${DIAGNOSTIC_PREFIX}${args.result.id}`, { result: args.result, expiresAtMs }, ttlSeconds),
    cacheSet(`${DIAGNOSTIC_INPUT_PREFIX}${args.inputKey}`, { id: args.result.id, expiresAtMs }, ttlSeconds),
  ])
}

export async function getDiagnosticResult(id: string): Promise<DiagnosticResultStored | null> {
  const entry = await cacheGet<ResultEntry>(`${DIAGNOSTIC_PREFIX}${id}`)
  if (!entry) return null
  if (entry.expiresAtMs <= Date.now()) {
    await cacheDelete(`${DIAGNOSTIC_PREFIX}${id}`)
    return null
  }
  return entry.result
}

export function toPublicDiagnosticResult(result: DiagnosticResultStored): DiagnosticResultPublic {
  const { debugRuns: _debugRuns, ...publicResult } = result
  return publicResult
}
