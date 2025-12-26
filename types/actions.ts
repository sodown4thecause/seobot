/**
 * Action Generator Framework Types
 * 
 * Defines types for the action-oriented system that provides clear,
 * prioritized, step-by-step actions rather than just data.
 */

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low'
export type ActionCategory = 'content' | 'technical' | 'links' | 'local' | 'aeo' | 'analytics' | 'keywords'
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'
export type ActionDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface ActionStep {
  id: string
  title: string
  description: string
  instructions: string[]
  estimatedTime: string
  tools?: string[]
  resources?: ActionResource[]
  verification?: {
    check: string
    expectedOutcome: string
  }
}

export interface ActionResource {
  type: 'link' | 'tool' | 'template' | 'guide'
  title: string
  url?: string
  description?: string
}

export interface ActionImpact {
  description: string
  metrics: {
    potentialTrafficGain?: number
    rankingImprovement?: string
    competitiveAdvantage?: string
    conversionImpact?: string
    timeToResults?: string
  }
  confidence: 'low' | 'medium' | 'high'
}

export interface ActionItem {
  id: string
  title: string
  description: string
  category: ActionCategory
  priority: ActionPriority
  difficulty: ActionDifficulty
  
  // Impact and metrics
  impact: ActionImpact
  
  // Execution details
  steps: ActionStep[]
  estimatedTime: string
  timeToSeeResults: string
  
  // Automation
  automatable: boolean
  automationTool?: string
  automationInstructions?: string
  
  // Context and targeting
  targetKeywords?: string[]
  targetPages?: string[]
  relatedActions?: string[]
  prerequisites?: string[]
  
  // Verification and tracking
  verification: {
    check: string
    expectedOutcome: string
    successMetrics: string[]
  }
  
  // Metadata
  tags: string[]
  source: 'analysis' | 'audit' | 'competitor' | 'opportunity' | 'manual'
  createdAt: Date
  updatedAt: Date
  
  // User interaction
  status: ActionStatus
  completedAt?: Date
  notes?: string
  feedback?: ActionFeedback
}

export interface ActionFeedback {
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  wasHelpful: boolean
  timeActuallyTaken?: string
  resultsAchieved?: boolean
}

export interface ActionTemplate {
  id: string
  name: string
  description: string
  category: ActionCategory
  difficulty: ActionDifficulty
  
  // Template structure
  titleTemplate: string
  descriptionTemplate: string
  stepsTemplate: ActionStep[]
  
  // Dynamic fields
  variables: ActionVariable[]
  
  // Conditions for when to use this template
  triggers: ActionTrigger[]
  
  // Metadata
  tags: string[]
  usageCount: number
  successRate: number
}

export interface ActionVariable {
  name: string
  type: 'string' | 'number' | 'array' | 'boolean'
  description: string
  required: boolean
  defaultValue?: any
  options?: string[]
}

export interface ActionTrigger {
  type: 'keyword_gap' | 'technical_issue' | 'competitor_advantage' | 'content_opportunity' | 'link_opportunity'
  conditions: Record<string, any>
  weight: number
}

export interface ActionGeneratorConfig {
  userMode: 'beginner' | 'practitioner' | 'agency'
  preferences: {
    maxActionsPerCategory: number
    priorityThreshold: ActionPriority
    includeAutomation: boolean
    timeConstraints?: string
    focusAreas: ActionCategory[]
  }
  context: {
    websiteUrl?: string
    industry?: string
    targetAudience?: string
    businessGoals?: string[]
    currentChallenges?: string[]
  }
}

export interface ActionGeneratorResult {
  actions: ActionItem[]
  summary: {
    totalActions: number
    byPriority: Record<ActionPriority, number>
    byCategory: Record<ActionCategory, number>
    estimatedTotalTime: string
    quickWins: ActionItem[]
    longTermActions: ActionItem[]
  }
  recommendations: {
    startWith: ActionItem[]
    focusAreas: ActionCategory[]
    automationOpportunities: ActionItem[]
  }
}

// Context types for action generation
export interface SEOAnalysisContext {
  keywords: {
    current: string[]
    opportunities: string[]
    gaps: string[]
  }
  competitors: {
    domains: string[]
    advantages: string[]
    weaknesses: string[]
  }
  technical: {
    issues: TechnicalIssue[]
    scores: Record<string, number>
  }
  content: {
    gaps: string[]
    opportunities: string[]
    performance: Record<string, number>
  }
  links: {
    current: number
    opportunities: LinkOpportunity[]
    quality: 'low' | 'medium' | 'high'
  }
}

export interface TechnicalIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  pages: string[]
  impact: string
  fixComplexity: 'easy' | 'medium' | 'hard'
}

export interface LinkOpportunity {
  domain: string
  authority: number
  relevance: number
  difficulty: number
  type: 'guest_post' | 'resource_page' | 'broken_link' | 'competitor_link'
}

// Action execution tracking
export interface ActionExecution {
  actionId: string
  userId: string
  startedAt: Date
  completedAt?: Date
  status: ActionStatus
  progress: number // 0-100
  currentStep: number
  notes: string[]
  timeSpent: number // minutes
  results?: ActionExecutionResult
}

export interface ActionExecutionResult {
  success: boolean
  metricsAchieved: Record<string, number>
  feedback: ActionFeedback
  lessonsLearned?: string[]
  nextRecommendedActions?: string[]
}

// Action context for different scenarios
export interface ActionContext {
  type: 'audit' | 'competitor_analysis' | 'keyword_research' | 'content_gap' | 'technical_review'
  data: any
  timestamp: Date
  source: string
}

// Utility types
export type ActionFilter = {
  categories?: ActionCategory[]
  priorities?: ActionPriority[]
  difficulties?: ActionDifficulty[]
  automatable?: boolean
  timeRange?: string
  status?: ActionStatus[]
}

export type ActionSort = {
  field: 'priority' | 'difficulty' | 'estimatedTime' | 'impact' | 'createdAt'
  direction: 'asc' | 'desc'
}

// Action generator interface
export interface ActionGeneratorInterface {
  // Core generation
  generateActions(context: SEOAnalysisContext, config: ActionGeneratorConfig): Promise<ActionGeneratorResult>
  
  // Template management
  getTemplates(category?: ActionCategory): ActionTemplate[]
  createTemplate(template: Omit<ActionTemplate, 'id' | 'usageCount' | 'successRate'>): ActionTemplate
  
  // Action management
  getActions(filter?: ActionFilter, sort?: ActionSort): ActionItem[]
  updateActionStatus(actionId: string, status: ActionStatus, notes?: string): void
  completeAction(actionId: string, feedback: ActionFeedback): void
  
  // Analytics
  getActionAnalytics(): ActionAnalytics
  getRecommendations(userId: string): ActionItem[]
}

export interface ActionAnalytics {
  totalActions: number
  completionRate: number
  averageTimeToComplete: number
  successRate: number
  topCategories: Array<{ category: ActionCategory; count: number }>
  impactMetrics: {
    trafficIncrease: number
    rankingImprovements: number
    conversionsImproved: number
  }
}