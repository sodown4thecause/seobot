/**
 * Tutorial Milestone Service
 * Handles milestone tracking, badge awards, and achievement system
 *
 * Uses Drizzle ORM for persistent storage via userProgress table
 */

import type { TutorialMilestone } from './types'
import { db, userProgress } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export interface Milestone {
  id: string
  title: string
  description: string
  icon: string
  requirement: {
    type: 'tutorials_completed' | 'steps_completed' | 'quiz_perfect' | 'workflows_completed' | 'actions_completed'
    count?: number
    tutorialIds?: string[]
    workflowIds?: string[]
    minScore?: number
  }
  reward: {
    badge: string
    badgeIcon: string
    unlocks?: string[] // Features unlocked
    points?: number
  }
  category: 'learning' | 'achievement' | 'mastery' | 'exploration'
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earnedAt?: Date
}

export interface UserMilestoneProgress {
  userId: string
  earnedBadges: Badge[]
  completedMilestones: string[]
  totalPoints: number
  level: number
  nextLevelPoints: number
}

export class MilestoneService {
  private userId: string | null = null

  setUserId(userId: string) {
    this.userId = userId
  }

  // Define all milestones
  private milestones: Milestone[] = [
    {
      id: 'first-tutorial',
      title: 'First Steps',
      description: 'Complete your first tutorial',
      icon: '🎯',
      requirement: {
        type: 'tutorials_completed',
        count: 1,
      },
      reward: {
        badge: 'First Steps',
        badgeIcon: '🎯',
        points: 10,
      },
      category: 'learning',
    },
    {
      id: 'seo-basics-master',
      title: 'SEO Basics Master',
      description: 'Complete all beginner SEO tutorials',
      icon: '📚',
      requirement: {
        type: 'tutorials_completed',
        tutorialIds: ['seo-fundamentals-101', 'technical-seo-basics', 'content-optimization-101'],
      },
      reward: {
        badge: 'SEO Basics Master',
        badgeIcon: '📚',
        points: 50,
        unlocks: ['advanced-keyword-research'],
      },
      category: 'mastery',
    },
    {
      id: 'local-seo-expert',
      title: 'Local SEO Expert',
      description: 'Complete the local SEO tutorial',
      icon: '📍',
      requirement: {
        type: 'tutorials_completed',
        tutorialIds: ['local-seo-guide'],
      },
      reward: {
        badge: 'Local SEO Expert',
        badgeIcon: '📍',
        points: 30,
      },
      category: 'achievement',
    },
    {
      id: 'link-builder',
      title: 'Link Builder',
      description: 'Complete the link building tutorial',
      icon: '🔗',
      requirement: {
        type: 'tutorials_completed',
        tutorialIds: ['link-building-fundamentals'],
      },
      reward: {
        badge: 'Link Builder',
        badgeIcon: '🔗',
        points: 30,
      },
      category: 'achievement',
    },
    {
      id: 'aeo-specialist',
      title: 'AEO Specialist',
      description: 'Complete all AEO tutorials',
      icon: '🤖',
      requirement: {
        type: 'tutorials_completed',
        tutorialIds: ['aeo-getting-cited', 'aeo-advanced'],
      },
      reward: {
        badge: 'AEO Specialist',
        badgeIcon: '🤖',
        points: 50,
        unlocks: ['advanced-aeo-strategies'],
      },
      category: 'mastery',
    },
    {
      id: 'perfect-quiz',
      title: 'Perfect Score',
      description: 'Get 100% on any tutorial quiz',
      icon: '⭐',
      requirement: {
        type: 'quiz_perfect',
        minScore: 100,
      },
      reward: {
        badge: 'Perfect Score',
        badgeIcon: '⭐',
        points: 20,
      },
      category: 'achievement',
    },
    {
      id: 'tutorial-completionist',
      title: 'Completionist',
      description: 'Complete all available tutorials',
      icon: '🏆',
      requirement: {
        type: 'tutorials_completed',
        count: 10, // Adjust based on total tutorials
      },
      reward: {
        badge: 'Completionist',
        badgeIcon: '🏆',
        points: 100,
        unlocks: ['expert-mode', 'beta-features'],
      },
      category: 'mastery',
    },
    {
      id: 'workflow-master',
      title: 'Workflow Master',
      description: 'Complete 5 different workflows',
      icon: '⚡',
      requirement: {
        type: 'workflows_completed',
        count: 5,
      },
      reward: {
        badge: 'Workflow Master',
        badgeIcon: '⚡',
        points: 75,
      },
      category: 'exploration',
    },
    {
      id: 'action-taker',
      title: 'Action Taker',
      description: 'Complete 10 actions from the action generator',
      icon: '✅',
      requirement: {
        type: 'actions_completed',
        count: 10,
      },
      reward: {
        badge: 'Action Taker',
        badgeIcon: '✅',
        points: 40,
      },
      category: 'achievement',
    },
  ]

