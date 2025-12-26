/**
 * Progress Tracker - Drizzle ORM Implementation
 * Main service for tracking user progress, skills, and achievements
 */

import { db, businessProfiles, userProgress } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/clerk'
import { eq, and, desc } from 'drizzle-orm'
import type { SEOProgress, Skill, SkillCategory, Achievement, AchievementCategory, AchievementRarity, MetricsCorrelation } from './types'
import { getSkillCategoryDefinition, calculateXpForNextLevel } from './skill-categories'

export class ProgressTracker {

  /**
   * Get user's complete SEO progress
   */
  async getUserProgress(userId?: string): Promise<SEOProgress> {
    const user = await getCurrentUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) {
      throw new Error('User not authenticated')
    }

    // Get skills
    const skills = await this.getUserSkills(targetUserId)

    // Get achievements
    const achievements = await this.getUserAchievements(targetUserId)

    // Get onboarding progress
    const onboarding = await this.getOnboardingProgress(targetUserId)

    // Get metrics
    const metrics = await this.getUserMetrics(targetUserId)

    return {
      onboarding,
      skills: {
        keywordResearch: skills.find(s => s.category === 'keywordResearch') || this.getDefaultSkill('keywordResearch'),
        contentCreation: skills.find(s => s.category === 'contentCreation') || this.getDefaultSkill('contentCreation'),
        technicalSEO: skills.find(s => s.category === 'technicalSEO') || this.getDefaultSkill('technicalSEO'),
        linkBuilding: skills.find(s => s.category === 'linkBuilding') || this.getDefaultSkill('linkBuilding'),
        localSEO: skills.find(s => s.category === 'localSEO') || this.getDefaultSkill('localSEO')
      },
      achievements,
      metrics
    }
  }

  /**
   * Get user skills from progress table
   */
  async getUserSkills(userId: string): Promise<Skill[]> {
    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.category, 'skill')
        ))

      return data.map(item => {
        const metadata = item.metadata as Record<string, unknown>
        return {
          category: item.itemKey as SkillCategory,
          level: (metadata?.level as number) || 1,
          xp: (metadata?.xp as number) || 0,
          nextLevelXp: (metadata?.nextLevelXp as number) || 100,
          totalXp: (metadata?.totalXp as number) || 0,
          lastUpdatedAt: item.completedAt
        }
      })
    } catch (error) {
      console.error('Failed to get user skills:', error)
      return []
    }
  }

  /**
   * Get user achievements from progress table
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.category, 'achievement')
        ))
        .orderBy(desc(userProgress.completedAt))

      return data.map(item => {
        const metadata = item.metadata as Record<string, unknown>
        return {
          id: item.itemKey,
          name: (metadata?.name as string) || item.itemKey,
          description: (metadata?.description as string) || '',
          category: (metadata?.achievementCategory as AchievementCategory) || 'general',
          icon: metadata?.icon as string | undefined,
          points: (metadata?.points as number) || 0,
          rarity: (metadata?.rarity as AchievementRarity) || 'common',
          earnedAt: item.completedAt,
          metadata: metadata || {}
        }
      })
    } catch (error) {
      console.error('Failed to get user achievements:', error)
      return []
    }
  }

  /**
   * Add XP to a skill
   */
  async addSkillXp(
    category: SkillCategory,
    xpAmount: number,
    activityType: string,
    metadata: Record<string, any> = {}
  ): Promise<Skill> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Get current skill
    const skills = await this.getUserSkills(user.id)
    const currentSkill = skills.find(s => s.category === category) || this.getDefaultSkill(category)

    // Calculate new XP and level
    let newXp = currentSkill.xp + xpAmount
    let newLevel = currentSkill.level
    let nextLevelXp = currentSkill.nextLevelXp

    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp
      newLevel += 1
      const definition = getSkillCategoryDefinition(category)
      nextLevelXp = calculateXpForNextLevel(newLevel, definition.baseXpPerLevel, definition.xpMultiplier)
    }

    // Save updated skill
    await db
      .insert(userProgress)
      .values({
        userId: user.id,
        category: 'skill',
        itemKey: category,
        metadata: {
          level: newLevel,
          xp: newXp,
          nextLevelXp,
          totalXp: currentSkill.totalXp + xpAmount,
          activityType,
          ...metadata
        }
      })

    return {
      category,
      level: newLevel,
      xp: newXp,
      nextLevelXp,
      totalXp: currentSkill.totalXp + xpAmount,
      lastUpdatedAt: new Date()
    }
  }

  /**
   * Award an achievement
   */
  async awardAchievement(
    achievementId: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    try {
      await db
        .insert(userProgress)
        .values({
          userId: user.id,
          category: 'achievement',
          itemKey: achievementId,
          metadata
        })
      return true
    } catch (error) {
      console.error('Failed to award achievement:', error)
      return false
    }
  }

  /**
   * Check and award achievements based on user stats
   */
  async checkAndAwardAchievements(): Promise<Achievement[]> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')
    return await this.getUserAchievements(user.id)
  }

  /**
   * Get onboarding progress
   */
  private async getOnboardingProgress(userId: string): Promise<SEOProgress['onboarding']> {
    try {
      const [profile] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.userId, userId))
        .limit(1)

      const completed: string[] = []
      const pending: string[] = []

      if (profile?.websiteUrl) {
        completed.push('business_profile')
      } else {
        pending.push('business_profile')
      }

      const total = completed.length + pending.length
      const percentage = total > 0 ? (completed.length / total) * 100 : 0

      return {
        completed,
        pending,
        percentage
      }
    } catch (error) {
      console.error('Failed to get onboarding progress:', error)
      return { completed: [], pending: ['business_profile'], percentage: 0 }
    }
  }

  /**
   * Get user metrics
   */
  private async getUserMetrics(_userId: string): Promise<SEOProgress['metrics']> {
    // This would aggregate from various sources
    return {
      contentCreated: 0,
      keywordsRanking: 0,
      linksBuilt: 0,
      trafficGrowth: '0%'
    }
  }

  /**
   * Get default skill for a category
   */
  private getDefaultSkill(category: SkillCategory): Skill {
    const definition = getSkillCategoryDefinition(category)
    return {
      category,
      level: 1,
      xp: 0,
      nextLevelXp: definition.baseXpPerLevel,
      totalXp: 0,
      lastUpdatedAt: new Date()
    }
  }

  /**
   * Record metrics correlation
   */
  async recordMetricsCorrelation(
    actionType: string,
    actionId: string | undefined,
    metricType: MetricsCorrelation['metricType'],
    metricValue: number,
    metricUnit: string,
    correlationWindowDays: number = 30,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    try {
      await db
        .insert(userProgress)
        .values({
          userId: user.id,
          category: 'metrics_correlation',
          itemKey: `${actionType}_${metricType}`,
          metadata: {
            actionType,
            actionId,
            metricType,
            metricValue,
            metricUnit,
            correlationWindowDays,
            ...metadata
          }
        })
    } catch (error) {
      throw new Error(`Failed to record metrics correlation: ${error}`)
    }
  }
}

export const progressTracker = new ProgressTracker()
