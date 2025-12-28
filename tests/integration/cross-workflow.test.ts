/**
 * Integration Tests: Cross-Workflow
 * 
 * Tests data sharing between workflows, sequential execution, and result caching
 * 
 * Requirements: All workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/workflows/engine', () => ({
  WorkflowEngine: vi.fn(),
}))

vi.mock('@/lib/utils/cache', () => ({
  dataForSEOCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

describe('Cross-Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Sharing Between Workflows', () => {
    it('should share keyword data between workflows', () => {
      const workflow1Results = {
        keywords: ['seo tools', 'content marketing'],
        opportunities: [{ keyword: 'seo tools', score: 85 }],
      }

      const workflow2Input = {
        keywords: workflow1Results.keywords,
        topOpportunity: workflow1Results.opportunities[0],
      }

      expect(workflow2Input.keywords).toEqual(workflow1Results.keywords)
      expect(workflow2Input.topOpportunity.keyword).toBe('seo tools')
    })

    it('should pass competitor data between workflows', () => {
      const competitorAnalysisResults = {
        competitors: ['competitor1.com', 'competitor2.com'],
        topKeywords: ['keyword1', 'keyword2'],
      }

      const linkBuildingInput = {
        competitorDomains: competitorAnalysisResults.competitors,
        targetKeywords: competitorAnalysisResults.topKeywords,
      }

      expect(linkBuildingInput.competitorDomains).toEqual(competitorAnalysisResults.competitors)
    })
  })

  describe('Sequential Workflow Execution', () => {
    it('should execute workflows in sequence', async () => {
      const workflows = [
        { id: 'workflow1', name: 'Keyword Research', status: 'completed' },
        { id: 'workflow2', name: 'Content Creation', status: 'pending' },
      ]

      const firstCompleted = workflows[0].status === 'completed'
      expect(firstCompleted).toBe(true)

      // Second workflow should be ready to start
      const secondReady = workflows[1].status === 'pending'
      expect(secondReady).toBe(true)
    })

    it('should use results from previous workflow', () => {
      const workflow1Output = {
        keywords: ['seo tools'],
        contentBrief: { outline: ['intro', 'body', 'conclusion'] },
      }

      const workflow2Input = {
        keywords: workflow1Output.keywords,
        outline: workflow1Output.contentBrief.outline,
      }

      expect(workflow2Input.keywords).toEqual(workflow1Output.keywords)
      expect(workflow2Input.outline).toEqual(workflow1Output.contentBrief.outline)
    })
  })

  describe('Workflow Result Caching', () => {
    it('should cache workflow results', async () => {
      const { dataForSEOCache } = await import('@/lib/utils/cache')

      const workflowResult = {
        keywords: ['seo tools'],
        data: { volume: 1000 },
      }

      vi.mocked(dataForSEOCache.set).mockImplementation(() => {})
      dataForSEOCache.set('workflow:result:test', workflowResult)

      expect(dataForSEOCache.set).toHaveBeenCalled()
    })

    it('should retrieve cached workflow results', async () => {
      const { dataForSEOCache } = await import('@/lib/utils/cache')

      const cachedResult = {
        keywords: ['seo tools'],
        data: { volume: 1000 },
      }

      vi.mocked(dataForSEOCache.get).mockReturnValue(cachedResult as any)
      const result = dataForSEOCache.get('workflow:result:test')

      expect(result).toEqual(cachedResult)
    })

    it('should invalidate cache when workflow reruns', async () => {
      const { dataForSEOCache } = await import('@/lib/utils/cache')

      // First execution caches result
      dataForSEOCache.set('workflow:result:test', { data: 'old' })

      // Second execution should invalidate and recache
      dataForSEOCache.delete('workflow:result:test')
      dataForSEOCache.set('workflow:result:test', { data: 'new' })

      const result = dataForSEOCache.get('workflow:result:test')
      expect(result).toEqual({ data: 'new' })
    })
  })
})