  /**
   * Check and award milestones based on user progress
   */
  async checkAndAwardMilestones(userId: string): Promise<Badge[]> {
    try {
      const progress = await this.getUserProgress(userId)
      const newlyEarned: Badge[] = []

      for (const milestone of this.milestones) {
        // Skip if already earned
        if (progress.completedMilestones.includes(milestone.id)) {
          continue
        }

        // Check if requirement is met
        const requirementMet = await this.checkRequirement(
          milestone.requirement,
          userId,
          progress
        )

        if (requirementMet) {
          // Award badge (saves to database immediately)
          const badge = await this.awardBadge(userId, milestone)
          newlyEarned.push(badge)
        }
      }

      return newlyEarned
    } catch (error) {
      console.error('Failed to check milestones:', error)
      return []
    }
  }

  /**
   * Check if a requirement is met
   */
  private async checkRequirement(
    requirement: Milestone['requirement'],
    userId: string,
    progress: UserMilestoneProgress
  ): Promise<boolean> {
    switch (requirement.type) {
      case 'tutorials_completed':
        if (requirement.tutorialIds) {
          // Check if all specified tutorials are completed
          const completedTutorials = await this.getCompletedTutorials(userId)
          return requirement.tutorialIds.every(id => completedTutorials.includes(id))
        } else if (requirement.count) {
          // Check if count threshold is met
          const completedTutorials = await this.getCompletedTutorials(userId)
          return completedTutorials.length >= requirement.count
        }
        return false

      case 'steps_completed':
        if (requirement.count) {
          const completedSteps = await this.getCompletedSteps(userId)
          return completedSteps.length >= requirement.count
        }
        return false

      case 'quiz_perfect':
        if (requirement.minScore) {
          const perfectQuizzes = await this.getPerfectQuizzes(userId, requirement.minScore)
          return perfectQuizzes.length > 0
        }
        return false

      case 'workflows_completed':
        if (requirement.count) {
          const completedWorkflows = await this.getCompletedWorkflows(userId)
          return completedWorkflows.length >= requirement.count
        }
        return false

      case 'actions_completed':
        if (requirement.count) {
          const completedActions = await this.getCompletedActions(userId)
          return completedActions.length >= requirement.count
        }
        return false

      default:
        return false
    }
  }

  /**
   * Award a badge to a user
   * Saves to database using userProgress table
   */
  private async awardBadge(userId: string, milestone: Milestone): Promise<Badge> {
    const badge: Badge = {
      id: milestone.id,
      name: milestone.reward.badge,
      description: milestone.description,
      icon: milestone.reward.badgeIcon,
      category: milestone.category,
      rarity: this.calculateRarity(milestone),
      earnedAt: new Date(),
    }

    try {
      // Save badge to database
      await db.insert(userProgress).values({
        userId,
        category: 'milestone_badge',
        itemKey: milestone.id,
        metadata: {
          badge: badge.name,
          badgeIcon: badge.icon,
          description: badge.description,
          rarity: badge.rarity,
          points: milestone.reward.points || 0,
          unlocks: milestone.reward.unlocks || [],
        },
      })
    } catch (error) {
      console.error('[MilestoneService] Failed to save badge:', error)
      throw error
    }

    return badge
  }

