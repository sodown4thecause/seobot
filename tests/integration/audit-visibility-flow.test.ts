import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/audit/results/[id]/visibility/route'

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    execute: mockExecute,
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(async () => ({
    primaryEmailAddress: {
      emailAddress: 'founder@flowintent.com',
    },
  })),
}))

function buildRequest(visibility: 'unlisted' | 'public' | 'private') {
  return new NextRequest('http://localhost:3000/api/audit/results/31f729ef-f64c-4a56-aedd-e0b66373fd07/visibility', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visibility }),
  })
}

describe('audit visibility flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('transitions unlisted -> public -> private', async () => {
    mockExecute
      .mockResolvedValueOnce([{ id: '31f729ef-f64c-4a56-aedd-e0b66373fd07', public_visibility: 'public' }])
      .mockResolvedValueOnce([{ id: '31f729ef-f64c-4a56-aedd-e0b66373fd07', public_visibility: 'private' }])

    const context = { params: Promise.resolve({ id: '31f729ef-f64c-4a56-aedd-e0b66373fd07' }) }

    const publishResponse = await PATCH(buildRequest('public'), context)
    const publishPayload = await publishResponse.json()
    expect(publishResponse.status).toBe(200)
    expect(publishPayload.visibility).toBe('public')

    const privateResponse = await PATCH(buildRequest('private'), context)
    const privatePayload = await privateResponse.json()
    expect(privateResponse.status).toBe(200)
    expect(privatePayload.visibility).toBe('private')
  })

  it('returns 400 for malformed JSON body', async () => {
    const context = { params: Promise.resolve({ id: '31f729ef-f64c-4a56-aedd-e0b66373fd07' }) }
    const request = new NextRequest('http://localhost:3000/api/audit/results/31f729ef-f64c-4a56-aedd-e0b66373fd07/visibility', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"visibility":',
    })

    const response = await PATCH(request, context)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload).toEqual({ ok: false, message: 'Invalid JSON body.' })
  })
})
