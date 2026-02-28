import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  runWebsiteAudit: vi.fn(),
  runRankTracker: vi.fn(),
  saveDashboardSnapshot: vi.fn(),
  getDashboardJobById: vi.fn(),
  listDashboardHistory: vi.fn(),
}))

vi.mock('@/lib/auth/clerk', () => ({
  getUserId: mocks.getUserId,
}))

vi.mock('@/lib/dashboard/website-audit/service', () => ({
  runWebsiteAudit: mocks.runWebsiteAudit,
}))

vi.mock('@/lib/dashboard/rank-tracker/service', () => ({
  runRankTracker: mocks.runRankTracker,
}))

vi.mock('@/lib/dashboard/repository', () => ({
  saveDashboardSnapshot: mocks.saveDashboardSnapshot,
  getDashboardJobById: mocks.getDashboardJobById,
  listDashboardHistory: mocks.listDashboardHistory,
}))

import { POST as postWebsiteAuditRun } from '@/app/api/dashboard/website-audit/run/route'
import { GET as getWebsiteAuditJob } from '@/app/api/dashboard/website-audit/[jobId]/route'
import { POST as postRankTrackerRun } from '@/app/api/dashboard/rank-tracker/run/route'
import { GET as getRankTrackerJob } from '@/app/api/dashboard/rank-tracker/[jobId]/route'
import { GET as getRankTrackerHistory } from '@/app/api/dashboard/rank-tracker/history/route'

const JOB_ID = '11111111-1111-4111-8111-111111111111'

function buildPostRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildRawPostRequest(url: string, body: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

function buildStatusContext(jobId: string) {
  return { params: Promise.resolve({ jobId }) }
}

describe('dashboard API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.getUserId.mockResolvedValue('user_123')
    mocks.runWebsiteAudit.mockResolvedValue({
      summary: { healthScore: 82, totalIssues: 2, issuesBySeverity: { critical: 1, warning: 1, info: 0 } },
      issues: [],
      providerStatus: { overall: 'partial', providers: { dataforseo: 'ok', firecrawl: 'partial', lighthouse: 'ok' } },
    })
    mocks.runRankTracker.mockResolvedValue({
      summary: { trackedKeywords: 3, averagePosition: 7.33, visibility: 66.67 },
      movements: {
        winners: { count: 1, keywords: [] },
        losers: { count: 1, keywords: [] },
        unchanged: { count: 1, keywords: [] },
      },
      keywords: [],
      providerStatus: { overall: 'ok', providers: { dataforseo: 'ok', googleSearchConsole: 'ok' } },
    })

    mocks.saveDashboardSnapshot.mockImplementation(async (input) => ({
      id: 'row_1',
      jobId: JOB_ID,
      status: 'completed',
      userId: input.userId,
      websiteUrl: input.websiteUrl,
      dataType: input.dataType,
      snapshot: input.snapshot,
      createdAt: '2026-02-27T00:00:00.000Z',
      lastUpdated: '2026-02-27T00:00:00.000Z',
    }))

    mocks.getDashboardJobById.mockResolvedValue({
      id: 'row_2',
      jobId: JOB_ID,
      status: 'completed',
      userId: 'user_123',
      websiteUrl: 'example.com',
      dataType: 'audit',
      snapshot: { summary: { healthScore: 80 } },
      createdAt: '2026-02-27T00:00:00.000Z',
      lastUpdated: '2026-02-27T00:01:00.000Z',
    })

    mocks.listDashboardHistory.mockResolvedValue([
      {
        id: 'row_3',
        jobId: JOB_ID,
        status: 'completed',
        userId: 'user_123',
        websiteUrl: 'example.com',
        dataType: 'ranks',
        snapshot: { summary: { trackedKeywords: 3 } },
        createdAt: '2026-02-27T00:00:00.000Z',
        lastUpdated: '2026-02-27T00:01:00.000Z',
      },
    ])
  })

  it('returns 401 for unauthenticated website audit run', async () => {
    mocks.getUserId.mockResolvedValueOnce(null)

    const response = await postWebsiteAuditRun(buildPostRequest('http://localhost:3000/api/dashboard/website-audit/run', { domain: 'example.com' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid website audit run payload', async () => {
    const response = await postWebsiteAuditRun(buildPostRequest('http://localhost:3000/api/dashboard/website-audit/run', { domain: '' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for malformed website audit JSON payload', async () => {
    const response = await postWebsiteAuditRun(buildRawPostRequest('http://localhost:3000/api/dashboard/website-audit/run', '{'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Invalid JSON payload')
    expect(mocks.runWebsiteAudit).not.toHaveBeenCalled()
  })

  it('returns job payload for successful website audit run', async () => {
    const response = await postWebsiteAuditRun(buildPostRequest('http://localhost:3000/api/dashboard/website-audit/run', { domain: 'example.com' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.jobId).toBe(JOB_ID)
    expect(payload.dataType).toBe('audit')
    expect(payload.status).toBe('completed')
    expect(payload.snapshot.summary.healthScore).toBeTypeOf('number')
  })

  it('returns auth and validation errors for website audit status route', async () => {
    mocks.getUserId.mockResolvedValueOnce(null)
    const unauthResponse = await getWebsiteAuditJob(
      new NextRequest('http://localhost:3000/api/dashboard/website-audit/invalid-id', { method: 'GET' }),
      buildStatusContext(JOB_ID)
    )
    expect(unauthResponse.status).toBe(401)

    const invalidResponse = await getWebsiteAuditJob(
      new NextRequest('http://localhost:3000/api/dashboard/website-audit/invalid-id', { method: 'GET' }),
      buildStatusContext('invalid-id')
    )
    expect(invalidResponse.status).toBe(400)
  })

  it('returns structured payload for website audit status route', async () => {
    const response = await getWebsiteAuditJob(
      new NextRequest(`http://localhost:3000/api/dashboard/website-audit/${JOB_ID}`, { method: 'GET' }),
      buildStatusContext(JOB_ID)
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.jobId).toBe(JOB_ID)
    expect(payload.status).toBe('completed')
    expect(payload.snapshot.summary.healthScore).toBeTypeOf('number')
  })

  it('returns 400 for invalid rank tracker run payload', async () => {
    const response = await postRankTrackerRun(buildPostRequest('http://localhost:3000/api/dashboard/rank-tracker/run', { domain: '' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for malformed rank tracker JSON payload', async () => {
    const response = await postRankTrackerRun(buildRawPostRequest('http://localhost:3000/api/dashboard/rank-tracker/run', '{'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Invalid JSON payload')
    expect(mocks.runRankTracker).not.toHaveBeenCalled()
  })

  it('returns job payload for successful rank tracker run', async () => {
    const response = await postRankTrackerRun(
      buildPostRequest('http://localhost:3000/api/dashboard/rank-tracker/run', {
        domain: 'example.com',
        competitors: ['competitor.com'],
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.jobId).toBe(JOB_ID)
    expect(payload.dataType).toBe('ranks')
    expect(payload.snapshot.summary.trackedKeywords).toBeTypeOf('number')
  })

  it('returns 404 when rank tracker status job does not exist', async () => {
    mocks.getDashboardJobById.mockResolvedValueOnce(null)

    const response = await getRankTrackerJob(
      new NextRequest(`http://localhost:3000/api/dashboard/rank-tracker/${JOB_ID}`, { method: 'GET' }),
      buildStatusContext(JOB_ID)
    )

    expect(response.status).toBe(404)
  })

  it('returns structured payload for rank tracker status route', async () => {
    mocks.getDashboardJobById.mockResolvedValueOnce({
      id: 'row_4',
      jobId: JOB_ID,
      status: 'completed',
      userId: 'user_123',
      websiteUrl: 'example.com',
      dataType: 'ranks',
      snapshot: { summary: { trackedKeywords: 8 } },
      createdAt: '2026-02-27T00:00:00.000Z',
      lastUpdated: '2026-02-27T00:01:00.000Z',
    })

    const response = await getRankTrackerJob(
      new NextRequest(`http://localhost:3000/api/dashboard/rank-tracker/${JOB_ID}`, { method: 'GET' }),
      buildStatusContext(JOB_ID)
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.jobId).toBe(JOB_ID)
    expect(payload.dataType).toBe('ranks')
    expect(payload.snapshot.summary.trackedKeywords).toBeTypeOf('number')
  })

  it('returns auth and validation errors for rank tracker history route', async () => {
    mocks.getUserId.mockResolvedValueOnce(null)
    const unauthResponse = await getRankTrackerHistory(
      new NextRequest('http://localhost:3000/api/dashboard/rank-tracker/history', { method: 'GET' })
    )
    expect(unauthResponse.status).toBe(401)

    const invalidResponse = await getRankTrackerHistory(
      new NextRequest('http://localhost:3000/api/dashboard/rank-tracker/history?limit=0', { method: 'GET' })
    )
    expect(invalidResponse.status).toBe(400)
  })

  it('returns structured payload for rank tracker history route', async () => {
    const response = await getRankTrackerHistory(
      new NextRequest('http://localhost:3000/api/dashboard/rank-tracker/history?websiteUrl=example.com&limit=5', { method: 'GET' })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.dataType).toBe('ranks')
    expect(payload.count).toBe(1)
    expect(payload.items[0].jobId).toBe(JOB_ID)
  })
})
