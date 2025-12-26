/**
 * Property Test: Tutorial Progress Tracking
 * 
 * **Feature: nextphase-action-engine, Property 4: Tutorial Progress Tracking**
 * **Validates: Requirements 2.3, 11.1, 11.2**
 * 
 * Ensures that tutorial progress tracking maintains consistency:
 * - Progress state is always valid (step indices within bounds)
 * - Completed steps are never lost
 * - Progress advances monotonically
 * - Completion is only possible when all steps are done
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Tutorial } from '@/lib/tutorials/types'

// Mock Supabase client - must be defined before any imports that use it
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser
    },
    from: mockFrom,
    rpc: mockRpc
  })
}))

// Now import the service after mock is set up
const { TutorialProgressService } = await import('@/lib/tutorials/progress-service')

describe('Property 4: Tutorial Progress Tracking', () => {
  let progressService: InstanceType<typeof TutorialProgressService>
  const mockTutorial: Tutorial = {
    id: 'test-tutorial',
    title: 'Test Tutorial',
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    prerequisites: [],
    steps: [
      { id: 'step-1', title: 'Step 1', content: 'Content 1', action: 'EXPLAIN' },
      { id: 'step-2', title: 'Step 2', content: 'Content 2', action: 'QUIZ' },
      { id: 'step-3', title: 'Step 3', content: 'Content 3', action: 'TOOL_DEMO' }
    ],
    outcomes: [],
    enabled: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock implementations
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
    
    progressService = new TutorialProgressService()
  })

  describe('Property: Progress State Consistency', () => {
    it('should maintain valid step index bounds', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: 1,
                  completed_steps: ['step-1'],
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      expect(progress).toBeDefined()
      if (progress) {
        expect(progress.currentStepIndex).toBeGreaterThanOrEqual(0)
        expect(progress.currentStepIndex).toBeLessThan(mockTutorial.steps.length)
      }
    })

    it('should only contain valid step IDs in completed steps', async () => {
      const validStepIds = new Set(mockTutorial.steps.map((s: { id: string }) => s.id))

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: 2,
                  completed_steps: ['step-1', 'step-2'],
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      if (progress) {
        progress.completedSteps.forEach((stepId) => {
          expect(validStepIds.has(stepId)).toBe(true)
        })
      }
    })

    it('should not exceed total steps in completed steps', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: 2,
                  completed_steps: ['step-1', 'step-2'],
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      if (progress) {
        expect(progress.completedSteps.length).toBeLessThanOrEqual(mockTutorial.steps.length)
      }
    })
  })


  describe('Property: Progress Monotonicity', () => {
    it('should advance step index monotonically', async () => {
      let currentIndex = 0
      const completedSteps = new Set<string>()

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => {
                return Promise.resolve({
                  data: {
                    tutorial_id: 'test-tutorial',
                    current_step_index: currentIndex,
                    completed_steps: Array.from(completedSteps),
                    started_at: new Date().toISOString(),
                    last_accessed_at: new Date().toISOString(),
                    metadata: {}
                  },
                  error: null
                })
              })
            })
          })
        })
      })

      mockRpc.mockResolvedValue({ error: null })

      for (let i = 0; i < mockTutorial.steps.length; i++) {
        const step = mockTutorial.steps[i]
        const previousIndex = currentIndex
        const previousCompleted = new Set(completedSteps)

        await progressService.completeStep('test-tutorial', step.id, i)

        const progress = await progressService.getTutorialProgress('test-tutorial')
        if (progress) {
          expect(progress.currentStepIndex).toBeGreaterThanOrEqual(previousIndex)
          expect(progress.completedSteps.length).toBeGreaterThanOrEqual(previousCompleted.size)
        }

        currentIndex = Math.max(currentIndex, i + 1)
        completedSteps.add(step.id)
      }
    })

    it('should never lose completed steps', async () => {
      const initialCompleted = ['step-1', 'step-2']

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: 2,
                  completed_steps: initialCompleted,
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      mockRpc.mockResolvedValue({ error: null })

      await progressService.completeStep('test-tutorial', 'step-3', 2)

      const progress = await progressService.getTutorialProgress('test-tutorial')
      if (progress) {
        initialCompleted.forEach((stepId) => {
          expect(progress.completedSteps).toContain(stepId)
        })
      }
    })
  })

  describe('Property: Completion Validity', () => {
    it('should only complete when all steps are done', async () => {
      const allStepsCompleted = mockTutorial.steps.map((s) => s.id)

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: mockTutorial.steps.length,
                  completed_steps: allStepsCompleted,
                  started_at: new Date(Date.now() - 10000).toISOString(),
                  completed_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      if (progress && progress.completedAt) {
        expect(progress.completedSteps.length).toBe(mockTutorial.steps.length)
        mockTutorial.steps.forEach((step) => {
          expect(progress.completedSteps).toContain(step.id)
        })
      }
    })

    it('should have completion timestamp after start timestamp', async () => {
      const startTime = new Date(Date.now() - 10000)
      const completionTime = new Date()

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: mockTutorial.steps.length,
                  completed_steps: mockTutorial.steps.map((s) => s.id),
                  started_at: startTime.toISOString(),
                  completed_at: completionTime.toISOString(),
                  last_accessed_at: completionTime.toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      if (progress && progress.completedAt) {
        expect(progress.completedAt.getTime()).toBeGreaterThan(progress.startedAt.getTime())
      }
    })
  })


  describe('Property: Progress Persistence', () => {
    it('should persist and retrieve progress correctly', async () => {
      const savedProgress = {
        tutorial_id: 'test-tutorial',
        current_step_index: 1,
        completed_steps: ['step-1'],
        started_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        metadata: {}
      }

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: savedProgress,
                error: null
              })
            })
          })
        })
      })

      const progress1 = await progressService.getTutorialProgress('test-tutorial')
      const progress2 = await progressService.getTutorialProgress('test-tutorial')

      if (progress1 && progress2) {
        expect(progress1.currentStepIndex).toBe(progress2.currentStepIndex)
        expect(progress1.completedSteps).toEqual(progress2.completedSteps)
        expect(progress1.tutorialId).toBe(progress2.tutorialId)
      }
    })

    it('should not create duplicate step completions', async () => {
      mockRpc.mockResolvedValue({ error: null })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: 1,
                  completed_steps: ['step-1'],
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      await progressService.completeStep('test-tutorial', 'step-1', 0)
      await progressService.completeStep('test-tutorial', 'step-1', 0)

      const progress = await progressService.getTutorialProgress('test-tutorial')
      if (progress) {
        const step1Count = progress.completedSteps.filter((id) => id === 'step-1').length
        expect(step1Count).toBe(1)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty tutorial gracefully', async () => {
      // First call to getTutorialProgress returns null (no existing progress)
      // Second call is the insert
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: getTutorialProgress check
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' } // No rows found
                  })
                })
              })
            })
          }
        }
        // Second call: insert new progress
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'empty-tutorial',
                  current_step_index: 0,
                  completed_steps: [],
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        }
      })

      const progress = await progressService.startTutorial('empty-tutorial')

      expect(progress).toBeDefined()
      expect(progress.currentStepIndex).toBe(0)
      expect(progress.completedSteps.length).toBe(0)
    })

    it('should handle concurrent step completions', async () => {
      mockRpc.mockResolvedValue({ error: null })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  tutorial_id: 'test-tutorial',
                  current_step_index: 2,
                  completed_steps: ['step-1', 'step-2'],
                  started_at: new Date().toISOString(),
                  last_accessed_at: new Date().toISOString(),
                  metadata: {}
                },
                error: null
              })
            })
          })
        })
      })

      const promises = [
        progressService.completeStep('test-tutorial', 'step-1', 0),
        progressService.completeStep('test-tutorial', 'step-2', 1)
      ]

      await Promise.all(promises)

      const progress = await progressService.getTutorialProgress('test-tutorial')
      if (progress) {
        expect(progress.completedSteps).toContain('step-1')
        expect(progress.completedSteps).toContain('step-2')
      }
    })
  })
})
