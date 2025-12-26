// Workflow Engine Types

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export type AgentRole = 'research' | 'strategy' | 'content' | 'qa' | 'orchestrator' | 'seo_manager'

export interface WorkflowTool {
  name: string
  params?: Record<string, any>
  required?: boolean
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  agent: AgentRole
  tools: WorkflowTool[]
  parallel: boolean // Execute tools in parallel
  dependencies?: string[] // Step IDs that must complete first
  systemPrompt?: string // Custom prompt for this step
  outputFormat?: 'text' | 'json' | 'component' | 'structured'
  componentType?: string // For generative UI
}

export interface WorkflowStepResult {
  stepId: string
  status: WorkflowStepStatus
  data?: any
  error?: string
  toolResults?: Record<string, any>
  startTime?: number
  endTime?: number
  duration?: number
}

export interface Workflow {
  id: string
  name: string
  description: string
  icon: string
  category: 'seo' | 'content' | 'research' | 'analysis' | 'aeo' | 'local'
  estimatedTime: string
  steps: WorkflowStep[]
  tags: string[]
  requiredTools?: string[] // Tools that must be available
  requiredAPIs?: string[] // External APIs needed (jina, perplexity)
  // Optional parameter metadata for workflow execution
  parameters?: Record<
    string,
    {
      type: string
      description?: string
      required?: boolean
      example?: any
    }
  >
  // Optional structured output metadata for generative UI
  output?: {
    type: 'text' | 'json' | 'component' | 'structured'
    components?: string[]
  }
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  conversationId: string
  userId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
  currentStep?: string
  stepResults: WorkflowStepResult[]
  startTime: number
  endTime?: number
  metadata?: Record<string, any>
  errorMessage?: string
  workflowState?: Record<string, any>
  checkpointData?: Record<string, any>
}

export interface WorkflowContext {
  userQuery: string
  conversationHistory?: any[]
  previousStepResults?: Record<string, any>
  userPreferences?: Record<string, any>
  cache?: Map<string, any>
}

// Parallel execution batch
export interface ToolBatch {
  tools: WorkflowTool[]
  maxConcurrency?: number
  timeout?: number
}

// Tool execution result
export interface ToolExecutionResult {
  toolName: string
  success: boolean
  data?: any
  error?: string
  cached?: boolean
  duration: number
}

