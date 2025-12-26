/**
 * Tutorial Progress Service - Drizzle ORM Implementation
 * Handles tutorial progress tracking and milestone management
 */

import { db, userProgress } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/clerk'
import { eq, and, desc, isNotNull } from 'drizzle-orm'
import type { TutorialProgress, TutorialStepCompletion, TutorialMilestone } from './types'

export class TutorialProgressService {

  /**
   * Get user's progress for a specific tutorial
   */
  async getTutorialProgress(tutorialId: string): Promise<TutorialProgress | null> {
    const user = await getCurrentUser()
    if (!user) return null

    try {
      const [data] = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, user.id),
          eq(userProgress.category, 'tutorial_progress'),
          eq(userProgress.itemKey, tutorialId)
        ))
        .limit(1)

      if (!data) return null

      const metadata = data.metadata as Record<string, unknown>
      return {
        tutorialId,
        currentStepIndex: (metadata?.currentStepIndex as number) || 0,
        completedSteps: (metadata?.completedSteps as string[]) || [],
        startedAt: data.completedAt,
        completedAt: metadata?.completedAt ? new Date(metadata.completedAt as string) : undefined,
        lastAccessedAt: data.completedAt,
        metadata: metadata || {}
      }
    } catch (error) {
      console.error('Failed to get tutorial progress:', error)
      return null
    }
  }

  /**
   * Start or resume a tutorial
   */
  async startTutorial(tutorialId: string): Promise<TutorialProgress> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Check if already started
    const existing = await this.getTutorialProgress(tutorialId)
    if (existing) {
      return existing
    }

    // Start new tutorial
    const [data] = await db
      .insert(userProgress)
      .values({
        userId: user.id,
        category: 'tutorial_progress',
        itemKey: tutorialId,
        metadata: {
          currentStepIndex: 0,
          completedSteps: [],
          startedAt: new Date().toISOString()
        }
      })
      .returning()

    return {
      tutorialId,
      currentStepIndex: 0,
      completedSteps: [],
      startedAt: data.completedAt,
      lastAccessedAt: data.completedAt,
      metadata: {}
    }
  }

  /**
   * Record step completion
   */
  async completeStep(
    tutorialId: string,
    stepId: string,
    stepIndex: number,
    options?: {
      quizScore?: number
      demoExecuted?: boolean
      timeSpentSeconds?: number
      metadata?: Record<string, any>
    }
  ): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Record step completion
    await db
      .insert(userProgress)
      .values({
        userId: user.id,
        category: 'tutorial_step',
        itemKey: `${tutorialId}:${stepId}`,
        metadata: {
          tutorialId,
          stepId,
          stepIndex,
          quizScore: options?.quizScore,
          demoExecuted: options?.demoExecuted ?? false,
          timeSpentSeconds: options?.timeSpentSeconds,
          ...options?.metadata
        }
      })

    // Check for milestones after step completion
    await this.checkMilestonesAfterStep(tutorialId, stepId, options?.quizScore)
  }

  /**
   * Get all user's tutorial progress
   */
  async getAllProgress(): Promise<TutorialProgress[]> {
    const user = await getCurrentUser()
    if (!user) return []

    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, user.id),
          eq(userProgress.category, 'tutorial_progress')
        ))
        .orderBy(desc(userProgress.completedAt))

      return data.map(item => {
        const metadata = item.metadata as Record<string, unknown>
        return {
          tutorialId: item.itemKey,
          currentStepIndex: (metadata?.currentStepIndex as number) || 0,
          completedSteps: (metadata?.completedSteps as string[]) || [],
          startedAt: item.completedAt,
          completedAt: metadata?.completedAt ? new Date(metadata.completedAt as string) : undefined,
          lastAccessedAt: item.completedAt,
          metadata: metadata || {}
        }
      })
    } catch (error) {
      console.error('Failed to get all progress:', error)
      return []
    }
  }

  /**
   * Get completed tutorials
   */
  async getCompletedTutorials(): Promise<string[]> {
    const user = await getCurrentUser()
    if (!user) return []

    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, user.id),
          eq(userProgress.category, 'tutorial_progress')
        ))

      return data
        .filter(item => {
          const metadata = item.metadata as Record<string, unknown>
          return metadata?.completedAt != null
        })
        .map(item => item.itemKey)
    } catch (error) {
      console.error('Failed to get completed tutorials:', error)
      return []
    }
  }

  /**
   * Check and award milestones after step completion
   */
  async checkMilestonesAfterStep(
    tutorialId: string,
    stepId: string,
    quizScore?: number
  ): Promise<void> {
    try {
      const user = await getCurrentUser()
      if (!user) return

      // Import milestone service
      const { milestoneService } = await import('./milestone-service')

      // Check for milestones
      await milestoneService.checkAndAwardMilestones(user.id)
    } catch (error) {
      console.error('Failed to check milestones:', error)
    }
  }

  /**
   * Get tutorial milestones
   */
  async getMilestones(tutorialId?: string): Promise<TutorialMilestone[]> {
    const user = await getCurrentUser()
    if (!user) return []

    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, user.id),
          eq(userProgress.category, 'milestone')
        ))
        .orderBy(desc(userProgress.completedAt))

      let results = data.map(item => {
        const metadata = item.metadata as Record<string, unknown>
        return {
          milestoneType: (metadata?.milestoneType as TutorialMilestone['milestoneType']) || 'tutorial_completion',
          tutorialId: metadata?.tutorialId as string,
          stepId: metadata?.stepId as string | undefined,
          achievedAt: item.completedAt,
          metadata: metadata || {}
        }
      })

      if (tutorialId) {
        results = results.filter(m => m.tutorialId === tutorialId)
      }

      return results
    } catch (error) {
      console.error('Failed to get milestones:', error)
      return []
    }
  }

  /**
   * Get step completion details
   */
  async getStepCompletions(tutorialId: string): Promise<TutorialStepCompletion[]> {
    const user = await getCurrentUser()
    if (!user) return []

    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, user.id),
          eq(userProgress.category, 'tutorial_step')
        ))
        .orderBy(desc(userProgress.completedAt))

      return data
        .filter(item => {
          const metadata = item.metadata as Record<string, unknown>
          return metadata?.tutorialId === tutorialId
        })
        .map(item => {
          const metadata = item.metadata as Record<string, unknown>
          return {
            stepId: (metadata?.stepId as string) || item.itemKey,
            stepIndex: (metadata?.stepIndex as number) || 0,
            completedAt: item.completedAt,
            quizScore: metadata?.quizScore as number | undefined,
            demoExecuted: (metadata?.demoExecuted as boolean) ?? false,
            timeSpentSeconds: metadata?.timeSpentSeconds as number | undefined,
            metadata: metadata || {}
          }
        })
    } catch (error) {
      console.error('Failed to get step completions:', error)
      return []
    }
  }
}

export const tutorialProgressService = new TutorialProgressService()
