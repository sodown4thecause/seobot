/**
 * Workflow Index
 * TODO: Re-implement with Drizzle ORM
 */

export type { Workflow, WorkflowStep, WorkflowExecution, WorkflowContext } from './types'
export { 
  registerWorkflow, 
  getWorkflow, 
  listWorkflows,
  getAllWorkflows,
} from './registry'

// Workflow detection utilities (stub)
export function detectWorkflow(): boolean {
  return false
}

export function isWorkflowRequest(): boolean {
  return false
}

export function extractWorkflowId(): string | null {
  return null
}
