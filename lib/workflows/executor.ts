/**
 * Workflow Executor
 * TODO: Re-implement with Drizzle ORM
 */

import type { Workflow, WorkflowContext, WorkflowExecution } from './types'

/**
 * Execute a workflow
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export async function executeWorkflow(params: {
  workflowId: string
  userQuery: string
  conversationId: string
  userId: string
  parameters?: Record<string, any>
  cache?: Map<string, any>
}): Promise<WorkflowExecution> {
  throw new Error('Workflow execution is temporarily disabled during NextPhase migration')
}

/**
 * Get workflow execution status
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export async function getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null> {
  console.warn('[Workflows] Execution status retrieval disabled during NextPhase migration')
  return null
}

/**
 * Format workflow execution results for display
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export function formatWorkflowResults(execution: WorkflowExecution): any {
  return {
    status: execution.status,
    steps: execution.stepResults.map((step) => ({
      id: step.id,
      status: step.status,
      toolResults: step.toolResults || {},
    })),
  }
}
