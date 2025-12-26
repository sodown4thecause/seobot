/**
 * Tutorial System Types
 * Types for interactive tutorial system with step-by-step guidance
 */

export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type TutorialStepAction = 
  | 'EXPLAIN' 
  | 'TOOL_DEMO' 
  | 'QUIZ' 
  | 'PRACTICE' 
  | 'REVIEW'

export interface TutorialStep {
  id: string
  title: string
  content: string
  action: TutorialStepAction
  interactive?: {
    question?: string
    options?: string[]
    correct?: string | number
    explanation?: string
  }
  tool?: string // Tool to demonstrate
  highlightParams?: string[] // Parameters to highlight in tool demo
  liveDemo?: boolean // Actually runs the tool
  estimatedTime?: string
}

export interface TutorialOutcome {
  concept: string
  skillGained: string
  realWorldApplication: string
}

export interface Tutorial {
  id: string
  title: string
  description?: string
  difficulty: TutorialDifficulty
  estimatedTime: string
  prerequisites: string[] // Tutorial IDs that should be completed first
  steps: TutorialStep[]
  outcomes: TutorialOutcome[]
  linkedWorkflow?: string // Optional workflow ID this tutorial links to
  enabled: boolean
}

export interface TutorialProgress {
  tutorialId: string
  currentStepIndex: number
  completedSteps: string[] // Step IDs
  startedAt: Date
  completedAt?: Date
  lastAccessedAt: Date
  metadata: Record<string, any>
}

export interface TutorialStepCompletion {
  stepId: string
  stepIndex: number
  completedAt: Date
  quizScore?: number
  demoExecuted: boolean
  timeSpentSeconds?: number
  metadata: Record<string, any>
}

export interface TutorialMilestone {
  milestoneType: 'tutorial_completed' | 'step_completed' | 'quiz_perfect'
  tutorialId?: string
  stepId?: string
  achievedAt: Date
  metadata: Record<string, any>
}

