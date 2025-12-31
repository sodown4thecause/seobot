/**
 * Workflow Persistence - Drizzle ORM Implementation
 * Handles saving and restoring workflow state
 */

import { db, userProgress, type Json } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/clerk'
import { eq, and, desc } from 'drizzle-orm'
import type { WorkflowExecution, WorkflowStepResult } from './types'

export class WorkflowPersistence {

  /**
   * Save workflow execution state
   */
  async saveExecution(execution: WorkflowExecution): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    try {
      await db
        .insert(userProgress)
        .values({
          userId: user.id,
          category: 'workflow_execution',
          itemKey: execution.id,
          metadata: {
            id: execution.id,
            workflowId: execution.workflowId,
            conversationId: execution.conversationId,
            status: execution.status,
            currentStep: execution.currentStep,
            stepResults: execution.stepResults,
            workflowState: execution.workflowState || {},
            checkpointData: execution.checkpointData || {},
            startTime: execution.startTime,
            endTime: execution.endTime,
            errorMessage: execution.errorMessage,
            metadata: execution.metadata || {}
          } as unknown as Json
        })
    } catch (error) {
      throw new Error(`Failed to save execution: ${error}`)
    }
  }

  /**
   * Save workflow checkpoint
   */
  async saveCheckpoint(
    executionId: string,
    stepId: string,
    checkpointType: 'step_start' | 'step_complete' | 'manual' | 'error_recovery',
    checkpointData: Record<string, any>
  ): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    try {
      await db
        .insert(userProgress)
        .values({
          userId: user.id,
          category: 'workflow_checkpoint',
          itemKey: `${executionId}:${stepId}`,
          metadata: {
            executionId,
            stepId,
            checkpointType,
            checkpointData
          }
        })
    } catch (error) {
      throw new Error(`Failed to save checkpoint: ${error}`)
    }
  }

  /**
   * Load workflow execution
   */
  async loadExecution(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const [data] = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.category, 'workflow_execution'),
          eq(userProgress.itemKey, executionId)
        ))
        .limit(1)

      if (!data) return null

      const metadata = data.metadata as Record<string, unknown>
      return {
        id: (metadata?.id as string) || executionId,
        workflowId: metadata?.workflowId as string,
        conversationId: metadata?.conversationId as string,
        userId: data.userId,
        status: metadata?.status as WorkflowExecution['status'],
        currentStep: metadata?.currentStep as string | undefined,
        stepResults: (metadata?.stepResults as WorkflowStepResult[]) || [],
        workflowState: (metadata?.workflowState as Record<string, unknown>) || {},
        checkpointData: (metadata?.checkpointData as Record<string, unknown>) || {},
        startTime: (metadata?.startTime as number) || Date.now(),
        endTime: metadata?.endTime as number | undefined,
        errorMessage: metadata?.errorMessage as string | undefined,
        metadata: (metadata?.metadata as Record<string, unknown>) || {}
      }
    } catch (error) {
      console.error('Failed to load execution:', error)
      return null
    }
  }

  /**
   * Resume workflow from checkpoint
   */
  async resumeFromCheckpoint(executionId: string): Promise<Record<string, any> | null> {
    try {
      const [data] = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.category, 'workflow_checkpoint'),
          eq(userProgress.itemKey, executionId)
        ))
        .orderBy(desc(userProgress.completedAt))
        .limit(1)

      if (!data) return null

      const metadata = data.metadata as Record<string, unknown>
      return metadata?.checkpointData as Record<string, any> || null
    } catch (error) {
      console.error('Failed to resume from checkpoint:', error)
      return null
    }
  }

  /**
   * Get user's workflow executions
   */
  async getUserExecutions(userId?: string, limit: number = 50): Promise<WorkflowExecution[]> {
    const user = await getCurrentUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User not authenticated')

    try {
      const data = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, targetUserId),
          eq(userProgress.category, 'workflow_execution')
        ))
        .orderBy(desc(userProgress.completedAt))
        .limit(limit)

      return data.map(item => {
        const metadata = item.metadata as Record<string, unknown>
        return {
          id: (metadata?.id as string) || item.itemKey,
          workflowId: metadata?.workflowId as string,
          conversationId: metadata?.conversationId as string,
          userId: item.userId,
          status: metadata?.status as WorkflowExecution['status'],
          currentStep: metadata?.currentStep as string | undefined,
          stepResults: (metadata?.stepResults as WorkflowStepResult[]) || [],
          workflowState: (metadata?.workflowState as Record<string, unknown>) || {},
          checkpointData: (metadata?.checkpointData as Record<string, unknown>) || {},
          startTime: (metadata?.startTime as number) || Date.now(),
          endTime: metadata?.endTime as number | undefined,
          errorMessage: metadata?.errorMessage as string | undefined,
          metadata: (metadata?.metadata as Record<string, unknown>) || {}
        }
      })
    } catch (error) {
      console.error('Failed to get user executions:', error)
      return []
    }
  }
}

export const workflowPersistence = new WorkflowPersistence()
