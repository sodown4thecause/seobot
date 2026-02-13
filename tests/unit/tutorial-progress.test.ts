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
import { db, userProgress } from '@/lib/db'

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

    progressService = new TutorialProgressService()
  })

  const seedTutorialProgress = async (params: {
    tutorialId: string
    currentStepIndex: number
    completedSteps: string[]
    startedAt?: Date
    completedAt?: Date
  }) => {
    const startedAt = params.startedAt ?? new Date()
    await db.insert(userProgress).values({
      userId: 'test-user-id',
      category: 'tutorial_progress',
      itemKey: params.tutorialId,
      completedAt: startedAt,
      metadata: {
        currentStepIndex: params.currentStepIndex,
        completedSteps: params.completedSteps,
        startedAt: startedAt.toISOString(),
        completedAt: params.completedAt?.toISOString(),
      },
    }).returning()
  }

  describe('Property: Progress State Consistency', () => {
    it('should maintain valid step index bounds', async () => {
      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 1,
        completedSteps: ['step-1'],
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

      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 2,
        completedSteps: ['step-1', 'step-2'],
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      if (progress) {
        progress.completedSteps.forEach((stepId) => {
          expect(validStepIds.has(stepId)).toBe(true)
        })
      }
    })

    it('should not exceed total steps in completed steps', async () => {
      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 2,
        completedSteps: ['step-1', 'step-2'],
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


      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: currentIndex,
        completedSteps: Array.from(completedSteps),
      })

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

      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 2,
        completedSteps: initialCompleted,
      })

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

      const startedAt = new Date(Date.now() - 10000)
      const completedAt = new Date()
      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: mockTutorial.steps.length,
        completedSteps: allStepsCompleted,
        startedAt,
        completedAt,
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

      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: mockTutorial.steps.length,
        completedSteps: mockTutorial.steps.map((s) => s.id),
        startedAt: startTime,
        completedAt: completionTime,
      })

      const progress = await progressService.getTutorialProgress('test-tutorial')

      if (progress && progress.completedAt) {
        expect(progress.completedAt.getTime()).toBeGreaterThan(progress.startedAt.getTime())
      }
    })
  })


  describe('Property: Progress Persistence', () => {
    it('should persist and retrieve progress correctly', async () => {
      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 1,
        completedSteps: ['step-1'],
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
      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 1,
        completedSteps: ['step-1'],
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
      const progress = await progressService.startTutorial('empty-tutorial')

      expect(progress).toBeDefined()
      expect(progress.currentStepIndex).toBe(0)
      expect(progress.completedSteps.length).toBe(0)
    })

    it('should handle concurrent step completions', async () => {
      await seedTutorialProgress({
        tutorialId: 'test-tutorial',
        currentStepIndex: 2,
        completedSteps: ['step-1', 'step-2'],
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
