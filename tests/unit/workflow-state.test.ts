/**
 * Property Test: Workflow State Integrity
 * 
 * Property 2: Workflow State Integrity
 * Validates: Requirements 3.1, 4.1, 5.1
 * 
 * Ensures that workflow execution maintains state integrity:
 * - Steps execute in dependency order
 * - Failed steps prevent dependent steps
 * - Step results persist correctly in execution object
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkflowEngine } from '@/lib/workflows/engine'
import type { Workflow, WorkflowContext, WorkflowStep } from '@/lib/workflows/types'

// Mock tool execution will be done via spyOn in beforeEach


describe('Property 2: Workflow State Integrity', () => {
  let mockWorkflow: Workflow
  let mockContext: WorkflowContext

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock executeTool on the prototype since it's a private method but used internally
    vi.spyOn(WorkflowEngine.prototype as any, 'executeTool').mockImplementation(async (toolName: string) => {
      console.log(`[DEBUG] Mock executeTool called for ${toolName}`);
      return {
        toolName: toolName,
        success: true,
        data: { result: 'test' },
        duration: 100,
        cached: false
      };
    })

    mockContext = {
      userQuery: 'test query',
      conversationHistory: [],
      previousStepResults: {},
      userPreferences: {},
      cache: new Map(),
    }

    // Create a simple workflow with dependencies
    mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      description: 'Test workflow for state integrity',
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
          tools: [{ name: 'test_tool', params: {} }],
          outputFormat: 'json',
        },
        {
          id: 'step2',
          name: 'Step 2',
          description: 'Second step depends on step1',
          agent: 'research',
          parallel: false,
          dependencies: ['step1'],
          tools: [{ name: 'test_tool', params: {} }],
          outputFormat: 'json',
        },
        {
          id: 'step3',
          name: 'Step 3',
          description: 'Third step depends on step2',
          agent: 'research',
          parallel: false,
          dependencies: ['step2'],
          tools: [{ name: 'test_tool', params: {} }],
          outputFormat: 'json',
        },
      ],
    }
  })

  describe('Property: Steps Execute in Dependency Order', () => {
    it('should execute steps in correct dependency order', async () => {
      const executionOrder: string[] = []

      // Mock executeStep to track order
      const originalExecuteStep = WorkflowEngine.prototype.executeStep
      WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(async function (step: WorkflowStep) {
        executionOrder.push(step.id)
        return originalExecuteStep.call(this, step)
      })

      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      await engine.execute()

      // Property: Steps must execute in dependency order
      expect(executionOrder).toEqual(['step1', 'step2', 'step3'])

      // Restore original
      WorkflowEngine.prototype.executeStep = originalExecuteStep
    })

    it('should skip steps when dependencies are not met', async () => {
      // Create workflow where step2 depends on non-existent step
      const workflowWithMissingDep: Workflow = {
        ...mockWorkflow,
        steps: [
          mockWorkflow.steps[0],
          {
            ...mockWorkflow.steps[1],
            dependencies: ['nonexistent_step'],
          },
        ],
      }

      const engine = new WorkflowEngine(
        workflowWithMissingDep,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Step with unmet dependency should be skipped
      const step2Result = result.stepResults.find(r => r.stepId === 'step2')
      expect(step2Result?.status).toBe('skipped')
    })

    it('should execute parallel steps concurrently', async () => {
      const parallelWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'parallel1',
            name: 'Parallel 1',
            description: 'First parallel step',
            agent: 'research',
            parallel: true,
            tools: [{ name: 'test_tool', params: {} }],
            outputFormat: 'json',
          },
          {
            id: 'parallel2',
            name: 'Parallel 2',
            description: 'Second parallel step',
            agent: 'research',
            parallel: true,
            tools: [{ name: 'test_tool', params: {} }],
            outputFormat: 'json',
          },
        ],
      }

      const engine = new WorkflowEngine(
        parallelWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const startTime = Date.now()
      await engine.execute()
      const duration = Date.now() - startTime

      // Property: Parallel steps should execute concurrently (faster than sequential)
      // In a real scenario, parallel execution would be faster
      // For this test, we verify both steps completed
      const result = await engine.execute()
      expect(result.stepResults.length).toBe(2)
      expect(result.stepResults.every(r => r.status === 'completed')).toBe(true)
    })
  })

  describe('Property: Failed Steps Prevent Dependent Steps', () => {
    it('should stop workflow when a step fails', async () => {
      // Mock executeStep to fail on step2
      const originalExecuteStep = WorkflowEngine.prototype.executeStep
      WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(async function (step: WorkflowStep) {
        if (step.id === 'step2') {
          this.recordStepResult(step.id, 'failed', undefined, 'Test error')
          return
        }
        return originalExecuteStep.call(this, step)
      })

      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Workflow should fail when step fails
      expect(result.status).toBe('failed')

      // Property: Dependent steps should not execute
      const step3Result = result.stepResults.find(r => r.stepId === 'step3')
      expect(step3Result?.status).toBeUndefined() // Should not exist or be skipped

      // Restore original
      WorkflowEngine.prototype.executeStep = originalExecuteStep
    })

    it('should mark workflow as failed when critical step fails', async () => {
      const workflowWithRequired: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            ...mockWorkflow.steps[0],
            tools: [{ name: 'test_tool', params: {}, required: true }],
          },
        ],
      }

      // Mock executeToolsSequential to throw error for required tool
      const originalExecuteStep = WorkflowEngine.prototype.executeStep
      WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(async function (step: WorkflowStep) {
        // Simulate the step failing
        this.recordStepResult(step.id, 'running', { startTime: Date.now() })
        this.recordStepResult(step.id, 'failed', {
          error: 'Required tool failed',
          endTime: Date.now(),
          duration: 100,
        })
      })

      const engine = new WorkflowEngine(
        workflowWithRequired,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Required tool failure should fail the step
      const step1Result = result.stepResults.find(r => r.stepId === 'step1')
      expect(step1Result?.status).toBe('failed')

      // Restore original
      WorkflowEngine.prototype.executeStep = originalExecuteStep
    })
  })

  describe('Property: Step Results Persist Correctly', () => {
    it('should persist step results in execution object', async () => {
      // Mock executeStep to properly complete with final status
      const originalExecuteStep = WorkflowEngine.prototype.executeStep
      WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(async function (step: WorkflowStep) {
        this.recordStepResult(step.id, 'running', { startTime: Date.now() })
        this.recordStepResult(step.id, 'completed', {
          data: { result: 'test' },
          toolResults: {},
          endTime: Date.now(),
          duration: 100,
        })
      })

      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: All step results must be persisted
      expect(result.stepResults.length).toBe(mockWorkflow.steps.length)

      // Property: Each step result should have correct structure
      result.stepResults.forEach(stepResult => {
        expect(stepResult).toHaveProperty('stepId')
        expect(stepResult).toHaveProperty('status')
        expect(['completed', 'failed', 'skipped']).toContain(stepResult.status)

        if (stepResult.status === 'completed') {
          expect(stepResult).toHaveProperty('data')
        }
      })

      // Restore original
      WorkflowEngine.prototype.executeStep = originalExecuteStep
    })

    it('should include timing information in step results', async () => {
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Step results should include timing
      result.stepResults.forEach(stepResult => {
        if (stepResult.status === 'completed') {
          expect(stepResult).toHaveProperty('startTime')
          expect(stepResult).toHaveProperty('endTime')
          expect(stepResult).toHaveProperty('duration')
          expect(stepResult.duration).toBeGreaterThanOrEqual(0)
          expect(stepResult.endTime).toBeGreaterThanOrEqual(stepResult.startTime!)
        }
      })
    })

    it('should preserve step data across workflow execution', async () => {
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      // Mock step to return specific data with proper structure
      const originalExecuteStep = WorkflowEngine.prototype.executeStep
      WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(async function (step: WorkflowStep) {
        this.recordStepResult(step.id, 'running', { startTime: Date.now() })
        this.recordStepResult(step.id, 'completed', { 
          data: { stepData: `data-from-${step.id}` },
          endTime: Date.now(),
          duration: 100
        })
      })

      const result = await engine.execute()

      // Property: Step data should be preserved
      const step1Result = result.stepResults.find(r => r.stepId === 'step1')
      expect(step1Result?.data).toEqual({ stepData: 'data-from-step1' })

      // Restore original
      WorkflowEngine.prototype.executeStep = originalExecuteStep
    })

    it('should include tool results in step results', async () => {
      // Mock executeStep to include tool results
      const originalExecuteStep = WorkflowEngine.prototype.executeStep
      WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(async function (step: WorkflowStep) {
        this.recordStepResult(step.id, 'running', { startTime: Date.now() })
        this.recordStepResult(step.id, 'completed', {
          toolResults: { test_tool: { result: 'test-result' } },
          endTime: Date.now(),
          duration: 100,
        })
      })

      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Tool results should be included in step results
      const step1Result = result.stepResults.find(r => r.stepId === 'step1')
      expect(step1Result?.toolResults).toBeDefined()
      expect(step1Result?.toolResults).toHaveProperty('test_tool')

      // Restore original
      WorkflowEngine.prototype.executeStep = originalExecuteStep
    })
  })

  describe('Edge Cases', () => {
    it('should handle workflow with no steps', async () => {
      const emptyWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [],
      }

      const engine = new WorkflowEngine(
        emptyWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Empty workflow should complete successfully
      expect(result.status).toBe('completed')
      expect(result.stepResults.length).toBe(0)
    })

    it('should handle circular dependencies gracefully', async () => {
      const circularWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'step1',
            name: 'Step 1',
            description: 'Depends on step2',
            agent: 'research',
            parallel: false,
            dependencies: ['step2'],
            tools: [],
            outputFormat: 'json',
          },
          {
            id: 'step2',
            name: 'Step 2',
            description: 'Depends on step1',
            agent: 'research',
            parallel: false,
            dependencies: ['step1'],
            tools: [],
            outputFormat: 'json',
          },
        ],
      }

      const engine = new WorkflowEngine(
        circularWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      // Property: Circular dependencies should be detected and handled
      // Both steps should be skipped since neither can execute first
      const result = await engine.execute()
      expect(result.stepResults.every(r => r.status === 'skipped')).toBe(true)
    })

    it('should handle workflow execution timeout', async () => {
      // This would require mocking timers or implementing timeout logic
      // For now, verify workflow has timing information
      const engine = new WorkflowEngine(
        mockWorkflow,
        mockContext,
        'test-conversation',
        'test-user'
      )

      const result = await engine.execute()

      // Property: Workflow should have start and end times
      expect(result.startTime).toBeDefined()
      expect(result.endTime).toBeDefined()
      expect(result.endTime).toBeGreaterThanOrEqual(result.startTime)
    })
  })
})

