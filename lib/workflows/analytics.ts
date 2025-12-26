/**
 * Workflow Analytics
 * Records and analyzes workflow performance
 */

import { createClient } from '@/lib/supabase/client'

export interface WorkflowAnalytics {
  workflowId: string
  executionId: string
  userId: string
  durationMs: number
  stepsCompleted: number
  stepsTotal: number
  toolsExecuted: string[]
  success: boolean
  errorType?: string
  performanceMetrics: Record<string, any>
}

export class WorkflowAnalyticsService {
  private supabase = createClient()

  /**
   * Record workflow execution (simplified version for engine.ts)
   */
  recordWorkflowExecution(
    workflowId: string,
    durationMs: number,
    success: boolean,
    toolResults: Record<string, unknown>
  ): void {
    // Fire and forget - don't block workflow execution
    this.recordExecution({
      workflowId,
      executionId: `exec-${Date.now()}`,
      userId: 'system',
      durationMs,
      stepsCompleted: 0,
      stepsTotal: 0,
      toolsExecuted: Object.keys(toolResults),
      success,
      performanceMetrics: toolResults
    }).catch(err => console.error('Failed to record workflow execution:', err))
  }

  /**
   * Record tool execution metrics
   */
  recordToolExecution(
    toolName: string,
    durationMs: number,
    success: boolean,
    cached: boolean
  ): void {
    // Fire and forget - just log for now
    console.log(`[Analytics] Tool ${toolName}: ${durationMs}ms, success=${success}, cached=${cached}`)
  }

  /**
   * Record workflow execution analytics
   */
  async recordExecution(analytics: WorkflowAnalytics): Promise<void> {
    const { error } = await this.supabase.rpc('record_workflow_analytics', {
      p_workflow_id: analytics.workflowId,
      p_execution_id: analytics.executionId,
      p_user_id: analytics.userId,
      p_duration_ms: analytics.durationMs,
      p_steps_completed: analytics.stepsCompleted,
      p_steps_total: analytics.stepsTotal,
      p_tools_executed: analytics.toolsExecuted,
      p_success: analytics.success,
      p_error_type: analytics.errorType || null,
      p_performance_metrics: analytics.performanceMetrics
    })

    if (error) {
      console.error('Failed to record workflow analytics:', error)
    }
  }

  /**
   * Get workflow performance metrics
   */
  async getWorkflowMetrics(workflowId: string): Promise<{
    averageDuration: number
    successRate: number
    totalExecutions: number
    averageStepsCompleted: number
  }> {
    const { data, error } = await this.supabase
      .from('workflow_analytics')
      .select('duration_ms, success, steps_completed, steps_total')
      .eq('workflow_id', workflowId)

    if (error || !data || data.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalExecutions: 0,
        averageStepsCompleted: 0
      }
    }

    const totalExecutions = data.length
    const successfulExecutions = data.filter((a: { success: boolean }) => a.success).length
    const averageDuration = data.reduce((sum: number, a: { duration_ms?: number }) => sum + (a.duration_ms || 0), 0) / totalExecutions
    const averageStepsCompleted = data.reduce((sum: number, a: { steps_completed?: number }) => sum + (a.steps_completed || 0), 0) / totalExecutions

    return {
      averageDuration,
      successRate: (successfulExecutions / totalExecutions) * 100,
      totalExecutions,
      averageStepsCompleted
    }
  }

  /**
   * Get summary statistics
   */
  getSummaryStats() {
    return {
      totalWorkflows: 0,
      totalExecutions: 0,
      averageDuration: 0,
      successRate: 0,
      timestamp: Date.now()
    }
  }

  /**
   * Get all tool metrics
   */
  getAllToolMetrics() {
    return []
  }

  /**
   * Get top performing tools
   */
  getTopPerformingTools(_limit: number = 10) {
    return []
  }

  /**
   * Get slowest tools
   */
  getSlowestTools(_limit: number = 10) {
    return []
  }

  /**
   * Get best cached tools
   */
  getBestCachedTools(_limit: number = 10) {
    return []
  }

  /**
   * Get metrics for a specific tool
   */
  getToolMetrics(_toolName: string) {
    return null
  }
}

export const workflowAnalytics = new WorkflowAnalyticsService()

// Alias for backward compatibility with engine.ts import
export const analytics = workflowAnalytics

