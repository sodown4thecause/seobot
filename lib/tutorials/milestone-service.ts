/**
 * Tutorial Milestone Service
 * Handles milestone tracking, badge awards, and achievement system
 * 
 * TODO: Migrate to Drizzle ORM once milestone tables are created
 * Currently uses in-memory storage after Supabase removal
 */

import type { TutorialMilestone } from './types'

// In-memory storage for user progress (temporary until Drizzle migration)
const userProgressStore = new Map<string, { badges: Badge[]; milestones: string[]; points: number }>()

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
          // Award badge
          const badge = await this.awardBadge(userId, milestone)
          newlyEarned.push(badge)
          progress.completedMilestones.push(milestone.id)
          progress.earnedBadges.push(badge)
          progress.totalPoints += milestone.reward.points || 0
        }
      }

      // Update user progress
      if (newlyEarned.length > 0) {
        await this.updateUserProgress(userId, progress)
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
   * TODO: Implement with Drizzle
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

    // Save to in-memory store (temporary)
    if (!userProgressStore.has(userId)) {
      userProgressStore.set(userId, { badges: [], milestones: [], points: 0 })
    }
    const progress = userProgressStore.get(userId)!
    progress.badges.push(badge)
    progress.milestones.push(milestone.id)
    progress.points += milestone.reward.points || 0

    return badge
  }

  /**
   * Get user's milestone progress
   * TODO: Implement with Drizzle
   */
  async getUserProgress(userId: string): Promise<UserMilestoneProgress> {
    try {
      const stored = userProgressStore.get(userId)
      const earnedBadges = stored?.badges || []
      const totalPoints = stored?.points || 0

      // Calculate level (every 100 points = 1 level)
      const level = Math.floor(totalPoints / 100) + 1
      const nextLevelPoints = level * 100

      return {
        userId,
        earnedBadges,
        completedMilestones: stored?.milestones || [],
        totalPoints,
        level,
        nextLevelPoints,
      }
    } catch (error) {
      console.error('Failed to get user progress:', error)
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

  // Helper methods - stubbed until Drizzle migration
  private async getCompletedTutorials(userId: string): Promise<string[]> {
    // TODO: Implement with Drizzle
    return []
  }

  private async getCompletedSteps(userId: string): Promise<string[]> {
    // TODO: Implement with Drizzle
    return []
  }

  private async getPerfectQuizzes(userId: string, minScore: number): Promise<string[]> {
    // TODO: Implement with Drizzle
    return []
  }

  private async getCompletedWorkflows(userId: string): Promise<string[]> {
    // TODO: Implement with Drizzle
    return []
  }

  private async getCompletedActions(userId: string): Promise<string[]> {
    // TODO: Implement with Drizzle
    return []
  }

  private async updateUserProgress(userId: string, progress: UserMilestoneProgress): Promise<void> {
    // TODO: Implement with Drizzle
    userProgressStore.set(userId, {
      badges: progress.earnedBadges,
      milestones: progress.completedMilestones,
      points: progress.totalPoints,
    })
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
