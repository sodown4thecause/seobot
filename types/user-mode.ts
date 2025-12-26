/**
 * User Experience Mode System Types
 * 
 * Defines the types and interfaces for the user mode system that adapts
 * the platform experience based on user expertise level.
 */

export type UserModeLevel = 'beginner' | 'practitioner' | 'agency'

export interface UserModePreferences {
  showTutorials: boolean
  jargonTooltips: boolean
  progressTracking: boolean
  batchOperations: boolean
  dataVisualization: 'simple' | 'detailed' | 'advanced'
  workflowComplexity: 'guided' | 'flexible' | 'expert'
}

export interface UserMode {
  level: UserModeLevel
  preferences: UserModePreferences
  capabilities: string[]
  uiDensity: 'compact' | 'comfortable' | 'spacious'
  featureAccess: {
    advancedAnalytics: boolean
    bulkOperations: boolean
    whiteLabeling: boolean
    apiAccess: boolean
    customWorkflows: boolean
  }
}

export interface UserModeConfig {
  id: string
  userId: string
  user_id?: string  // Database uses snake_case
  currentMode: UserModeLevel
  current_mode?: UserModeLevel  // Database uses snake_case
  preferences: UserModePreferences
  customizations: {
    dashboardLayout?: string[]
    hiddenFeatures?: string[]
    pinnedTools?: string[]
  }
  onboardingCompleted: {
    beginner: boolean
    practitioner: boolean
    agency: boolean
  }
  onboarding_completed?: {  // Database uses snake_case
    beginner: boolean
    practitioner: boolean
    agency: boolean
  }
  created_at?: string
  updated_at?: string
}

// Predefined mode configurations
export const USER_MODE_CONFIGS: Record<UserModeLevel, Omit<UserMode, 'level'>> = {
  beginner: {
    preferences: {
      showTutorials: true,
      jargonTooltips: true,
      progressTracking: true,
      batchOperations: false,
      dataVisualization: 'simple',
      workflowComplexity: 'guided'
    },
    capabilities: [
      'basic-keyword-research',
      'content-creation',
      'simple-analytics',
      'guided-workflows'
    ],
    uiDensity: 'spacious',
    featureAccess: {
      advancedAnalytics: false,
      bulkOperations: false,
      whiteLabeling: false,
      apiAccess: false,
      customWorkflows: false
    }
  },
  practitioner: {
    preferences: {
      showTutorials: false,
      jargonTooltips: true,
      progressTracking: true,
      batchOperations: true,
      dataVisualization: 'detailed',
      workflowComplexity: 'flexible'
    },
    capabilities: [
      'advanced-keyword-research',
      'competitor-analysis',
      'content-optimization',
      'technical-seo',
      'link-building',
      'performance-tracking'
    ],
    uiDensity: 'comfortable',
    featureAccess: {
      advancedAnalytics: true,
      bulkOperations: true,
      whiteLabeling: false,
      apiAccess: false,
      customWorkflows: true
    }
  },
  agency: {
    preferences: {
      showTutorials: false,
      jargonTooltips: false,
      progressTracking: false,
      batchOperations: true,
      dataVisualization: 'advanced',
      workflowComplexity: 'expert'
    },
    capabilities: [
      'enterprise-analytics',
      'multi-client-management',
      'white-label-reporting',
      'api-integration',
      'custom-workflows',
      'team-collaboration',
      'advanced-automation'
    ],
    uiDensity: 'compact',
    featureAccess: {
      advancedAnalytics: true,
      bulkOperations: true,
      whiteLabeling: true,
      apiAccess: true,
      customWorkflows: true
    }
  }
}

// Mode transition validation
export interface ModeTransition {
  from: UserModeLevel
  to: UserModeLevel
  requirements?: {
    minimumUsageDays?: number
    completedTutorials?: string[]
    achievedMilestones?: string[]
  }
  dataPreservation: {
    settings: boolean
    workflows: boolean
    content: boolean
  }
}

export const MODE_TRANSITIONS: ModeTransition[] = [
  {
    from: 'beginner',
    to: 'practitioner',
    requirements: {
      minimumUsageDays: 7,
      completedTutorials: ['keyword-research-basics', 'content-creation-101'],
      achievedMilestones: ['first-content-published', 'first-keyword-tracked']
    },
    dataPreservation: {
      settings: true,
      workflows: true,
      content: true
    }
  },
  {
    from: 'practitioner',
    to: 'agency',
    requirements: {
      minimumUsageDays: 30,
      completedTutorials: ['advanced-seo', 'competitor-analysis'],
      achievedMilestones: ['multiple-campaigns', 'client-management']
    },
    dataPreservation: {
      settings: true,
      workflows: true,
      content: true
    }
  },
  // Allow downgrading without requirements
  {
    from: 'practitioner',
    to: 'beginner',
    dataPreservation: {
      settings: true,
      workflows: true,
      content: true
    }
  },
  {
    from: 'agency',
    to: 'practitioner',
    dataPreservation: {
      settings: true,
      workflows: true,
      content: true
    }
  },
  {
    from: 'agency',
    to: 'beginner',
    dataPreservation: {
      settings: true,
      workflows: true,
      content: true
    }
  }
]