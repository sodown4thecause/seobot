import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST } from '@/app/api/audit/convert/route'

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}))

const mockExecute = vi.mocked(db.execute)

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/audit/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('audit conversion tracking endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects malformed payloads', async () => {
    const response = await POST(createRequest({ event: 'strategy-call' }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.ok).toBe(false)
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('returns not found when audit id is unknown', async () => {
    mockExecute.mockResolvedValueOnce([] as never)

    const response = await POST(
      createRequest({
        auditId: '31f729ef-f64c-4a56-aedd-e0b66373fd07',
        event: 'strategy-call',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.ok).toBe(false)
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('stays successful and idempotent on repeated conversion requests', async () => {
    const auditId = '5fbf95f6-4703-4df6-9108-f3ef7de7fe65'

    mockExecute
      .mockResolvedValueOnce([{ id: auditId }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ id: auditId }] as never)
      .mockResolvedValueOnce([] as never)

    const first = await POST(createRequest({ auditId, event: 'strategy-call' }))
    const second = await POST(createRequest({ auditId, event: 'strategy-call' }))

    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ ok: true })
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({ ok: true })
    expect(mockExecute).toHaveBeenCalledTimes(4)
  })
})
