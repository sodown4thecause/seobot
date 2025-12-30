/**
 * Workflow Registry
 * TODO: Re-implement with Drizzle ORM
 */

import type { Workflow } from './types'

/**
 * Register a new workflow
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export function registerWorkflow(workflow: Workflow): void {
  console.log('[Workflows] Workflow registration disabled during NextPhase migration:', workflow.name)
}

/**
 * Get a registered workflow
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export function getWorkflow(workflowId: string): Workflow | null {
  console.warn('[Workflows] Workflow retrieval disabled during NextPhase migration')
  return null
}

/**
 * List all registered workflows
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export function listWorkflows(): Workflow[] {
  return []
}

/**
 * Alias for listWorkflows for compatibility
 * @deprecated Workflows are temporarily disabled during NextPhase migration
 */
export function getAllWorkflows(): Workflow[] {
  return listWorkflows()
}
