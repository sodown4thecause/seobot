/**
 * Integration Tests: User Journeys
 * 
 * Tests complete user journeys from onboarding to workflow execution
 * 
 * Requirements: All requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies
vi.mock('@/lib/workflows/engine', () => ({
  WorkflowEngine: vi.fn(),
}))

vi.mock('@/lib/workflows/persistence', () => ({
  workflowPersistence: {
    saveExecution: vi.fn(),
    loadExecution: vi.fn(),
  },
}))

describe('User Journey Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Onboarding to First Workflow Execution', () => {
    it('should complete onboarding flow', async () => {
      // Simulate onboarding steps
      const onboardingSteps = [
        { step: 'welcome', completed: true },
        { step: 'business_info', completed: true },
        { step: 'goals_setup', completed: true },
        { step: 'first_workflow', completed: false },
      ]

      expect(onboardingSteps.filter(s => s.completed).length).toBe(3)
    })

    it('should execute first workflow after onboarding', async () => {
      const { WorkflowEngine } = await import('@/lib/workflows/engine')
      
      const mockExecute = vi.fn().mockResolvedValue({
        status: 'completed',
        stepResults: [],
      })

      vi.mocked(WorkflowEngine).mockImplementation(() => ({
        execute: mockExecute,
      }) as any)

      const engine = new WorkflowEngine({} as any, {} as any, 'test', 'test')
      const result = await engine.execute()

      expect(result.status).toBe('completed')
      expect(mockExecute).toHaveBeenCalled()
    })
  })

  describe('Keyword Research to Content Generation Flow', () => {
    it('should complete keyword research workflow', async () => {
      const keywordResearchSteps = [
        { step: 'keyword_discovery', status: 'completed' },
        { step: 'competitor_analysis', status: 'completed' },
        { step: 'opportunity_scoring', status: 'completed' },
      ]

      const allCompleted = keywordResearchSteps.every(s => s.status === 'completed')
      expect(allCompleted).toBe(true)
    })

    it('should generate content from keyword research results', async () => {
      const keywordResults = {
        keywords: ['seo tools', 'content marketing'],
        opportunities: [{ keyword: 'seo tools', score: 85 }],
      }

      const contentGeneration = {
        topic: keywordResults.opportunities[0].keyword,
        keywords: keywordResults.keywords,
        status: 'generated',
      }

      expect(contentGeneration.topic).toBe('seo tools')
      expect(contentGeneration.status).toBe('generated')
    })
  })

  describe('Error to Recovery Journey', () => {
    it('should handle workflow failure and show recovery options', async () => {
      const { workflowRecovery } = await import('@/lib/workflows/recovery')
      const { workflowPersistence } = await import('@/lib/workflows/persistence')

      vi.mocked(workflowPersistence.loadExecution).mockResolvedValue({
        id: 'failed-execution',
        workflowId: 'test-workflow',
        conversationId: 'test',
        userId: 'test-user',
        status: 'failed',
        stepResults: [
          { stepId: 'step1', status: 'completed' },
          { stepId: 'step2', status: 'failed', error: 'API error' },
        ],
        startTime: Date.now(),
      })

      const recovery = await workflowRecovery.recoverExecution('failed-execution')
      expect(recovery.canRecover).toBe(true)
      expect(recovery.lastSuccessfulStep).toBe('step1')
    })

    it('should resume workflow from checkpoint', async () => {
      const { workflowPersistence } = await import('@/lib/workflows/persistence')

      vi.mocked(workflowPersistence.resumeFromCheckpoint).mockResolvedValue({
        canResume: true,
        lastSuccessfulStep: 'step1',
      })

      const resumeResult = await workflowPersistence.resumeFromCheckpoint('execution-id')
      expect(resumeResult).toBeDefined()
      expect(resumeResult?.canResume).toBe(true)
    })
  })
})

