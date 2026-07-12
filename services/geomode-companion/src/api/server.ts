import { createServer } from 'node:http'
import type pg from 'pg'
import {
  dailyDigestDocumentSchema,
  geoHealthResponseSchema,
  geoSuggestionsSchema,
} from '../contracts/digest.js'
import { getLatestLocalDigest, getLocalDigest, getRecentJobRuns, listLocalDigests } from '../db/local.js'
import type { CompanionConfig } from '../config.js'

export const READ_API_HOST = '127.0.0.1'
export const MAX_JSON_BODY_BYTES = 1024 * 1024

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

function sendJson(response: import('node:http').ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

export async function readJsonBody(request: AsyncIterable<Uint8Array | string>) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_JSON_BODY_BYTES) {
      throw new HttpError(413, 'Request body exceeds 1 MiB limit')
    }
    chunks.push(buffer)
  }
  if (chunks.length === 0) return null
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function parseTrendsDays(value: string | null): number {
  const raw = value ?? '30'
  if (!/^\d+$/.test(raw)) {
    throw new HttpError(400, 'days must be an integer from 1 to 90')
  }

  const days = Number(raw)
  if (days < 1 || days > 90) {
    throw new HttpError(400, 'days must be an integer from 1 to 90')
  }
  return days
}

export function startReadApi(pool: pg.Pool, config: CompanionConfig) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://127.0.0.1:${config.READ_API_PORT}`)
      const path = url.pathname

      if (request.method === 'GET' && path === '/health') {
        const jobs = await getRecentJobRuns(pool)
        const payload = geoHealthResponseSchema.parse({
          ok: jobs.some(job => job.status === 'completed'),
          jobs,
        })
        return sendJson(response, payload.ok ? 200 : 503, payload)
      }

      if (request.method === 'GET' && path === '/digest/latest') {
        const row = await getLatestLocalDigest(pool)
        if (!row) return sendJson(response, 404, { error: 'No digest found' })

        const digest = dailyDigestDocumentSchema.parse(row.digest)
        return sendJson(response, 200, {
          digestDate: row.digest_date,
          brand: row.brand,
          digest,
          suggestions: row.suggestions ? geoSuggestionsSchema.parse(row.suggestions) : null,
          degradedSections: row.degraded_sections ?? [],
        })
      }

      if (request.method === 'GET' && path.startsWith('/digest/') && !path.endsWith('/suggestions')) {
        const date = path.replace('/digest/', '')
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return sendJson(response, 400, { error: 'date must be YYYY-MM-DD' })
        }

        const row = await getLocalDigest(pool, date)
        if (!row) return sendJson(response, 404, { error: 'Digest not found' })

        const digest = dailyDigestDocumentSchema.parse(row.digest)
        return sendJson(response, 200, digest)
      }

      if (request.method === 'GET' && path.endsWith('/suggestions')) {
        const date = path.replace('/digest/', '').replace('/suggestions', '')
        const row = await getLocalDigest(pool, date)
        if (!row?.suggestions) return sendJson(response, 404, { error: 'Suggestions not found' })
        return sendJson(response, 200, geoSuggestionsSchema.parse(row.suggestions))
      }

      if (request.method === 'GET' && path === '/trends') {
        const days = parseTrendsDays(url.searchParams.get('days'))
        const rows = await listLocalDigests(pool, days)
        const digests = rows.map(row => dailyDigestDocumentSchema.parse(row.digest))
        return sendJson(response, 200, { days, digests })
      }

      if (request.method === 'POST' && path === '/internal/run-digest') {
        const body = await readJsonBody(request)
        return sendJson(response, 202, { accepted: true, body })
      }

      return sendJson(response, 404, { error: 'Not found' })
    } catch (error) {
      return sendJson(response, error instanceof HttpError ? error.status : 500, {
        error: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  })

  server.listen(config.READ_API_PORT, READ_API_HOST, () => {
    console.log(`geomode companion read API listening on ${READ_API_HOST}:${config.READ_API_PORT}`)
  })

  return server
}
