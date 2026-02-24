import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST } from '@/app/api/analytics/audit/route'
import { buildAuditEventPayload, trackAuditEvent } from '@/lib/analytics/audit-tracker'

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
  },
  auditEvents: {},
}))

const mockInsert = vi.mocked(db.insert)
const mockValues = vi.fn()

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/analytics/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('audit analytics contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValues.mockResolvedValue(undefined)
    mockInsert.mockReturnValue({ values: mockValues } as never)
  })

  it('serializes analytics payloads with optional metadata passthrough', () => {
    const payload = buildAuditEventPayload('audit_completed', {
      sessionId: 'session_123',
      auditId: 'a9db778a-f57a-4ef2-be10-f2e8f19ec4a8',
      brandName: 'Flow Intent',
      url: 'flowintent.com',
      properties: {
        source: 'live-audit',
        visibilityRate: 40,
        topCompetitor: 'Semrush',
      },
    })

    expect(payload.eventType).toBe('audit_completed')
    expect(payload.sessionId).toBe('session_123')
    expect(payload.properties).toMatchObject({
      source: 'live-audit',
      visibilityRate: 40,
      topCompetitor: 'Semrush',
      auditId: 'a9db778a-f57a-4ef2-be10-f2e8f19ec4a8',
    })
  })

  it('accepts normalized valid payloads and stores properties metadata', async () => {
    const response = await POST(
      createRequest({
        eventType: 'results_viewed',
        sessionId: 'audit_report_123',
        brandName: 'Flow Intent',
        email: 'Founder@FlowIntent.com',
        properties: {
          source: 'reopened-report',
          auditId: '31f729ef-f64c-4a56-aedd-e0b66373fd07',
          visibilityRate: 60,
          topCompetitor: 'Semrush',
        },
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'results_viewed',
        sessionId: 'audit_report_123',
        email: 'founder@flowintent.com',
        properties: expect.objectContaining({
          source: 'reopened-report',
          auditId: '31f729ef-f64c-4a56-aedd-e0b66373fd07',
        }),
      })
    )
  })

  it('rejects malformed payloads with explicit 400', async () => {
    const response = await POST(
      createRequest({
        eventType: 'audit_completed',
        properties: ['invalid'],
      })
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid sessionId.' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('keeps tracker calls non-blocking when analytics POST fails', async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error('network down'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => {
      trackAuditEvent(
        'audit_started',
        {
          sessionId: 'session_non_blocking',
          url: 'flowintent.com',
          properties: { source: 'live-audit' },
        },
        { fetchImpl: failingFetch as unknown as typeof fetch }
      )
    }).not.toThrow()

    expect(failingFetch).toHaveBeenCalledTimes(1)

    await Promise.resolve()
    await Promise.resolve()

    expect(warnSpy).toHaveBeenCalledWith('[Audit Analytics] Failed to track event:', 'audit_started')
    warnSpy.mockRestore()
  })
})
