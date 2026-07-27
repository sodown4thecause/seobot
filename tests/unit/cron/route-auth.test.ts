import { describe, expect, it, vi } from 'vitest'

const runWeeklyResearchMock = vi.hoisted(() => vi.fn())
const runFortnightlyIndustryResearchMock = vi.hoisted(() => vi.fn())
const runWeeklyIngestionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/config/env', () => ({
  serverEnv: { CRON_SECRET: 'service-secret' },
}))
vi.mock('@/lib/research/weekly', () => ({
  runWeeklyResearch: runWeeklyResearchMock,
}))
vi.mock('@/lib/research/fortnightly-industry', () => ({
  runFortnightlyIndustryResearch: runFortnightlyIndustryResearchMock,
}))
vi.mock('@/lib/rag/weekly-ingestion', () => ({
  runWeeklyIngestion: runWeeklyIngestionMock,
}))
vi.mock('@/lib/redis/client', () => ({ getRedisClient: vi.fn() }))

import { GET as weeklySeo } from '@/app/api/cron/weekly-seo-research/route'
import { GET as weeklyGeo } from '@/app/api/cron/weekly-geo-research/route'
import { GET as fortnightly } from '@/app/api/cron/fortnightly-industry-research/route'
import { GET as ragIngest } from '@/app/api/rag/ingest/route'

const routes = [
  ['/api/cron/weekly-seo-research', weeklySeo, runWeeklyResearchMock],
  ['/api/cron/weekly-geo-research', weeklyGeo, runWeeklyResearchMock],
  ['/api/cron/fortnightly-industry-research', fortnightly, runFortnightlyIndustryResearchMock],
  ['/api/rag/ingest', ragIngest, runWeeklyIngestionMock],
] as const

describe('service route authentication', () => {
  it.each(routes)('%s returns a service 401 without redirecting', async (path, handler, runJob) => {
    const response = await handler(new Request(`https://flowintent.com${path}`))

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(runJob).not.toHaveBeenCalled()
  })

  it.each(routes)('%s rejects an invalid bearer token', async (path, handler, runJob) => {
    const response = await handler(new Request(`https://flowintent.com${path}`, {
      headers: { authorization: 'Bearer wrong-secret' },
    }))

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(runJob).not.toHaveBeenCalled()
  })
})
