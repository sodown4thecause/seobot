/**
 * Progress Tracking Types
 * Types for skill development, achievements, and gamification
 */

export type SkillCategory = 
  | 'keywordResearch' 
  | 'contentCreation' 
  | 'technicalSEO' 
  | 'linkBuilding' 
  | 'localSEO'

export type AchievementCategory = 
  | 'content' 
  | 'technical' 
  | 'links' 
  | 'local' 
  | 'aeo' 
  | 'general'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Skill {
  category: SkillCategory
  level: number
  xp: number
  nextLevelXp: number
  totalXp: number
  lastUpdatedAt: Date
}

export interface SkillActivity {
  category: SkillCategory
  activityType: string
  xpGained: number
  levelBefore: number
  levelAfter: number
  createdAt: Date
  metadata: Record<string, any>
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon?: string
  points: number
  rarity: AchievementRarity
  earnedAt?: Date
  metadata: Record<string, any>
}

export interface AchievementDefinition {
  achievementId: string
  name: string
  description: string
  category: AchievementCategory
  icon?: string
  points: number
  requirements: Record<string, any>
  rarity: AchievementRarity
  enabled: boolean
}

export interface MetricsCorrelation {
  actionType: string
  actionId?: string
  metricType: 'ranking_improvement' | 'traffic_gain' | 'backlink_count'
  metricValue: number
  metricUnit: string
  measuredAt: Date
  correlationWindowDays: number
  metadata: Record<string, any>
}

export interface SEOProgress {
  onboarding: {
    completed: string[]
    pending: string[]
    percentage: number
  }
  skills: Record<SkillCategory, Skill>
  achievements: Achievement[]
  metrics: {
    contentCreated: number
    keywordsRanking: number
    linksBuilt: number
    trafficGrowth: string
  }
}

