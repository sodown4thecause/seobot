/**
 * Workflow Recovery
 * Handles workflow failure recovery and resumption
 */

import { workflowPersistence } from './persistence'
import type { WorkflowExecution, WorkflowStep } from './types'

export class WorkflowRecovery {
  /**
   * Recover failed workflow execution
   */
  async recoverExecution(executionId: string): Promise<{
    canRecover: boolean
    lastSuccessfulStep?: string
    checkpointData?: Record<string, any>
  }> {
    const execution = await workflowPersistence.loadExecution(executionId)
    
    if (!execution) {
      return { canRecover: false }
    }

    if (execution.status !== 'failed' && execution.status !== 'paused') {
      return { canRecover: false }
    }

    // Find last successful step
    const successfulSteps = execution.stepResults.filter(
      result => result.status === 'completed'
    )

    if (successfulSteps.length === 0) {
      return { canRecover: false }
    }

    const lastSuccessfulStep = successfulSteps[successfulSteps.length - 1]
    const checkpointData = execution.checkpointData || execution.workflowState

    return {
      canRecover: true,
      lastSuccessfulStep: lastSuccessfulStep.stepId,
      checkpointData
    }
  }

  /**
   * Resume workflow from last checkpoint
   */
  async resumeWorkflow(executionId: string): Promise<Record<string, any> | null> {
    const recovery = await this.recoverExecution(executionId)
    
    if (!recovery.canRecover) {
      return null
    }

    return await workflowPersistence.resumeFromCheckpoint(executionId)
  }

  /**
   * Get steps to retry after failure
   */
  getStepsToRetry(
    workflowSteps: WorkflowStep[],
    execution: WorkflowExecution
  ): WorkflowStep[] {
    const completedStepIds = new Set(
      execution.stepResults
        .filter(r => r.status === 'completed')
        .map(r => r.stepId)
    )

    // Find first incomplete step
    const firstIncompleteIndex = workflowSteps.findIndex(
      step => !completedStepIds.has(step.id)
    )

    if (firstIncompleteIndex === -1) {
      return [] // All steps completed
    }

    return workflowSteps.slice(firstIncompleteIndex)
  }
}

export const workflowRecovery = new WorkflowRecovery()

