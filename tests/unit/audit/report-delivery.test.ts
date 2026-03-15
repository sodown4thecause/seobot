import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { POST } from '@/app/api/audit/route'
import { buildAuditReportEmailPayload, sendAuditReportEmail } from '@/lib/audit/report-email'
import { executeAiVisibilityAuditWorkflow } from '@/lib/workflows/definitions/ai-visibility-audit'
import { parsePlatformResponse } from '@/lib/audit/parser'
import { computeAuditResults } from '@/lib/audit/scorer'
import { runHomepageExtraction } from '@/lib/audit/extraction-agent'
import { getRedisClient } from '@/lib/redis/client'

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}))

vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(() => null),
}))

vi.mock('@/lib/audit/prompts', () => ({
  buildBuyerIntentPrompts: vi.fn(() => ({ prompt1: 'p1', prompt2: 'p2', prompt3: 'p3' })),
}))

vi.mock('@/lib/workflows/definitions/ai-visibility-audit', () => ({
  executeAiVisibilityAuditWorkflow: vi.fn(),
}))

vi.mock('@/lib/audit/parser', () => ({
  parsePlatformResponse: vi.fn(),
}))

vi.mock('@/lib/audit/scorer', () => ({
  computeAuditResults: vi.fn(),
}))

vi.mock('@/lib/audit/extraction-agent', () => ({
  runHomepageExtraction: vi.fn(),
}))

vi.mock('@/lib/audit/report-email', async () => {
  const actual = await vi.importActual<typeof import('@/lib/audit/report-email')>('@/lib/audit/report-email')
  return {
    ...actual,
    sendAuditReportEmail: vi.fn(),
  }
})

const mockExecute = vi.mocked(db.execute)
const mockWorkflow = vi.mocked(executeAiVisibilityAuditWorkflow)
const mockParsePlatformResponse = vi.mocked(parsePlatformResponse)
const mockComputeAuditResults = vi.mocked(computeAuditResults)
const mockSendAuditReportEmail = vi.mocked(sendAuditReportEmail)
const mockRunHomepageExtraction = vi.mocked(runHomepageExtraction)
const mockGetRedisClient = vi.mocked(getRedisClient)

function createRunRequest(ipAddress = '10.0.0.50'): NextRequest {
  return new NextRequest('http://localhost:3000/api/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ipAddress,
    },
    body: JSON.stringify({
      action: 'run',
      domain: 'flowintent.com',
      email: 'founder@flowintent.com',
      confirmedContext: {
        brand: 'Flow Intent',
        category: 'SEO software',
        icp: 'marketing teams',
        competitors: ['Semrush', 'Ahrefs'],
        vertical: 'Digital Marketing',
      },
      mockSafe: true,
    }),
  })
}

function createDetectRequest(ipAddress = '10.0.0.60'): NextRequest {
  return new NextRequest('http://localhost:3000/api/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ipAddress,
    },
    body: JSON.stringify({
      action: 'detect',
      domain: 'flowintent.com',
    }),
  })
}

