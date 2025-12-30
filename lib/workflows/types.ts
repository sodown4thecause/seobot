/**
 * Workflow Types
 * TODO: Re-implement with Drizzle ORM
 */

export interface Workflow {
  id: string
  name: string
  steps: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  name: string
  tools: WorkflowTool[]
  parallel?: boolean
}

export interface WorkflowTool {
  id: string
  name: string
}

export interface WorkflowStepResult {
  id: string
  status: WorkflowStepStatus
  toolResults?: Record<string, any>
}

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowExecution {
  id: string
  workflowId: string
  conversationId: string
  userId: string
  status: 'running' | 'completed' | 'failed'
  stepResults: WorkflowStepResult[]
  startTime: number
  endTime?: number
  currentStep?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface WorkflowContext {
  previousStepResults: Record<string, Record<string, any>>
}

export interface ToolExecutionResult {
  toolId: string
  status: 'success' | 'failure'
  result?: any
  error?: string
}
