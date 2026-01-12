/**
 * Workflow Analytics
 * Records and analyzes workflow performance
 */

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
  private _db: any = null

  /**
   * Lazy-load database client to avoid server-side blocking
   */
  private async getDb() {
    if (!this._db) {
      try {
        const { db } = await import('@/lib/db')
        this._db = db
      } catch (error) {
        console.warn('[WorkflowAnalytics] Database client not available:', error)
        return null
      }
    }
    return this._db
  }

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
      const db = await this.getDb()
      if (!db) {
        console.warn('[WorkflowAnalytics] Skipping analytics - database not available')
        return
      }

      // Direct SQL insert for workflow analytics
      await db.execute(sql`
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
      const db = await this.getDb()
      if (!db) {
        return {
          averageDuration: 0,
          successRate: 0,
          totalExecutions: 0,
          averageStepsCompleted: 0
        }
      }

      const result = await db.execute(sql`
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
  async getAllToolMetrics() {
    try {
      const db = await this.getDb()
      
      const result = await db.execute(sql`
        SELECT 
          tool_name,
          COUNT(*) as execution_count,
          AVG(duration_ms) as avg_duration,
          MIN(duration_ms) as min_duration,
          MAX(duration_ms) as max_duration,
          SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate,
          SUM(CASE WHEN cached THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as cache_hit_rate
        FROM tool_executions
        GROUP BY tool_name
        ORDER BY execution_count DESC
      `)
      
      return result.rows.map((row: any) => ({
        toolName: row.tool_name,
        executionCount: Number(row.execution_count),
        avgDuration: Number(row.avg_duration) || 0,
        minDuration: Number(row.min_duration) || 0,
        maxDuration: Number(row.max_duration) || 0,
        successRate: Number(row.success_rate) || 0,
        cacheHitRate: Number(row.cache_hit_rate) || 0
      }))
    } catch (error) {
      console.error('Failed to get tool metrics:', error)
      return []
    }
  }

  /**
   * Get top performing tools
   */
  async getTopPerformingTools(limit: number = 10) {
    try {
      const db = await this.getDb()
      
      const result = await db.execute(sql`
        SELECT 
          tool_name,
          COUNT(*) as execution_count,
          AVG(duration_ms) as avg_duration,
          SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate
        FROM tool_executions
        GROUP BY tool_name
        HAVING COUNT(*) >= 5
        ORDER BY 
          (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) DESC,
          AVG(duration_ms) ASC
        LIMIT ${limit}
      `)
      
      return result.rows.map((row: any) => ({
        toolName: row.tool_name,
        executionCount: Number(row.execution_count),
        avgDuration: Number(row.avg_duration) || 0,
        successRate: Number(row.success_rate) || 0
      }))
    } catch (error) {
      console.error('Failed to get top performing tools:', error)
      return []
    }
  }

  /**
   * Get slowest tools
   */
  async getSlowestTools(limit: number = 10) {
    try {
      const db = await this.getDb()
      
      const result = await db.execute(sql`
        SELECT 
          tool_name,
          COUNT(*) as execution_count,
          AVG(duration_ms) as avg_duration,
          MAX(duration_ms) as max_duration
        FROM tool_executions
        WHERE success = true
        GROUP BY tool_name
        HAVING COUNT(*) >= 3
        ORDER BY AVG(duration_ms) DESC
        LIMIT ${limit}
      `)
      
      return result.rows.map((row: any) => ({
        toolName: row.tool_name,
        executionCount: Number(row.execution_count),
        avgDuration: Number(row.avg_duration) || 0,
        maxDuration: Number(row.max_duration) || 0
      }))
    } catch (error) {
      console.error('Failed to get slowest tools:', error)
      return []
    }
  }

  /**
   * Get best cached tools
   */
  async getBestCachedTools(limit: number = 10) {
    try {
      const db = await this.getDb()
      
      const result = await db.execute(sql`
        SELECT 
          tool_name,
          COUNT(*) as execution_count,
          SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cache_hits,
          SUM(CASE WHEN cached THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as cache_hit_rate,
          AVG(CASE WHEN cached THEN duration_ms END) as avg_cached_duration,
          AVG(CASE WHEN NOT cached THEN duration_ms END) as avg_uncached_duration
        FROM tool_executions
        GROUP BY tool_name
        HAVING 
          COUNT(*) >= 10 
          AND SUM(CASE WHEN cached THEN 1 ELSE 0 END) > 0
        ORDER BY cache_hit_rate DESC
        LIMIT ${limit}
      `)
      
      return result.rows.map((row: any) => ({
        toolName: row.tool_name,
        executionCount: Number(row.execution_count),
        cacheHits: Number(row.cache_hits),
        cacheHitRate: Number(row.cache_hit_rate) || 0,
        avgCachedDuration: Number(row.avg_cached_duration) || 0,
        avgUncachedDuration: Number(row.avg_uncached_duration) || 0,
        speedup: row.avg_uncached_duration && row.avg_cached_duration 
          ? Number(row.avg_uncached_duration) / Number(row.avg_cached_duration)
          : 1
      }))
    } catch (error) {
      console.error('Failed to get best cached tools:', error)
      return []
    }
  }

  /**
   * Get metrics for a specific tool
   */
  async getToolMetrics(toolName: string) {
    try {
      const db = await this.getDb()
      
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as execution_count,
          AVG(duration_ms) as avg_duration,
          MIN(duration_ms) as min_duration,
          MAX(duration_ms) as max_duration,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
          SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as success_rate,
          SUM(CASE WHEN cached THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as cache_hit_rate,
          AVG(CASE WHEN cached THEN duration_ms END) as avg_cached_duration,
          AVG(CASE WHEN NOT cached THEN duration_ms END) as avg_uncached_duration
        FROM tool_executions
        WHERE tool_name = ${toolName}
      `)
      
      if (result.rows.length === 0) {
        return null
      }
      
      const row = result.rows[0] as any
      return {
        toolName,
        executionCount: Number(row.execution_count),
        avgDuration: Number(row.avg_duration) || 0,
        minDuration: Number(row.min_duration) || 0,
        maxDuration: Number(row.max_duration) || 0,
        medianDuration: Number(row.median_duration) || 0,
        p95Duration: Number(row.p95_duration) || 0,
        successRate: Number(row.success_rate) || 0,
        cacheHitRate: Number(row.cache_hit_rate) || 0,
        avgCachedDuration: Number(row.avg_cached_duration) || 0,
        avgUncachedDuration: Number(row.avg_uncached_duration) || 0,
        cacheSpeedup: row.avg_uncached_duration && row.avg_cached_duration
          ? Number(row.avg_uncached_duration) / Number(row.avg_cached_duration)
          : 1
      }
    } catch (error) {
      console.error(`Failed to get metrics for tool ${toolName}:`, error)
      return null
    }
  }
}

export const workflowAnalytics = new WorkflowAnalyticsService()

// Alias for backward compatibility with engine.ts import
export const analytics = workflowAnalytics
