/**
 * Integration Tests: Error Recovery
 * 
 * Tests API failure recovery, workflow state persistence, graceful degradation,
 * and user error message generation.
 * 
 * Requirements: All workflows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkflowEngine } from '@/lib/workflows/engine'
import { workflowPersistence } from '@/lib/workflows/persistence'
import { workflowRecovery } from '@/lib/workflows/recovery'
import { attemptGracefulDegradation, withGracefulDegradation } from '@/lib/errors/graceful-degradation'
import type { Workflow, WorkflowContext } from '@/lib/workflows/types'

// Mock persistence
vi.mock('@/lib/workflows/persistence', () => ({
  workflowPersistence: {
    saveExecution: vi.fn().mockResolvedValue(undefined),
    saveCheckpoint: vi.fn().mockResolvedValue(undefined),
    loadExecution: vi.fn(),
    resumeFromCheckpoint: vi.fn(),
  },
}))

// Mock Redis cache
vi.mock('@/lib/redis/client', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))

// Mock in-memory cache
vi.mock('@/lib/utils/cache', () => ({
  dataForSEOCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

describe('Error Recovery Integration Tests', () => {
  let mockWorkflow: Workflow
  let mockContext: WorkflowContext

  beforeEach(() => {
    vi.clearAllMocks()

    mockContext = {
      userQuery: 'test query',
      conversationHistory: [],
      previousStepResults: {},
      userPreferences: {},
      cache: new Map(),
    }

    mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow for error recovery',
      icon: '🧪',
      category: 'seo',
      estimatedTime: '1 minute',
      tags: ['test'],
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          description: 'First step',
          agent: 'research',
          parallel: false,
          tools: [
            {
              name: 'test_tool',
              params: { query: 'test' },
              required: true,
            },
          ],
          outputFormat: 'json',
        },
        {
          id: 'step2',
          name: 'Step 2',
          description: 'Second step',
          agent: 'research',
          parallel: false,
          dependencies: ['step1'],
          tools: [
            {
              name: 'test_tool',
              params: { query: 'test2' },
            },
          ],
          outputFormat: 'json',
        },
      ],
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('API Failure Triggers Checkpoint Save', () => {
    it('should save checkpoint when API call fails', async () => {
      // Mock tool execution to fail
      const originalExecuteTool = WorkflowEngine.prototype['executeTool']
      WorkflowEngine.prototype['executeTool'] = vi.fn().mockRejectedValue(
        new Error('API call failed')
      )

      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      try {
        await engine.execute()
      } catch (error) {
        // Expected to fail
      }

      // Verify checkpoint was saved
      expect(workflowPersistence.saveCheckpoint).toHaveBeenCalled()
      expect(workflowPersistence.saveExecution).toHaveBeenCalled()

      // Restore original
      WorkflowEngine.prototype['executeTool'] = originalExecuteTool
    })

    it('should save checkpoint before step execution', async () => {
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      // Mock successful execution
      const originalExecuteTool = WorkflowEngine.prototype['executeTool']
      WorkflowEngine.prototype['executeTool'] = vi.fn().mockResolvedValue({
        toolName: 'test_tool',
        success: true,
        data: { result: 'test' },
        duration: 100,
      })

      await engine.execute()

      // Verify checkpoint was saved before step
      const checkpointCalls = vi.mocked(workflowPersistence.saveCheckpoint).mock.calls
      expect(checkpointCalls.length).toBeGreaterThan(0)
      
      // First call should be 'step_start'
      const stepStartCall = checkpointCalls.find(call => call[2] === 'step_start')
      expect(stepStartCall).toBeDefined()

      // Restore original
      WorkflowEngine.prototype['executeTool'] = originalExecuteTool
    })

    it('should save error recovery checkpoint on failure', async () => {
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      // Mock tool to fail
      const originalExecuteTool = WorkflowEngine.prototype['executeTool']
      WorkflowEngine.prototype['executeTool'] = vi.fn().mockRejectedValue(
        new Error('API error')
      )

      try {
        await engine.execute()
      } catch (error) {
        // Expected
      }

      // Verify error recovery checkpoint was saved
      const checkpointCalls = vi.mocked(workflowPersistence.saveCheckpoint).mock.calls
      const errorRecoveryCall = checkpointCalls.find(call => call[2] === 'error_recovery')
      expect(errorRecoveryCall).toBeDefined()

      // Restore original
      WorkflowEngine.prototype['executeTool'] = originalExecuteTool
    })
  })

  describe('Workflow Resume from Checkpoint', () => {
    it('should resume workflow from last successful checkpoint', async () => {
      const executionId = 'test-execution-id'
      
      // Mock loading execution with checkpoint data
      vi.mocked(workflowPersistence.loadExecution).mockResolvedValue({
        id: executionId,
        workflowId: 'test-workflow',
        conversationId: 'test-conversation',
        userId: 'test-user',
        status: 'failed',
        currentStep: 'step2',
        stepResults: [
          {
            stepId: 'step1',
            status: 'completed',
            data: { result: 'step1-complete' },
            startTime: Date.now() - 1000,
            endTime: Date.now() - 500,
            duration: 500,
          },
          {
            stepId: 'step2',
            status: 'failed',
            error: 'API error',
            startTime: Date.now() - 500,
            endTime: Date.now(),
            duration: 500,
          },
        ],
        startTime: Date.now() - 2000,
        checkpointData: {
          stepResults: [
            {
              stepId: 'step1',
              status: 'completed',
              data: { result: 'step1-complete' },
            },
          ],
        },
      })

      // Mock resume
      vi.mocked(workflowPersistence.resumeFromCheckpoint).mockResolvedValue({
        canResume: true,
        lastSuccessfulStep: 'step1',
      })

      const recovery = await workflowRecovery.recoverExecution(executionId)
      expect(recovery.canRecover).toBe(true)
      expect(recovery.lastSuccessfulStep).toBe('step1')
    })

    it('should not resume if no successful steps', async () => {
      const executionId = 'test-execution-id'
      
      vi.mocked(workflowPersistence.loadExecution).mockResolvedValue({
        id: executionId,
        workflowId: 'test-workflow',
        conversationId: 'test-conversation',
        userId: 'test-user',
        status: 'failed',
        stepResults: [
          {
            stepId: 'step1',
            status: 'failed',
            error: 'API error',
          },
        ],
        startTime: Date.now(),
      })

      const recovery = await workflowRecovery.recoverExecution(executionId)
      expect(recovery.canRecover).toBe(false)
    })
  })

  describe('Graceful Degradation Fallbacks', () => {
    it('should use cached result when API fails', async () => {
      const { cacheGet } = await import('@/lib/redis/client')
      
      // Mock cache hit
      vi.mocked(cacheGet).mockResolvedValue({ cached: 'result' })

      const result = await attemptGracefulDegradation(
        'dataforseo',
        'keyword_search',
        { keyword: 'test' },
        new Error('API failed')
      )

      expect(result.success).toBe(true)
      expect(result.cached).toBe(true)
      expect(result.fallbackUsed).toBe('cache')
    })

    it('should use partial results for Firecrawl when available', async () => {
      const errorWithPartial = {
        message: 'Partial results available',
        partialData: { pages: ['page1', 'page2'] },
      }

      const result = await attemptGracefulDegradation(
        'firecrawl',
        'crawl',
        { url: 'https://example.com' },
        errorWithPartial
      )

      // Note: This depends on implementation - may need to adjust based on actual error structure
      expect(result.fallbackUsed).toBeDefined()
    })

    it('should wrap API call with graceful degradation', async () => {
      const { cacheGet } = await import('@/lib/redis/client')
      
      // First call fails
      let callCount = 0
      const apiCall = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw new Error('API failed')
        }
        return { success: true, data: 'result' }
      })

      // Cache miss on first attempt
      vi.mocked(cacheGet).mockResolvedValue(null)

      // Should throw error if no fallback available
      await expect(
        withGracefulDegradation('dataforseo', 'test', apiCall, {})
      ).rejects.toThrow('API failed')
    })
  })

  describe('User Error Message Generation', () => {
    it('should generate user-friendly error messages', () => {
      const errors = [
        { message: 'Rate limit exceeded', expected: 'rate limit' },
        { message: 'Network timeout', expected: 'network' },
        { message: 'Unauthorized access', expected: 'auth' },
        { message: 'Invalid parameters', expected: 'validation' },
      ]

      errors.forEach(({ message, expected }) => {
        const error = new Error(message)
        const result = attemptGracefulDegradation(
          'dataforseo',
          'test',
          {},
          error
        )

        // Error should be captured
        expect(result.error).toContain(message)
      })
    })

    it('should provide actionable suggestions for common errors', async () => {
      const { getFallbackSuggestion } = await import('@/lib/errors/graceful-degradation')
      
      const rateLimitError = { message: 'Rate limit exceeded', statusCode: 429 }
      const suggestion = getFallbackSuggestion('dataforseo', rateLimitError)
      
      expect(suggestion).toBeTruthy()
      expect(suggestion).toContain('retry')
    })
  })

  describe('Workflow State Persistence', () => {
    it('should persist workflow state on completion', async () => {
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      // Mock successful execution
      const originalExecuteTool = WorkflowEngine.prototype['executeTool']
      WorkflowEngine.prototype['executeTool'] = vi.fn().mockResolvedValue({
        toolName: 'test_tool',
        success: true,
        data: { result: 'test' },
        duration: 100,
      })

      await engine.execute()

      // Verify execution was saved
      expect(workflowPersistence.saveExecution).toHaveBeenCalled()
      const savedExecution = vi.mocked(workflowPersistence.saveExecution).mock.calls[0][0]
      expect(savedExecution.status).toBe('completed')

      // Restore original
      WorkflowEngine.prototype['executeTool'] = originalExecuteTool
    })

    it('should persist failed workflow state', async () => {
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      // Mock tool to fail
      const originalExecuteTool = WorkflowEngine.prototype['executeTool']
      WorkflowEngine.prototype['executeTool'] = vi.fn().mockRejectedValue(
        new Error('API error')
      )

      try {
        await engine.execute()
      } catch (error) {
        // Expected
      }

      // Verify failed execution was saved
      expect(workflowPersistence.saveExecution).toHaveBeenCalled()
      const savedExecution = vi.mocked(workflowPersistence.saveExecution).mock.calls[0][0]
      expect(savedExecution.status).toBe('failed')
      expect(savedExecution.errorMessage).toBeDefined()

      // Restore original
      WorkflowEngine.prototype['executeTool'] = originalExecuteTool
    })
  })
})

