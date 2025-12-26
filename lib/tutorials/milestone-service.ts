/**
 * Tutorial Milestone Service
 * Handles milestone tracking, badge awards, and achievement system
 */

import { createClient } from '@/lib/supabase/client'
import type { TutorialMilestone } from './types'

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
  private supabase = createClient()

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

    // Save to database
    const { error } = await this.supabase.from('tutorial_milestones').insert({
      user_id: userId,
      milestone_id: milestone.id,
      milestone_type: 'milestone_achieved',
      badge_data: badge,
      achieved_at: new Date().toISOString(),
      metadata: {
        points: milestone.reward.points || 0,
        unlocks: milestone.reward.unlocks || [],
      },
    })

    if (error) {
      console.error('Failed to save badge:', error)
    }

    return badge
  }

  /**
   * Get user's milestone progress
   */
  async getUserProgress(userId: string): Promise<UserMilestoneProgress> {
    try {
      // Get earned badges
      const { data: badgesData } = await this.supabase
        .from('tutorial_milestones')
        .select('*')
        .eq('user_id', userId)
        .eq('milestone_type', 'milestone_achieved')

      const earnedBadges: Badge[] = (badgesData || []).map((item: any) => ({
        id: item.milestone_id,
        name: item.badge_data?.name || '',
        description: item.badge_data?.description || '',
        icon: item.badge_data?.icon || '🏅',
        category: item.badge_data?.category || 'achievement',
        rarity: item.badge_data?.rarity || 'common',
        earnedAt: new Date(item.achieved_at),
      }))

      // Calculate total points
      const totalPoints = earnedBadges.reduce((sum, badge) => {
        const milestone = this.milestones.find(m => m.id === badge.id)
        return sum + (milestone?.reward.points || 0)
      }, 0)

      // Calculate level (every 100 points = 1 level)
      const level = Math.floor(totalPoints / 100) + 1
      const nextLevelPoints = level * 100

      return {
        userId,
        earnedBadges,
        completedMilestones: earnedBadges.map(b => b.id),
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

  // Helper methods
  private async getCompletedTutorials(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('tutorial_progress')
      .select('tutorial_id')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)

    return (data || []).map((item: { tutorial_id: string }) => item.tutorial_id)
  }

  private async getCompletedSteps(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('tutorial_step_completions')
      .select('step_id')
      .eq('user_id', userId)

    return (data || []).map((item: { step_id: string }) => item.step_id)
  }

  private async getPerfectQuizzes(userId: string, minScore: number): Promise<string[]> {
    const { data } = await this.supabase
      .from('tutorial_step_completions')
      .select('step_id')
      .eq('user_id', userId)
      .gte('quiz_score', minScore)

    return (data || []).map((item: { step_id: string }) => item.step_id)
  }

  private async getCompletedWorkflows(userId: string): Promise<string[]> {
    // This would query workflow execution table
    // For now, return empty array - would need workflow execution tracking
    return []
  }

  private async getCompletedActions(userId: string): Promise<string[]> {
    // This would query action completion table
    // For now, return empty array - would need action tracking
    return []
  }

  private async updateUserProgress(userId: string, progress: UserMilestoneProgress): Promise<void> {
    // Update user's milestone progress in database
    // This could be stored in a user_milestone_progress table
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