  /**
   * Get user's milestone progress from database
   */
  async getUserProgress(userId: string): Promise<UserMilestoneProgress> {
    try {
      // Query all milestone badges for this user
      const badges = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.category, 'milestone_badge')
        ))

      // Convert database records to Badge objects
      const earnedBadges: Badge[] = badges.map(record => {
        const metadata = record.metadata as Record<string, unknown>
        return {
          id: record.itemKey,
          name: (metadata?.badge as string) || '',
          description: (metadata?.description as string) || '',
          icon: (metadata?.badgeIcon as string) || '',
          category: 'milestone',
          rarity: (metadata?.rarity as Badge['rarity']) || 'common',
          earnedAt: record.completedAt,
        }
      })

      // Calculate total points from all badges
      const totalPoints = badges.reduce((sum, record) => {
        const metadata = record.metadata as Record<string, unknown>
        return sum + ((metadata?.points as number) || 0)
      }, 0)

      // Get completed milestone IDs
      const completedMilestones = badges.map(record => record.itemKey)

      // Calculate level (every 100 points = 1 level)
      const level = Math.floor(totalPoints / 100) + 1
      const nextLevelPoints = level * 100

      return {
        userId,
        earnedBadges,
        completedMilestones,
        totalPoints,
        level,
        nextLevelPoints,
      }
    } catch (error) {
      console.error('[MilestoneService] Failed to get user progress:', error)
      return {
        userId,
        earnedBadges: [],
        completedMilestones: [],
        totalPoints: 0,
        level: 1,
        nextLevelPoints: 100,
      }
    }
  }

  /**
   * Get all available milestones
   */
  getAllMilestones(): Milestone[] {
    return this.milestones
  }

  /**
   * Get badges for a user
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    const progress = await this.getUserProgress(userId)
    return progress.earnedBadges
  }

  // Helper methods - Drizzle ORM implementations
  private async getCompletedTutorials(userId: string): Promise<string[]> {
    try {
      const { tutorialProgressService } = await import('./progress-service')

      // Get all completed tutorials from the progress service
      const completedTutorials = await tutorialProgressService.getCompletedTutorials()

      return completedTutorials
    } catch (error) {
      console.error('Failed to get completed tutorials:', error)
      return []
    }
  }

  private async getCompletedSteps(userId: string): Promise<string[]> {
    try {
      const { db, userProgress } = await import('@/lib/db')
      const { eq, and } = await import('drizzle-orm')

      // Query all completed steps for this user
      const steps = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.category, 'tutorial_step')
        ))

      // Return step IDs (itemKey format is "tutorialId:stepId")
      return steps.map(step => step.itemKey)
    } catch (error) {
      console.error('Failed to get completed steps:', error)
      return []
    }
  }

  private async getPerfectQuizzes(userId: string, minScore: number): Promise<string[]> {
    try {
      const { db, userProgress } = await import('@/lib/db')
      const { eq, and } = await import('drizzle-orm')

      // Query tutorial steps that have quiz scores >= minScore
      const steps = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.category, 'tutorial_step')
        ))

      // Filter by quiz score and extract quiz IDs
      const perfectQuizzes = steps
        .filter(step => {
          const metadata = step.metadata as Record<string, unknown>
          const quizScore = metadata?.quizScore as number | undefined
          return quizScore !== undefined && quizScore >= minScore
        })
        .map(step => {
          // Return the step ID (which represents the quiz)
          const metadata = step.metadata as Record<string, unknown>
          return `${metadata?.tutorialId}:${metadata?.stepId}`
        })

      return perfectQuizzes
    } catch (error) {
      console.error('Failed to get perfect quizzes:', error)
      return []
    }
  }

  private async getCompletedWorkflows(userId: string): Promise<string[]> {
    try {
      const { workflowPersistence } = await import('@/lib/workflows/persistence')

      // Get all workflow executions for this user
      const executions = await workflowPersistence.getUserExecutions(userId)

      // Filter for completed workflows and return unique workflow IDs
      const completedWorkflowIds = executions
        .filter(execution => execution.status === 'completed')
        .map(execution => execution.workflowId)

      // Return unique workflow IDs using Array.from
      return Array.from(new Set(completedWorkflowIds))
    } catch (error) {
      console.error('Failed to get completed workflows:', error)
      return []
    }
  }

  private async getCompletedActions(userId: string): Promise<string[]> {
    try {
      const { sessionMemory } = await import('@/lib/proactive/session-memory')

      // Get all completed tasks (workflow actions) for this user
      const completedTasks = await sessionMemory.getCompletedTasks(userId)

      // Return task keys (which represent action IDs)
      return completedTasks.map(task => task.taskKey)
    } catch (error) {
      console.error('Failed to get completed actions:', error)
      return []
    }
  }


  private calculateRarity(milestone: Milestone): Badge['rarity'] {
    const points = milestone.reward.points || 0
    if (points >= 100) return 'legendary'
    if (points >= 50) return 'epic'
    if (points >= 30) return 'rare'
    return 'common'
  }
}

export const milestoneService = new MilestoneService()
