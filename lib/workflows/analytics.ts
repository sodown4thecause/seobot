/**
 * Workflow Analytics
 * Records and analyzes workflow performance
 */

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

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
  private db = db

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
    try {
      // Direct SQL insert for workflow analytics
      await this.db.execute(sql`
        INSERT INTO workflow_analytics (
          workflow_id,
          execution_id,
          user_id,
          duration_ms,
          steps_completed,
          steps_total,
          tools_executed,
          success,
          error_type,
          performance_metrics,
          created_at
        ) VALUES (
          ${analytics.workflowId},
          ${analytics.executionId},
          ${analytics.userId},
          ${analytics.durationMs},
          ${analytics.stepsCompleted},
          ${analytics.stepsTotal},
          ${analytics.toolsExecuted},
          ${analytics.success},
          ${analytics.errorType || null},
          ${JSON.stringify(analytics.performanceMetrics)},
          NOW()
        )
      `)
    } catch (error) {
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
    try {
      const result = await this.db.execute(sql`
        SELECT
          AVG(duration_ms)::float as avg_duration,
          AVG(steps_completed)::float as avg_steps,
          COUNT(*)::int as total_executions,
          SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::int as successful_executions
        FROM workflow_analytics
        WHERE workflow_id = ${workflowId}
      `)

      const row = result.rows[0]
      if (!row || row.total_executions === 0) {
        return {
          averageDuration: 0,
          successRate: 0,
          totalExecutions: 0,
          averageStepsCompleted: 0
        }
      }

      return {
        averageDuration: Number(row.avg_duration) || 0,
        successRate: (Number(row.successful_executions) / Number(row.total_executions)) * 100,
        totalExecutions: Number(row.total_executions),
        averageStepsCompleted: Number(row.avg_steps) || 0
      }
    } catch (error) {
      console.error('Failed to get workflow metrics:', error)
      return {
        averageDuration: 0,
        successRate: 0,
        totalExecutions: 0,
        averageStepsCompleted: 0
      }
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
