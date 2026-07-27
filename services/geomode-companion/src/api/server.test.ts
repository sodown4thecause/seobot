import { describe, expect, it, vi } from 'vitest'
import { request } from 'node:http'
import { once } from 'node:events'
import type pg from 'pg'

import { startReadApi } from './server.js'

const config = { READ_API_PORT: 0 } as never
const query = vi.fn()
const pool = { query } as unknown as pg.Pool

async function waitForListening(server: ReturnType<typeof startReadApi>) {
  if (!server.listening) {
    await once(server, 'listening')
  }
}

function get(server: ReturnType<typeof startReadApi>, path: string): Promise<{ status: number; body: string }> {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('server did not bind')

  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: address.port, path }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => resolve({ status: response.statusCode ?? 0, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

function post(server: ReturnType<typeof startReadApi>, body: string): Promise<{ status: number }> {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('server did not bind')

  return new Promise((resolve, reject) => {
    const req = request({
      host: '127.0.0.1',
      port: address.port,
      path: '/internal/run-digest',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
    }, (response) => {
      response.resume()
      response.on('end', () => resolve({ status: response.statusCode ?? 0 }))
    })
    req.on('error', reject)
    req.end(body)
  })
}

describe('geomode companion read API', () => {
  it('binds loopback-only and rejects non-integer trend windows', async () => {
    const server = startReadApi(pool, config)
    try {
      await waitForListening(server)
      const address = server.address()
      expect(address && typeof address !== 'string' ? address.address : '').toBe('127.0.0.1')
      const response = await get(server, '/trends?days=abc')
      expect(response.status).toBe(400)
      expect(query).not.toHaveBeenCalled()
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('rejects request bodies larger than one MiB', async () => {
    const server = startReadApi(pool, config)
    try {
      await waitForListening(server)
      const response = await post(server, JSON.stringify({ payload: 'x'.repeat(1024 * 1024 + 1) }))
      expect(response.status).toBe(413)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
