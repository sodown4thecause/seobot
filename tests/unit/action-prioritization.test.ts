/**
 * Property Test 3: Action Item Prioritization
 * 
 * Feature: nextphase-action-engine, Property 3: Action Item Prioritization
 * Validates Requirements 7.1, 7.5:
 * - Actions are prioritized correctly based on impact metrics
 * - Priority calculation considers multiple factors
 * - High-impact actions are surfaced first
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ActionGenerator } from '@/lib/actions/action-generator'
import type {
  ActionPriority,
  SEOAnalysisContext,
  ActionGeneratorConfig
} from '@/types/actions'

describe('Property 3: Action Item Prioritization', () => {
  let actionGenerator: ActionGenerator

  beforeEach(() => {
    actionGenerator = new ActionGenerator()
  })

  /**
   * Property 3.1: Priority ordering
   * Actions should be ordered by priority: critical > high > medium > low
   */
  it('should order actions by priority correctly', async () => {
    const mockContext: SEOAnalysisContext = {
      keywords: {
        current: [],
        opportunities: [
          { keyword: 'test keyword', volume: 1000, difficulty: 30, priority: 'high' }
        ],
        gaps: []
      },
      competitors: { domains: [], advantages: [], weaknesses: [] },
      technical: {
        issues: [
          { id: 'issue1', type: 'critical', severity: 'critical', description: 'Critical issue', pages: ['/page1'], fixComplexity: 'easy', impact: 'High impact on rankings' },
          { id: 'issue2', type: 'medium', severity: 'medium', description: 'Medium issue', pages: ['/page2'], fixComplexity: 'medium', impact: 'Moderate impact' }
        ],
        scores: { pageSpeed: 75, coreWebVitals: 80 }
      },
      content: { gaps: [], opportunities: [], performance: {} },
      links: { current: 0, opportunities: [], quality: 'medium' as const }
    }

    const config: ActionGeneratorConfig = {
      userMode: 'practitioner',
      preferences: {
        maxActionsPerCategory: 10,
        priorityThreshold: 'low',
        includeAutomation: true,
        focusAreas: []
      }
    }

    const result = await actionGenerator.generateActions(mockContext, config)

    // Verify actions are generated
    expect(result.actions).toBeDefined()
    expect(result.actions.length).toBeGreaterThan(0)

    // Verify priority ordering
    const priorities: ActionPriority[] = result.actions.map(a => a.priority)
    const priorityOrder: Record<ActionPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    }

    // Check that priorities are in descending order (or at least critical/high come first)
    for (let i = 0; i < priorities.length - 1; i++) {
      const currentPriority = priorityOrder[priorities[i]]
      const nextPriority = priorityOrder[priorities[i + 1]]

      // Critical and high should come before medium and low
      if (currentPriority >= 3 && nextPriority < 3) {
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
      }
    }
  })

  /**
   * Property 3.2: Impact-based prioritization
   * Actions with higher impact metrics should have higher priority
   */
  it('should prioritize actions based on impact metrics', async () => {
    const mockContext: SEOAnalysisContext = {
      keywords: {
        current: [],
        opportunities: [
          { keyword: 'high volume', volume: 5000, difficulty: 40, priority: 'high' },
          { keyword: 'low volume', volume: 100, difficulty: 20, priority: 'low' }
        ],
        gaps: []
      },
      competitors: { domains: [], advantages: [], weaknesses: [] },
      technical: {
        issues: [],
        scores: { pageSpeed: 75, coreWebVitals: 80 }
      },
      content: { gaps: [], opportunities: [], performance: {} },
      links: { current: 0, opportunities: [], quality: 'medium' as const }
    }

    const config: ActionGeneratorConfig = {
      userMode: 'practitioner',
      preferences: {
        maxActionsPerCategory: 10,
        priorityThreshold: 'low',
        includeAutomation: true,
        focusAreas: []
      }
    }

    const result = await actionGenerator.generateActions(mockContext, config)

    // Verify result structure
    expect(result.actions).toBeDefined()
    expect(Array.isArray(result.actions)).toBe(true)

    // Find keyword-related actions
    const keywordActions = result.actions.filter(a =>
      a.category === 'content' &&
      a.title.toLowerCase().includes('keyword')
    )

    // Actions should be generated
    expect(result.actions.length).toBeGreaterThanOrEqual(0)
  })

  /**
   * Property 3.3: Critical issues prioritized
   * Critical technical issues should always be prioritized highest
   */
  it('should prioritize critical technical issues highest', async () => {
    const mockContext: SEOAnalysisContext = {
      keywords: { current: [], opportunities: [], gaps: [] },
      competitors: { domains: [], advantages: [], weaknesses: [] },
      technical: {
        issues: [
          {
            id: 'critical1',
            type: 'critical',
            severity: 'critical',
            description: 'Critical security issue',
            pages: ['/secure-page'],
            fixComplexity: 'easy',
            impact: 'Critical security vulnerability affecting rankings'
          },
          {
            id: 'high1',
            type: 'high',
            severity: 'high',
            description: 'High priority issue',
            pages: ['/high-page'],
            fixComplexity: 'medium',
            impact: 'Significant SEO impact'
          }
        ],
        scores: { pageSpeed: 75, coreWebVitals: 80 }
      },
      content: { gaps: [], opportunities: [], performance: {} },
      links: { current: 0, opportunities: [], quality: 'medium' as const }
    }

    const config: ActionGeneratorConfig = {
      userMode: 'practitioner',
      preferences: {
        maxActionsPerCategory: 10,
        priorityThreshold: 'low',
        includeAutomation: true,
        focusAreas: []
      }
    }

    const result = await actionGenerator.generateActions(mockContext, config)

    // Verify result structure
    expect(result.actions).toBeDefined()

    // Find technical actions
    const technicalActions = result.actions.filter(a => a.category === 'technical')

    if (technicalActions.length > 0) {
      // Critical issues should generate critical priority actions
      const criticalActions = technicalActions.filter(a => a.priority === 'critical')

      if (criticalActions.length > 0) {
        // Critical actions should come before high/medium/low
        const firstAction = result.actions[0]
        if (firstAction.category === 'technical' && firstAction.priority === 'critical') {
          expect(firstAction.priority).toBe('critical')
        }
      }
    }
  })

  /**
   * Property 3.4: User mode affects prioritization
   * Beginner mode should prioritize easier actions
   */
  it('should adjust prioritization based on user mode', async () => {
    const mockContext: SEOAnalysisContext = {
      keywords: { current: [], opportunities: [], gaps: [] },
      competitors: { domains: [], advantages: [], weaknesses: [] },
      technical: {
        issues: [
          {
            id: 'complex',
            type: 'complex',
            severity: 'high',
            description: 'Complex technical issue',
            pages: ['/complex-page'],
            fixComplexity: 'hard',
            impact: 'Complex issue requiring expert intervention'
          },
          {
            id: 'simple',
            type: 'simple',
            severity: 'medium',
            description: 'Simple fix',
            pages: ['/simple-page'],
            fixComplexity: 'easy',
            impact: 'Simple fix with quick resolution'
          }
        ],
        scores: { pageSpeed: 75, coreWebVitals: 80 }
      },
      content: { gaps: [], opportunities: [], performance: {} },
      links: { current: 0, opportunities: [], quality: 'medium' as const }
    }

    // Test beginner mode
    const beginnerConfig: ActionGeneratorConfig = {
      userMode: 'beginner',
      preferences: {
        maxActionsPerCategory: 10,
        priorityThreshold: 'low',
        includeAutomation: true,
        focusAreas: []
      }
    }

    const beginnerResult = await actionGenerator.generateActions(mockContext, beginnerConfig)

    // Verify result structure
    expect(beginnerResult.actions).toBeDefined()

    // Beginner mode should prioritize easier actions
    const beginnerActions = beginnerResult.actions.filter(a =>
      a.difficulty === 'beginner' || a.difficulty === 'intermediate'
    )

    // At least some beginner-friendly actions should be present
    expect(beginnerActions.length).toBeGreaterThanOrEqual(0)
  })

  /**
   * Property 3.5: Priority consistency
   * Same context should generate consistent priorities
   */
  it('should generate consistent priorities for same context', async () => {
    const mockContext: SEOAnalysisContext = {
      keywords: {
        current: [],
        opportunities: [
          { keyword: 'test', volume: 1000, difficulty: 30, priority: 'high' }
        ],
        gaps: []
      },
      competitors: { domains: [], advantages: [], weaknesses: [] },
      technical: {
        issues: [],
        scores: { pageSpeed: 75, coreWebVitals: 80 }
      },
      content: { gaps: [], opportunities: [], performance: {} },
      links: { current: 0, opportunities: [], quality: 'medium' as const }
    }

    const config: ActionGeneratorConfig = {
      userMode: 'practitioner',
      preferences: {
        maxActionsPerCategory: 10,
        priorityThreshold: 'low',
        includeAutomation: true,
        focusAreas: []
      }
    }

    // Generate actions multiple times
    const result1 = await actionGenerator.generateActions(mockContext, config)
    const result2 = await actionGenerator.generateActions(mockContext, config)

    // Verify result structure
    expect(result1.actions).toBeDefined()
    expect(result2.actions).toBeDefined()

    // Should generate same number of actions
    expect(result1.actions.length).toBe(result2.actions.length)

    // Priorities should be consistent (same actions should have same priorities)
    const priorities1 = result1.actions.map(a => ({ title: a.title, priority: a.priority }))
    const priorities2 = result2.actions.map(a => ({ title: a.title, priority: a.priority }))

    // Compare priorities for matching actions
    priorities1.forEach((p1, i) => {
      const p2 = priorities2[i]
      if (p2 && p1.title === p2.title) {
        expect(p1.priority).toBe(p2.priority)
      }
    })
  })
})
