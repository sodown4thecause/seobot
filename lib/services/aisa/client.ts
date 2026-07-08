import 'server-only'

import { z } from 'zod'
import { serverEnv } from '@/lib/config/env'
import { isLangfuseEnabled } from '@/lib/observability/langfuse'

export class AisaApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string,
    message: string,
  ) {
    super(message)
    this.name = 'AisaApiError'
  }
}

export interface AisaFetchOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
  fetchImpl?: typeof fetch
  telemetryMetadata?: Record<string, unknown>
}

const unknownSchema = z.unknown()

export function isAisaConfigured(): boolean {
  return Boolean(serverEnv.AISA_API_KEY)
}

export function getAisaBaseUrl(): string {
  return (serverEnv.AISA_BASE_URL ?? 'https://api.aisa.one').replace(/\/$/, '')
}

function getTimeoutMs(): number {
  return serverEnv.AISA_TIMEOUT_MS ?? 90_000
}

function buildHeaders(): HeadersInit {
  if (!serverEnv.AISA_API_KEY) {
    throw new AisaApiError(503, 'NotConfigured', 'AISA_API_KEY is not configured')
  }

  return {
    Authorization: `Bearer ${serverEnv.AISA_API_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

async function parseError(response: Response): Promise<{ errorCode: string; message: string }> {
  const text = await response.text().catch(() => '')
  if (!text) {
    return { errorCode: 'RequestFailed', message: response.statusText || `AIsa request failed (${response.status})` }
  }

  try {
    const parsed = unknownSchema.parse(JSON.parse(text))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>
      const error = typeof record.error === 'string' ? record.error : undefined
      const message = typeof record.message === 'string' ? record.message : undefined
      const msg = typeof record.msg === 'string' ? record.msg : undefined
      return {
        errorCode: error ?? 'RequestFailed',
        message: message ?? msg ?? text,
      }
    }
  } catch {
    return { errorCode: 'RequestFailed', message: text }
  }

  return { errorCode: 'RequestFailed', message: text }
}

function formatTelemetryMeta(meta?: Record<string, unknown>): string {
  if (!meta) return ''
  const parts = Object.entries(meta).map(([key, value]) => `${key}=${String(value)}`)
  return parts.length ? ` ${parts.join(' ')}` : ''
}

export async function aisaFetch<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
  options: AisaFetchOptions = {},
): Promise<T> {
  const fetchImpl = options.fetchImpl ?? fetch
  const startedAt = Date.now()
  const telemetryMeta = formatTelemetryMeta(options.telemetryMetadata)

  const response = await fetchImpl(`${getAisaBaseUrl()}${path}`, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers: buildHeaders(),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal ?? AbortSignal.timeout(getTimeoutMs()),
  }).catch((error: unknown) => {
    if (isLangfuseEnabled()) {
      try {
        console.debug(`[AIsa] ${path} 0 ${Date.now() - startedAt}ms${telemetryMeta}`)
      } catch {
        // telemetry logging must never break the request
      }
    }
    throw error
  })

  if (isLangfuseEnabled()) {
    try {
      console.debug(`[AIsa] ${path} ${response.status} ${Date.now() - startedAt}ms${telemetryMeta}`)
    } catch {
      // telemetry logging must never break the request
    }
  }

  if (!response.ok) {
    const error = await parseError(response)
    throw new AisaApiError(response.status, error.errorCode, error.message)
  }

  if (response.status === 204) {
    return schema.parse(undefined)
  }

  return schema.parse(await response.json())
}
