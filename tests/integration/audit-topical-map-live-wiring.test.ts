import { describe, expect, it, vi } from 'vitest'
import { executeAiVisibilityAuditWorkflow } from '@/lib/workflows/definitions/ai-visibility-audit'
import { normalizeTopicalMap } from '@/lib/audit/topical-map-normalizer'

const { mockGetDataforseoTopics, mockGetFirecrawlTopics } = vi.hoisted(() => ({
  mockGetDataforseoTopics: vi.fn(),
  mockGetFirecrawlTopics: vi.fn(),
}))

vi.mock('@/lib/mcp/dataforseo/topical-map', () => ({
  getDataforseoTopicalTopics: mockGetDataforseoTopics,
}))

vi.mock('@/lib/mcp/firecrawl/topical-map', () => ({
  getFirecrawlTopicalTopics: mockGetFirecrawlTopics,
}))

describe('topical map provider wiring', () => {
  it('handles partial provider failures with confidence fallback', async () => {
    mockGetDataforseoTopics.mockRejectedValue(new Error('dfs down'))
    mockGetFirecrawlTopics.mockResolvedValue([
      {
        topic: 'aeo audit',
        sourceUrl: 'https://flowintent.com/aeo-audit',
        evidenceDepth: 60,
        lastIndexedAt: '2026-02-25T00:00:00.000Z',
      },
    ])

    const workflow = await executeAiVisibilityAuditWorkflow({
      prompts: {
        prompt1: 'Best aeo audit tools',
        prompt2: 'How to improve aeo trust',
        prompt3: 'Aeo audit checklist',
      },
      context: {
        brand: 'FlowIntent',
        category: 'AI SEO',
        icp: 'founders',
        competitors: ['Semrush'],
        vertical: 'Marketing',
      },
      mockSafe: true,
      simulatePerplexityFailure: true,
    })

    const normalized = normalizeTopicalMap(workflow.topicalMapInput)

    expect(mockGetDataforseoTopics).toHaveBeenCalledTimes(1)
    expect(mockGetFirecrawlTopics).toHaveBeenCalledTimes(1)
    expect(workflow.topicalMapInput.providerStatus.dataforseo).toBe('failed')
    expect(workflow.topicalMapInput.providerStatus.aiDiagnostics).toBe('partial')
    expect(normalized.confidence).toBeLessThan(0.9)
  })
})
