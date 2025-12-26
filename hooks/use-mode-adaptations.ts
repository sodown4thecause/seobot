'use client'

import { useMemo } from 'react'
import { useUserMode } from '@/components/providers/user-mode-provider'
import { UserModeLevel } from '@/types/user-mode'

/**
 * Hook for mode-specific UI adaptations
 * Provides utilities for adapting UI based on current user mode
 */
export function useModeAdaptations() {
  const { state } = useUserMode()
  const currentMode = state.currentMode

  // UI density and spacing adaptations
  const uiAdaptations = useMemo(() => {
    if (!currentMode) {
      return {
        density: 'comfortable' as const,
        spacing: 'normal' as const,
        complexity: 'medium' as const
      }
    }

    const densityMap = {
      beginner: 'spacious' as const,
      practitioner: 'comfortable' as const,
      agency: 'compact' as const
    }

    const spacingMap = {
      beginner: 'loose' as const,
      practitioner: 'normal' as const,
      agency: 'tight' as const
    }

    const complexityMap = {
      beginner: 'low' as const,
      practitioner: 'medium' as const,
      agency: 'high' as const
    }

    return {
      density: densityMap[currentMode.level],
      spacing: spacingMap[currentMode.level],
      complexity: complexityMap[currentMode.level]
    }
  }, [currentMode?.level])

  // CSS classes for different UI elements
  const getAdaptiveClasses = useMemo(() => {
    return {
      // Container spacing
      container: {
        spacious: 'p-8 space-y-8',
        comfortable: 'p-6 space-y-6',
        compact: 'p-4 space-y-4'
      }[uiAdaptations.density],

      // Card spacing
      card: {
        spacious: 'p-6 space-y-4',
        comfortable: 'p-4 space-y-3',
        compact: 'p-3 space-y-2'
      }[uiAdaptations.density],

      // Button sizes
      button: {
        spacious: 'px-6 py-3 text-base',
        comfortable: 'px-4 py-2 text-sm',
        compact: 'px-3 py-1.5 text-xs'
      }[uiAdaptations.density],

      // Text sizes
      heading: {
        spacious: 'text-3xl font-bold',
        comfortable: 'text-2xl font-semibold',
        compact: 'text-xl font-medium'
      }[uiAdaptations.density],

      subheading: {
        spacious: 'text-xl font-semibold',
        comfortable: 'text-lg font-medium',
        compact: 'text-base font-medium'
      }[uiAdaptations.density],

      body: {
        spacious: 'text-base leading-relaxed',
        comfortable: 'text-sm leading-normal',
        compact: 'text-xs leading-tight'
      }[uiAdaptations.density],

      // Grid layouts
      grid: {
        spacious: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        comfortable: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
        compact: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'
      }[uiAdaptations.density]
    }
  }, [uiAdaptations.density])

  // Feature visibility based on mode
  const shouldShowFeature = useMemo(() => {
    return (featureKey: string): boolean => {
      if (!currentMode) return true

      const featureVisibility: Record<string, UserModeLevel[]> = {
        // Beginner-only features
        'tutorials': ['beginner'],
        'progress-tracking': ['beginner', 'practitioner'],
        'jargon-tooltips': ['beginner', 'practitioner'],
        
        // Practitioner and above
        'advanced-analytics': ['practitioner', 'agency'],
        'competitor-analysis': ['practitioner', 'agency'],
        'technical-seo': ['practitioner', 'agency'],
        
        // Agency-only features
        'white-labeling': ['agency'],
        'multi-client': ['agency'],
        'api-access': ['agency'],
        'team-management': ['agency'],
        
        // Batch operations
        'bulk-operations': ['practitioner', 'agency'],
        'batch-export': ['practitioner', 'agency'],
        
        // Advanced workflows
        'custom-workflows': ['practitioner', 'agency'],
        'automation': ['agency']
      }

      const allowedModes = featureVisibility[featureKey]
      return !allowedModes || allowedModes.includes(currentMode.level)
    }
  }, [currentMode?.level])

  // Data complexity adaptations
  const getDataComplexity = useMemo(() => {
    return {
      // Chart complexity
      charts: {
        beginner: 'simple', // Basic line/bar charts
        practitioner: 'detailed', // Multiple series, comparisons
        agency: 'advanced' // Complex dashboards, custom metrics
      }[currentMode?.level || 'beginner'],

      // Table complexity
      tables: {
        beginner: 'basic', // 3-5 columns, simple data
        practitioner: 'standard', // 5-8 columns, sorting/filtering
        agency: 'advanced' // 10+ columns, advanced filtering, grouping
      }[currentMode?.level || 'beginner'],

      // Metrics shown
      metrics: {
        beginner: 'essential', // 3-4 key metrics
        practitioner: 'comprehensive', // 8-10 metrics
        agency: 'complete' // All available metrics
      }[currentMode?.level || 'beginner']
    }
  }, [currentMode?.level])

  // Workflow complexity
  const getWorkflowComplexity = useMemo(() => {
    if (!currentMode) return 'guided'
    
    return {
      beginner: 'guided', // Step-by-step, linear workflows
      practitioner: 'flexible', // Some customization, branching paths
      agency: 'expert' // Full customization, parallel workflows
    }[currentMode.level]
  }, [currentMode?.level])

  // Help and guidance level
  const getHelpLevel = useMemo(() => {
    if (!currentMode) return 'detailed'
    
    return {
      beginner: 'detailed', // Extensive help, explanations, examples
      practitioner: 'contextual', // Tooltips, contextual help
      agency: 'minimal' // Minimal help, assume expertise
    }[currentMode.level]
  }, [currentMode?.level])

  return {
    // Current mode info
    currentMode: currentMode?.level || null,
    preferences: currentMode?.preferences || null,
    featureAccess: currentMode?.featureAccess || null,
    
    // UI adaptations
    uiAdaptations,
    classes: getAdaptiveClasses,
    
    // Feature visibility
    shouldShowFeature,
    
    // Complexity levels
    dataComplexity: getDataComplexity,
    workflowComplexity: getWorkflowComplexity,
    helpLevel: getHelpLevel,
    
    // Utility functions
    isMode: (mode: UserModeLevel) => currentMode?.level === mode,
    isModeOrAbove: (mode: UserModeLevel) => {
      if (!currentMode) return false
      const hierarchy = ['beginner', 'practitioner', 'agency']
      const currentIndex = hierarchy.indexOf(currentMode.level)
      const targetIndex = hierarchy.indexOf(mode)
      return currentIndex >= targetIndex
    },
    
    // Loading state
    isLoading: state.isLoading
  }
}