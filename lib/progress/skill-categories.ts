/**
 * Skill Categories and Definitions
 * Defines the SEO skill taxonomy and XP requirements
 */

import type { SkillCategory } from './types'

export interface SkillCategoryDefinition {
  category: SkillCategory
  name: string
  description: string
  icon?: string
  baseXpPerLevel: number
  xpMultiplier: number // Multiplier for exponential leveling
}

export const SKILL_CATEGORIES: SkillCategoryDefinition[] = [
  {
    category: 'keywordResearch',
    name: 'Keyword Research',
    description: 'Finding and analyzing keyword opportunities',
    baseXpPerLevel: 100,
    xpMultiplier: 1.5
  },
  {
    category: 'contentCreation',
    name: 'Content Creation',
    description: 'Creating SEO-optimized content',
    baseXpPerLevel: 100,
    xpMultiplier: 1.5
  },
  {
    category: 'technicalSEO',
    name: 'Technical SEO',
    description: 'Site optimization and technical fixes',
    baseXpPerLevel: 100,
    xpMultiplier: 1.5
  },
  {
    category: 'linkBuilding',
    name: 'Link Building',
    description: 'Building quality backlinks',
    baseXpPerLevel: 100,
    xpMultiplier: 1.5
  },
  {
    category: 'localSEO',
    name: 'Local SEO',
    description: 'Local search optimization',
    baseXpPerLevel: 100,
    xpMultiplier: 1.5
  }
]

export function getSkillCategoryDefinition(category: SkillCategory): SkillCategoryDefinition {
  return SKILL_CATEGORIES.find(s => s.category === category) || SKILL_CATEGORIES[0]
}

export function calculateXpForNextLevel(level: number, baseXp: number, multiplier: number): number {
  return Math.floor(baseXp * Math.pow(multiplier, level - 1))
}

