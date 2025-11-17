/**
 * Tool Execution Analytics
 * 
 * Tracks performance metrics for tool executions:
 * - Execution times
 * - Cache hit rates
 * - Success/failure rates
 * - Tool usage patterns
 */

export interface ToolMetrics {
  toolName: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  cacheHits: number
  cacheHitRate: number
  lastExecuted: number
}

export interface WorkflowMetrics {
  workflowId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageDuration: number
  toolMetrics: Map<string, ToolMetrics>
}

/**
 * In-memory analytics store (resets on deployment)
 * In production, this would be persisted to Redis or a database
 */
class AnalyticsStore {
  private toolMetrics: Map<string, ToolMetrics> = new Map()
  private workflowMetrics: Map<string, WorkflowMetrics> = new Map()

  /**
   * Record a tool execution
   */
  recordToolExecution(
    toolName: string,
    duration: number,
    success: boolean,
    cached: boolean = false
  ): void {
    let metrics = this.toolMetrics.get(toolName)

    if (!metrics) {
      metrics = {
        toolName,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        cacheHits: 0,
        cacheHitRate: 0,
        lastExecuted: Date.now(),
      }
      this.toolMetrics.set(toolName, metrics)
    }

    // Update metrics
    metrics.totalExecutions++
    if (success) {
      metrics.successfulExecutions++
    } else {
      metrics.failedExecutions++
    }

    if (cached) {
      metrics.cacheHits++
    }

    metrics.totalDuration += duration
    metrics.averageDuration = Math.round(metrics.totalDuration / metrics.totalExecutions)
    metrics.minDuration = Math.min(metrics.minDuration, duration)
    metrics.maxDuration = Math.max(metrics.maxDuration, duration)
    metrics.cacheHitRate = Math.round((metrics.cacheHits / metrics.totalExecutions) * 100)
    metrics.lastExecuted = Date.now()
  }

  /**
   * Record a workflow execution
   */
  recordWorkflowExecution(
    workflowId: string,
    duration: number,
    success: boolean,
    toolResults: Record<string, any>
  ): void {
    let metrics = this.workflowMetrics.get(workflowId)

    if (!metrics) {
      metrics = {
        workflowId,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageDuration: 0,
        toolMetrics: new Map(),
      }
      this.workflowMetrics.set(workflowId, metrics)
    }

    metrics.totalExecutions++
    if (success) {
      metrics.successfulExecutions++
    } else {
      metrics.failedExecutions++
    }

    // Update average duration
    const totalDuration = metrics.averageDuration * (metrics.totalExecutions - 1) + duration
    metrics.averageDuration = Math.round(totalDuration / metrics.totalExecutions)

    // Record individual tool metrics
    for (const [toolName, result] of Object.entries(toolResults)) {
      if (result.duration) {
        this.recordToolExecution(
          toolName,
          result.duration,
          result.success !== false,
          result.cached || result._cached || false
        )
      }
    }
  }

  /**
   * Get metrics for a specific tool
   */
  getToolMetrics(toolName: string): ToolMetrics | undefined {
    return this.toolMetrics.get(toolName)
  }

  /**
   * Get metrics for all tools
   */
  getAllToolMetrics(): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
  }

  /**
   * Get top performing tools by success rate
   */
  getTopPerformingTools(limit: number = 10): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
      .sort((a, b) => {
        const aSuccessRate = a.successfulExecutions / a.totalExecutions
        const bSuccessRate = b.successfulExecutions / b.totalExecutions
        return bSuccessRate - aSuccessRate
      })
      .slice(0, limit)
  }

  /**
   * Get slowest tools by average duration
   */
  getSlowestTools(limit: number = 10): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit)
  }

  /**
   * Get tools with best cache hit rates
   */
  getBestCachedTools(limit: number = 10): ToolMetrics[] {
    return Array.from(this.toolMetrics.values())
      .filter(m => m.totalExecutions >= 5) // Only tools with enough data
      .sort((a, b) => b.cacheHitRate - a.cacheHitRate)
      .slice(0, limit)
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(workflowId: string): WorkflowMetrics | undefined {
    return this.workflowMetrics.get(workflowId)
  }

  /**
   * Get summary statistics
   */
  getSummaryStats(): {
    totalTools: number
    totalExecutions: number
    averageSuccessRate: number
    averageCacheHitRate: number
    averageDuration: number
  } {
    const allMetrics = Array.from(this.toolMetrics.values())
    const totalTools = allMetrics.length
    const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0)
    
    const totalSuccessRate = allMetrics.reduce((sum, m) => {
      return sum + (m.successfulExecutions / m.totalExecutions) * 100
    }, 0)
    const averageSuccessRate = totalTools > 0 ? Math.round(totalSuccessRate / totalTools) : 0

    const totalCacheHitRate = allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0)
    const averageCacheHitRate = totalTools > 0 ? Math.round(totalCacheHitRate / totalTools) : 0

    const totalDuration = allMetrics.reduce((sum, m) => sum + m.averageDuration, 0)
    const averageDuration = totalTools > 0 ? Math.round(totalDuration / totalTools) : 0

    return {
      totalTools,
      totalExecutions,
      averageSuccessRate,
      averageCacheHitRate,
      averageDuration,
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsStore()

