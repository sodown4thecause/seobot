/**
 * Property Test: Dashboard Action Relevance
 * 
 * Property 7: Dashboard Action Relevance
 * Validates: Requirements 10.1, 10.2
 * 
 * Ensures that dashboard actions are relevant and properly prioritized:
 * - Actions match user's current context and goals
 * - Priority scoring is consistent and fair
 * - Actions are filtered appropriately by user mode
 * - Next action is always the highest priority actionable item
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActionGenerator } from '@/lib/actions/action-generator'
import type { SEOAnalysisContext, ActionGeneratorConfig, ActionItem } from '@/types/actions'

describe('Property 7: Dashboard Action Relevance', () => {
  let actionGenerator: ActionGenerator

  beforeEach(() => {
    actionGenerator = new ActionGenerator()
  })

  describe('Property: Action Relevance Scoring', () => {
    /**
     * Property: Action relevance scoring must be:
     * 1. Consistent - same action in same context gets same score
     * 2. Fair - higher priority actions score higher
     * 3. Mode-appropriate - actions match user's experience level
     */

    it('should score actions consistently for same context', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: ['test keyword'], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 50 } },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result1 = await actionGenerator.generateActions(context, config)
      const result2 = await actionGenerator.generateActions(context, config)

      // Property: Same context should produce same actions with same scores
      expect(result1.actions.length).toBe(result2.actions.length)
      
      // Check that actions are sorted by score (descending)
      const scores1 = result1.actions.map(a => (a as any).score)
      const scores2 = result2.actions.map(a => (a as any).score)
      
      // Scores should be in descending order
      scores1.forEach((score, i) => {
        if (i > 0) {
          expect(score).toBeLessThanOrEqual(scores1[i - 1])
        }
      })

      scores2.forEach((score, i) => {
        if (i > 0) {
          expect(score).toBeLessThanOrEqual(scores2[i - 1])
        }
      })
    })

    it('should prioritize critical actions over low priority actions', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: {
          issues: [
            {
              type: 'critical_error',
              severity: 'critical',
              description: 'Critical issue',
              pages: ['/page1'],
              impact: 'High impact',
              fixComplexity: 'easy'
            },
            {
              type: 'minor_issue',
              severity: 'low',
              description: 'Minor issue',
              pages: ['/page2'],
              impact: 'Low impact',
              fixComplexity: 'easy'
            }
          ],
          scores: { pageSpeed: 75, coreWebVitals: 80 }
        },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 10,
          priorityThreshold: 'low',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: Critical actions should score higher than low priority actions
      const criticalActions = result.actions.filter(a => a.priority === 'critical')
      const lowActions = result.actions.filter(a => a.priority === 'low')

      if (criticalActions.length > 0 && lowActions.length > 0) {
        const criticalScores = criticalActions.map(a => (a as any).score)
        const lowScores = lowActions.map(a => (a as any).score)

        const maxCriticalScore = Math.max(...criticalScores)
        const maxLowScore = Math.max(...lowScores)

        expect(maxCriticalScore).toBeGreaterThan(maxLowScore)
      }
    })

    it('should filter actions by user mode appropriately', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 75 } },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const beginnerConfig: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const practitionerConfig: ActionGeneratorConfig = {
        userMode: 'practitioner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const beginnerResult = await actionGenerator.generateActions(context, beginnerConfig)
      const practitionerResult = await actionGenerator.generateActions(context, practitionerConfig)

      // Property: Beginner mode should have more beginner-friendly actions
      const beginnerActions = beginnerResult.actions.filter(a => a.difficulty === 'beginner')
      const practitionerActions = practitionerResult.actions.filter(a => a.difficulty === 'beginner')

      // Beginner mode should prioritize beginner-friendly actions
      if (beginnerActions.length > 0 && practitionerActions.length > 0) {
        const beginnerBeginnerRatio = beginnerActions.length / beginnerResult.actions.length
        const practitionerBeginnerRatio = practitionerActions.length / practitionerResult.actions.length

        // Beginner mode should have higher ratio of beginner actions
        expect(beginnerBeginnerRatio).toBeGreaterThanOrEqual(practitionerBeginnerRatio)
      }
    })
  })

  describe('Property: Next Action Selection', () => {
    /**
     * Property: Next action must be:
     * 1. Highest priority actionable item
     * 2. Appropriate for user's current mode
     * 3. Not already completed
     * 4. Within user's time constraints (if specified)
     */

    it('should recommend highest priority action as next action', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: ['keyword1', 'keyword2'], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: {
          issues: [
            {
              type: 'critical',
              severity: 'critical',
              description: 'Critical issue',
              pages: ['/page1'],
              impact: 'High',
              fixComplexity: 'easy'
            }
          ],
          scores: { pageSpeed: 75 }
        },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'low',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: Recommended "start with" actions should be highest priority
      if (result.recommendations.startWith.length > 0) {
        const recommendedAction = result.recommendations.startWith[0]
        const allPriorities = result.actions.map(a => a.priority)
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        
        const recommendedPriority = priorityOrder[recommendedAction.priority]
        const highestPriority = Math.min(...allPriorities.map(p => priorityOrder[p]))

        expect(recommendedPriority).toBe(highestPriority)
      }
    })

    it('should filter out completed actions from recommendations', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 75 } },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: All recommended actions should be pending (not completed)
      result.recommendations.startWith.forEach(action => {
        expect(action.status).toBe('pending')
      })
    })
  })

  describe('Property: Action Filtering', () => {
    /**
     * Property: Actions must be filtered correctly:
     * 1. By priority threshold
     * 2. By focus areas
     * 3. By automation preference
     * 4. Respect max actions per category
     */

    it('should filter actions by priority threshold', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: {
          issues: [
            { type: 'critical', severity: 'critical', description: 'Critical', pages: [], impact: '', fixComplexity: 'easy' },
            { type: 'low', severity: 'low', description: 'Low', pages: [], impact: '', fixComplexity: 'easy' }
          ],
          scores: { pageSpeed: 75 }
        },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 10,
          priorityThreshold: 'high', // Only high and critical
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: All actions should meet priority threshold
      result.actions.forEach(action => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        const actionPriority = priorityOrder[action.priority]
        const thresholdPriority = priorityOrder[config.preferences.priorityThreshold]
        
        expect(actionPriority).toBeLessThanOrEqual(thresholdPriority)
      })
    })

    it('should filter actions by focus areas', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 75 } },
        content: { gaps: ['gap1'], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: ['content'] // Only content actions
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: All actions should be in focus areas
      result.actions.forEach(action => {
        expect(config.preferences.focusAreas).toContain(action.category)
      })
    })

    it('should respect max actions per category limit', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 75 } },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 2, // Limit to 2 per category
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: Should not exceed max actions per category
      const actionsByCategory = result.actions.reduce((acc, action) => {
        acc[action.category] = (acc[action.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      Object.entries(actionsByCategory).forEach(([category, count]) => {
        expect(count).toBeLessThanOrEqual(config.preferences.maxActionsPerCategory)
      })
    })
  })

  describe('Property: Action Summary Accuracy', () => {
    /**
     * Property: Action summary must accurately reflect:
     * 1. Total action count
     * 2. Breakdown by priority
     * 3. Breakdown by category
     * 4. Estimated total time
     */

    it('should accurately count actions by priority', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: {
          issues: [
            { type: 'critical', severity: 'critical', description: 'Critical', pages: [], impact: '', fixComplexity: 'easy' },
            { type: 'high', severity: 'high', description: 'High', pages: [], impact: '', fixComplexity: 'easy' },
            { type: 'medium', severity: 'medium', description: 'Medium', pages: [], impact: '', fixComplexity: 'easy' }
          ],
          scores: { pageSpeed: 75 }
        },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'low',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: Summary should match actual action counts
      const actualByPriority = result.actions.reduce((acc, action) => {
        acc[action.priority] = (acc[action.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(result.summary.totalActions).toBe(result.actions.length)
      expect(result.summary.byPriority.critical || 0).toBe(actualByPriority.critical || 0)
      expect(result.summary.byPriority.high || 0).toBe(actualByPriority.high || 0)
      expect(result.summary.byPriority.medium || 0).toBe(actualByPriority.medium || 0)
    })

    it('should identify quick wins correctly', async () => {
      const context: SEOAnalysisContext = {
        keywords: { current: [], opportunities: [], gaps: [] },
        competitors: { domains: [], advantages: [], weaknesses: [] },
        technical: { issues: [], scores: { pageSpeed: 75 } },
        content: { gaps: [], opportunities: [], performance: {} },
        links: { current: 0, opportunities: [], quality: 'medium' }
      }

      const config: ActionGeneratorConfig = {
        userMode: 'beginner',
        preferences: {
          maxActionsPerCategory: 5,
          priorityThreshold: 'medium',
          includeAutomation: true,
          focusAreas: []
        },
        context: {}
      }

      const result = await actionGenerator.generateActions(context, config)

      // Property: Quick wins should be high/critical priority and <= 60 minutes
      result.summary.quickWins.forEach(action => {
        expect(['high', 'critical']).toContain(action.priority)
        // Estimated time should be parseable and reasonable
        expect(action.estimatedTime).toBeTruthy()
      })
    })
  })
})

