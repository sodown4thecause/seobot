import { createServer } from 'node:http'
import type pg from 'pg'
import {
  dailyDigestDocumentSchema,
  geoHealthResponseSchema,
  geoSuggestionsSchema,
} from '../contracts/digest.js'
import { getLatestLocalDigest, getLocalDigest, getRecentJobRuns, listLocalDigests } from '../db/local.js'
import type { CompanionConfig } from '../config.js'

function sendJson(response: import('node:http').ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readJsonBody(request: import('node:http').IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk))
  if (chunks.length === 0) return null
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
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
        const days = Number(url.searchParams.get('days') ?? '30')
        const rows = await listLocalDigests(pool, Math.min(Math.max(days, 1), 90))
        const digests = rows.map(row => dailyDigestDocumentSchema.parse(row.digest))
        return sendJson(response, 200, { days, digests })
      }

      if (request.method === 'POST' && path === '/internal/run-digest') {
        const body = await readJsonBody(request)
        return sendJson(response, 202, { accepted: true, body })
      }

      return sendJson(response, 404, { error: 'Not found' })
    } catch (error) {
      return sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  })

  server.listen(config.READ_API_PORT, () => {
    console.log(`geomode companion read API listening on :${config.READ_API_PORT}`)
  })

  return server
}
