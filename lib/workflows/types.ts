/**
 * Workflow Types
 * TODO: Re-implement with Drizzle ORM
 */

export interface Workflow {
  id: string
  name: string
  description?: string
  category?: string
  tags?: string[]
  icon?: string
  estimatedTime?: string
  requiredTools?: string[]
  requiredAPIs?: string[]
  parameters?: Record<string, any>
  output?: Record<string, any>
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  name: string
  description?: string
  agent?: string
  tools: WorkflowTool[]
  parallel?: boolean
  dependencies?: string[]
  systemPrompt?: string
  outputFormat?: 'json' | 'text' | 'component'
  componentType?: string
}

export interface WorkflowTool {
  id?: string
  name: string
  platforms?: string[]
  params?: Record<string, any>
  required?: boolean
}

export interface WorkflowStepResult {
  id?: string
  stepId?: string
  status: WorkflowStepStatus
  toolResults?: Record<string, any>
  error?: string
  startTime?: number
  endTime?: number
  duration?: number
}

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowExecution {
  id: string
  workflowId: string
  conversationId: string
  userId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  stepResults: WorkflowStepResult[]
  startTime: number
  endTime?: number
  currentStep?: string
  errorMessage?: string
  checkpointData?: Record<string, any>
  workflowState?: Record<string, any>
  metadata?: Record<string, any>
}

export interface WorkflowContext {
  previousStepResults: Record<string, Record<string, any>>
  userQuery?: string
  userPreferences?: Record<string, any>
  cache?: Map<string, any>
}

export interface ToolExecutionResult {
  toolId?: string
  toolName?: string
  status?: 'success' | 'failure'
  success?: boolean
  result?: any
  data?: any
  error?: string
  cached?: boolean
  duration?: number
}
