/**
 * Achievement Definitions and Logic
 * Defines all achievements and their requirements
 */

import type { AchievementDefinition, AchievementCategory, AchievementRarity } from './types'

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Content Achievements
  {
    achievementId: 'first_content',
    name: 'Content Creator',
    description: 'Created your first SEO-optimized content piece',
    category: 'content',
    icon: '📝',
    points: 50,
    requirements: { contentCreated: 1 },
    rarity: 'common',
    enabled: true
  },
  {
    achievementId: 'content_master',
    name: 'Content Master',
    description: 'Created 10 pieces of SEO-optimized content',
    category: 'content',
    icon: '📚',
    points: 200,
    requirements: { contentCreated: 10 },
    rarity: 'rare',
    enabled: true
  },
  {
    achievementId: 'ranking_improvement',
    name: 'Ranking Champion',
    description: 'Improved keyword ranking by 10+ positions',
    category: 'content',
    icon: '🏆',
    points: 300,
    requirements: { rankingImprovement: 10 },
    rarity: 'epic',
    enabled: true
  },

  // Keyword Research Achievements
  {
    achievementId: 'first_keyword',
    name: 'Keyword Hunter',
    description: 'Researched your first keyword',
    category: 'general',
    icon: '🔍',
    points: 25,
    requirements: { keywordsTracked: 1 },
    rarity: 'common',
    enabled: true
  },
  {
    achievementId: 'keyword_expert',
    name: 'Keyword Expert',
    description: 'Tracked 50 keywords',
    category: 'general',
    icon: '🎯',
    points: 150,
    requirements: { keywordsTracked: 50 },
    rarity: 'rare',
    enabled: true
  },

  // Technical SEO Achievements
  {
    achievementId: 'first_audit',
    name: 'Technical Auditor',
    description: 'Completed your first technical SEO audit',
    category: 'technical',
    icon: '🔧',
    points: 75,
    requirements: { auditsCompleted: 1 },
    rarity: 'common',
    enabled: true
  },
  {
    achievementId: 'speed_demon',
    name: 'Speed Demon',
    description: 'Achieved 90+ page speed score',
    category: 'technical',
    icon: '⚡',
    points: 250,
    requirements: { pageSpeedScore: 90 },
    rarity: 'epic',
    enabled: true
  },

  // Link Building Achievements
  {
    achievementId: 'first_link',
    name: 'Link Builder',
    description: 'Earned your first backlink',
    category: 'links',
    icon: '🔗',
    points: 100,
    requirements: { linksBuilt: 1 },
    rarity: 'common',
    enabled: true
  },
  {
    achievementId: 'link_master',
    name: 'Link Master',
    description: 'Built 25 quality backlinks',
    category: 'links',
    icon: '💎',
    points: 400,
    requirements: { linksBuilt: 25 },
    rarity: 'legendary',
    enabled: true
  },

  // Local SEO Achievements
  {
    achievementId: 'local_optimizer',
    name: 'Local Optimizer',
    description: 'Optimized your Google Business Profile',
    category: 'local',
    icon: '📍',
    points: 75,
    requirements: { gbpOptimized: true },
    rarity: 'common',
    enabled: true
  },

  // AEO Achievements
  {
    achievementId: 'ai_cited',
    name: 'AI Cited',
    description: 'Got your content cited by an AI search engine',
    category: 'aeo',
    icon: '🤖',
    points: 200,
    requirements: { aiCitations: 1 },
    rarity: 'rare',
    enabled: true
  },

  // General Achievements
  {
    achievementId: 'early_adopter',
    name: 'Early Adopter',
    description: 'Completed 5 tutorials',
    category: 'general',
    icon: '⭐',
    points: 100,
    requirements: { tutorialsCompleted: 5 },
    rarity: 'common',
    enabled: true
  },
  {
    achievementId: 'seo_master',
    name: 'SEO Master',
    description: 'Reached level 10 in all skill categories',
    category: 'general',
    icon: '👑',
    points: 1000,
    requirements: { allSkillsLevel10: true },
    rarity: 'legendary',
    enabled: true
  }
]

export function getAchievementById(achievementId: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.achievementId === achievementId && a.enabled)
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category && a.enabled)
}

export function getAchievementsByRarity(rarity: AchievementRarity): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.rarity === rarity && a.enabled)
}

export function checkAchievementRequirements(
  achievement: AchievementDefinition,
  userStats: Record<string, any>
): boolean {
  // Check if all requirements are met
  return Object.entries(achievement.requirements).every(([key, value]) => {
    const userValue = userStats[key]
    
    if (typeof value === 'number') {
      return typeof userValue === 'number' && userValue >= value
    }
    
    if (typeof value === 'boolean') {
      return userValue === value
    }
    
    // For complex requirements, would need more sophisticated logic
    return userValue !== undefined && userValue !== null
  })
}

