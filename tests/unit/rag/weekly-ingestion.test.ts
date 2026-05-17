/**
 * Weekly Ingestion Orchestration Unit Tests
 *
 * Covers runWeeklyIngestion across modes, per-mode failure isolation, and the
 * Content-mode research path. The underlying research/ingest/LLM calls are
 * mocked — only orchestration logic is exercised.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

// weekly-ingestion reads serverEnv at module load — the global test setup mock
// only exposes getServerEnv/getClientEnv, so provide serverEnv here.
vi.mock('@/lib/config/env', () => ({
  serverEnv: {
    WEEKLY_RESEARCH_MODEL: 'test/model',
    WEEKLY_RESEARCH_FALLBACK_MODEL: 'test/fallback',
    CRON_SECRET: 'test-secret',
  },
  getServerEnv: vi.fn(() => ({})),
  getClientEnv: vi.fn(() => ({})),
}))

vi.mock('ai', () => ({
  generateText: vi.fn(async () => ({ text: '# Weekly summary', usage: {} })),
}))

vi.mock('@/lib/ai/gateway-provider', () => ({
  vercelGateway: { languageModel: vi.fn(() => 'mock-model') },
}))

vi.mock('@/lib/research/weekly', () => ({
  runWeeklyResearch: vi.fn(async (mode: string) => ({
    jobId: `job-${mode}`,
    mode,
    summary: 'summary',
    chunkCount: 3,
    rawJson: {},
  })),
}))

vi.mock('@/lib/rag/ingest', () => ({
  ingestRagDocument: vi.fn(async () => ({ documentIds: ['d1', 'd2'], chunkCount: 2 })),
}))

import { runWeeklyIngestion, runWeeklyContentResearch } from '@/lib/rag/weekly-ingestion'
import { runWeeklyResearch } from '@/lib/research/weekly'
import { ingestRagDocument } from '@/lib/rag/ingest'

describe('Weekly Ingestion Orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs SEO and GEO modes via runWeeklyResearch', async () => {
    const results = await runWeeklyIngestion(['seo', 'geo'])

    expect(results).toHaveLength(2)
    expect(results.every(r => r.status === 'complete')).toBe(true)
    expect(runWeeklyResearch).toHaveBeenCalledWith('seo')
    expect(runWeeklyResearch).toHaveBeenCalledWith('geo')
  })

  it('isolates a per-mode failure without aborting other modes', async () => {
    ;(runWeeklyResearch as Mock).mockRejectedValueOnce(new Error('seo failed'))

    const results = await runWeeklyIngestion(['seo', 'geo'])

    const seo = results.find(r => r.mode === 'seo')
    const geo = results.find(r => r.mode === 'geo')
    expect(seo?.status).toBe('failed')
    expect(seo?.error).toContain('seo failed')
    expect(geo?.status).toBe('complete')
  })

  it('runs the Content mode via the research + ingest pipeline', async () => {
    const result = await runWeeklyContentResearch()

    expect(result.mode).toBe('content')
    expect(result.status).toBe('complete')
    expect(result.chunkCount).toBe(2)
    expect(ingestRagDocument).toHaveBeenCalledTimes(1)
    const arg = (ingestRagDocument as Mock).mock.calls[0][0]
    expect(arg.mode).toBe('content')
    expect(arg.sourceType).toBe('weekly_research')
  })

  it('defaults to all three modes when none are specified', async () => {
    const results = await runWeeklyIngestion()
    expect(results.map(r => r.mode).sort()).toEqual(['content', 'geo', 'seo'])
  })
})
