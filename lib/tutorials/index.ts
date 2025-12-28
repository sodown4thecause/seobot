/**
 * Tutorial System
 * Main export for tutorial functionality
 */

export * from './types'
// Note: progress-service and milestone-service are server-only
// Import them directly from their files when needed in server components/routes
export { seoFundamentalsTutorial } from './data/seo-fundamentals'
export { aeoGettingCitedTutorial } from './data/aeo-getting-cited'
export { technicalSEOBasicsTutorial } from './data/technical-seo-basics'
export { linkBuildingFundamentalsTutorial } from './data/link-building-fundamentals'
export { localSEOGuideTutorial } from './data/local-seo-guide'
export { contentOptimization101Tutorial } from './data/content-optimization-101'
export { aeoAdvancedTutorial } from './data/aeo-advanced'

// Tutorial registry
import { seoFundamentalsTutorial } from './data/seo-fundamentals'
import { aeoGettingCitedTutorial } from './data/aeo-getting-cited'
import { technicalSEOBasicsTutorial } from './data/technical-seo-basics'
import { linkBuildingFundamentalsTutorial } from './data/link-building-fundamentals'
import { localSEOGuideTutorial } from './data/local-seo-guide'
import { contentOptimization101Tutorial } from './data/content-optimization-101'
import { aeoAdvancedTutorial } from './data/aeo-advanced'
import type { Tutorial } from './types'

export const TUTORIAL_REGISTRY: Tutorial[] = [
  seoFundamentalsTutorial,
  aeoGettingCitedTutorial,
  technicalSEOBasicsTutorial,
  linkBuildingFundamentalsTutorial,
  localSEOGuideTutorial,
  contentOptimization101Tutorial,
  aeoAdvancedTutorial,
]

export function getTutorialById(id: string): Tutorial | undefined {
  return TUTORIAL_REGISTRY.find(t => t.id === id && t.enabled)
}

export function getTutorialsByDifficulty(difficulty: Tutorial['difficulty']): Tutorial[] {
  return TUTORIAL_REGISTRY.filter(t => t.difficulty === difficulty && t.enabled)
}

export function getAvailableTutorials(completedIds: string[] = []): Tutorial[] {
  return TUTORIAL_REGISTRY.filter(tutorial => {
    if (!tutorial.enabled) return false
    // Check prerequisites
    return tutorial.prerequisites.every(prereq => completedIds.includes(prereq))
  })
}