describe('audit report delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRedisClient.mockReturnValue(null)
    mockRunHomepageExtraction.mockResolvedValue({
      success: true,
      detected: {
        brand: 'Flow Intent',
        category: 'SEO software',
        icp: 'marketing teams',
        competitors: ['Semrush', 'Ahrefs'],
        vertical: 'Digital Marketing',
      },
    } as never)

    mockWorkflow.mockResolvedValue({
      checks: [
        { platform: 'perplexity', prompt: 'p1', rawResponse: 'r1', citationUrls: ['https://example.com/1'] },
        { platform: 'perplexity', prompt: 'p2', rawResponse: 'r2', citationUrls: ['https://example.com/2'] },
        { platform: 'perplexity', prompt: 'p3', rawResponse: 'r3', citationUrls: [] },
        { platform: 'grok', prompt: 'p1', rawResponse: 'r4', citationUrls: [] },
        { platform: 'gemini', prompt: 'p1', rawResponse: 'r5', citationUrls: [] },
      ],
      meta: {
        fallbackApplied: false,
        citationAvailability: 'full',
      },
    } as never)

    mockParsePlatformResponse.mockImplementation(({ platform, prompt, rawResponse, citationUrls }) => ({
      platform,
      prompt,
      brandMentioned: platform !== 'grok',
      brandPosition: platform === 'grok' ? null : 1,
      brandContext: rawResponse,
      competitorsMentioned: ['Semrush'],
      citationUrls,
      userDomainCited: false,
      competitorDomainsCited: ['semrush.com'],
      rawResponse,
    }))

    mockComputeAuditResults.mockReturnValue({
      brand: 'Flow Intent',
      brandFoundCount: 4,
      totalChecks: 5,
      visibilityRate: 80,
      topCompetitor: 'Semrush',
      topCompetitorFoundCount: 5,
      competitorAdvantage: 'Semrush was recommended 5 out of 5 times. Flow Intent was recommended 4 out of 5 times.',
      citationUrls: ['https://example.com/1'],
      userDomainCited: false,
      competitorDomainsCited: [{ domain: 'semrush.com', count: 2 }],
      platformResults: {
        perplexity: [
          { mentioned: true, position: 1 },
          { mentioned: true, position: 1 },
          { mentioned: true, position: 1 },
        ],
        grok: { mentioned: false, position: null },
        gemini: { mentioned: true, position: 1 },
      },
    })
  })

  it('builds recap email payload with canonical persisted report link', () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flowintent.com'

    const payload = buildAuditReportEmailPayload({
      auditId: '8d5f4305-abd4-42c5-ac95-61f969f09077',
      email: 'Founder@FlowIntent.com',
      results: {
        brand: 'Flow Intent',
        brandFoundCount: 2,
        totalChecks: 5,
        visibilityRate: 40,
        topCompetitor: 'Semrush',
        topCompetitorFoundCount: 4,
        competitorAdvantage: 'Semrush was recommended 4 out of 5 times. Flow Intent was recommended 2 out of 5 times.',
        citationUrls: [],
        userDomainCited: false,
        competitorDomainsCited: [],
        platformResults: {
          perplexity: [],
          grok: { mentioned: false, position: null },
          gemini: { mentioned: false, position: null },
        },
      },
    })

    expect(payload.to).toBe('founder@flowintent.com')
    expect(payload.reportUrl).toBe('https://flowintent.com/audit/results/8d5f4305-abd4-42c5-ac95-61f969f09077')
    expect(payload.text).toContain('Flow Intent surfaced 2 times while Semrush surfaced 4 times.')
    expect(payload.text).toContain('View your report: https://flowintent.com/audit/results/8d5f4305-abd4-42c5-ac95-61f969f09077')

    process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl
  })

  it('keeps completed /api/audit response successful when email send fails', async () => {
    const auditId = '8d5f4305-abd4-42c5-ac95-61f969f09077'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mockExecute.mockResolvedValueOnce([{ count: 0 }] as never).mockResolvedValueOnce([{ id: auditId }] as never)
    mockSendAuditReportEmail.mockRejectedValueOnce(new Error('provider outage'))

    const response = await POST(createRunRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.stage).toBe('completed')
    expect(payload.auditId).toBe(auditId)
    expect(mockSendAuditReportEmail).toHaveBeenCalledTimes(1)

    await Promise.resolve()
    await Promise.resolve()

    expect(warnSpy).toHaveBeenCalledWith(
      '[AI Visibility Audit] Email recap failed (non-blocking):',
      expect.any(Error)
    )

    warnSpy.mockRestore()
  })

  it('skips recap email sending when no persisted audit id exists', async () => {
    mockExecute.mockResolvedValueOnce([{ count: 0 }] as never).mockResolvedValueOnce([] as never)

    const response = await POST(createRunRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.auditId).toBeUndefined()
    expect(mockSendAuditReportEmail).not.toHaveBeenCalled()
  })

  it('rate limits the detect preview before homepage extraction runs', async () => {
    mockGetRedisClient.mockReturnValue({
      incr: vi.fn().mockResolvedValue(3),
      expire: vi.fn(),
    } as never)

    const response = await POST(createDetectRequest())
    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(payload.message).toBe('You reached the free audit limit for today. Please try again tomorrow.')
    expect(mockRunHomepageExtraction).not.toHaveBeenCalled()
  })

  it('tracks detect and run rate limits independently for the same IP', async () => {
    const counts = new Map<string, number>()
    const incr = vi.fn().mockImplementation(async (key: string) => {
      const next = (counts.get(key) ?? 0) + 1
      counts.set(key, next)
      return next
    })
    const expire = vi.fn().mockResolvedValue(1)

    mockGetRedisClient.mockReturnValue({
      incr,
      expire,
    } as never)
    mockExecute.mockResolvedValue([{ count: 0 }] as never)

    const sharedIp = '10.0.0.90'

    const firstDetect = await POST(createDetectRequest(sharedIp))
    const firstDetectPayload = await firstDetect.json()
    expect(firstDetect.status).toBe(200)
    expect(firstDetectPayload.ok).toBe(true)

    const firstRun = await POST(createRunRequest(sharedIp))
    const firstRunPayload = await firstRun.json()
    expect(firstRun.status).toBe(200)
    expect(firstRunPayload.ok).toBe(true)

    const secondDetect = await POST(createDetectRequest(sharedIp))
    const secondDetectPayload = await secondDetect.json()
    expect(secondDetect.status).toBe(200)
    expect(secondDetectPayload.ok).toBe(true)

    expect(Array.from(counts.entries())).toEqual(
      expect.arrayContaining([
        [expect.stringContaining('ai-visibility-audit:detect:10.0.0.90'), 2],
        [expect.stringContaining('ai-visibility-audit:run:10.0.0.90'), 1],
      ])
    )
  })

  it('returns a detect preview without requiring a signed-in user', async () => {
    const response = await POST(createDetectRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.stage).toBe('detected')
    expect(payload.detected.brand).toBe('Flow Intent')
    expect(mockRunHomepageExtraction).toHaveBeenCalledWith({
      domain: 'flowintent.com',
    })
  })
})
