import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/audit/route'

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    execute: mockExecute,
  },
}))

vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(() => null),
}))

vi.mock('@/lib/audit/report-email', () => ({
  sendAuditReportEmail: vi.fn(async () => undefined),
}))

vi.mock('@/lib/audit/extraction-agent', () => ({
  runHomepageExtraction: vi.fn(async () => ({
    success: true,
    detected: {
      brand: 'FlowIntent',
      category: 'AI SEO',
      icp: 'founders',
      competitors: ['Semrush'],
      vertical: 'Marketing',
    },
  })),
}))

vi.mock('@/lib/workflows/definitions/ai-visibility-audit', () => ({
  executeAiVisibilityAuditWorkflow: vi.fn(async () => ({
    checks: [
      {
        key: 'perplexity_prompt_1',
        prompt: 'prompt',
        platform: 'perplexity',
        rawResponse: 'FlowIntent is recommended',
        citationUrls: ['https://flowintent.com/blog/aeo'],
      },
    ],
    meta: {
      fallbackApplied: false,
      citationAvailability: 'full',
      fallbackDetails: [],
    },
  })),
}))

function createRunRequest() {
  return new NextRequest('http://localhost:3000/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify({
      action: 'run',
      domain: 'flowintent.com',
      email: 'founder@flowintent.com',
      confirmedContext: {
        brand: 'FlowIntent',
        category: 'AI SEO',
        icp: 'founders',
        competitors: ['Semrush'],
        vertical: 'Marketing',
      },
      mockSafe: true,
    }),
  })
}

describe('/api/audit topical map integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecute.mockResolvedValue([{ count: 0 }])
  })

  it('returns topicalMap and scores in completed stage', async () => {
    mockExecute
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ id: '31f729ef-f64c-4a56-aedd-e0b66373fd07' }])

    const response = await POST(createRunRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.stage).toBe('completed')
    expect(payload.topicalMapPayload).toBeDefined()
    expect(payload.topicalMapPayload.topicalMap.scores.topicalAuthority).toBeTypeOf('number')
  })
})
