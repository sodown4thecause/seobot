/**
 * Progressive Loading for Workflow Results
 * 
 * Streams results as they become available instead of waiting for all tools to complete.
 * Provides better UX by showing partial results immediately.
 */

export type ProgressCallback = (update: ProgressUpdate) => void

export interface ProgressUpdate {
  type: 'tool_start' | 'tool_complete' | 'tool_error' | 'step_complete' | 'workflow_complete'
  toolName?: string
  stepId?: string
  data?: any
  error?: string
  progress: {
    current: number
    total: number
    percentage: number
  }
  timestamp: number
}

/**
 * Execute tools with progressive loading
 * Calls the progress callback as each tool completes
 */
export async function executeToolsWithProgress(
  tools: Array<{ name: string; params?: Record<string, any>; required?: boolean }>,
  executeFn: (toolName: string, params?: Record<string, any>) => Promise<any>,
  onProgress?: ProgressCallback
): Promise<Record<string, any>> {
  const totalTools = tools.length
  let completedTools = 0
  const results: Record<string, any> = {}

  // Notify start
  if (onProgress) {
    onProgress({
      type: 'workflow_complete',
      progress: {
        current: 0,
        total: totalTools,
        percentage: 0,
      },
      timestamp: Date.now(),
    })
  }

  // Execute tools in parallel but report progress individually
  const promises = tools.map(async (tool) => {
    try {
      // Notify tool start
      if (onProgress) {
        onProgress({
          type: 'tool_start',
          toolName: tool.name,
          progress: {
            current: completedTools,
            total: totalTools,
            percentage: Math.round((completedTools / totalTools) * 100),
          },
          timestamp: Date.now(),
        })
      }

      // Execute tool
      const result = await executeFn(tool.name, tool.params)
      
      // Update progress
      completedTools++
      
      // Notify tool complete
      if (onProgress) {
        onProgress({
          type: 'tool_complete',
          toolName: tool.name,
          data: result,
          progress: {
            current: completedTools,
            total: totalTools,
            percentage: Math.round((completedTools / totalTools) * 100),
          },
          timestamp: Date.now(),
        })
      }

      return { toolName: tool.name, result, success: true }
    } catch (error) {
      completedTools++
      
      // Notify error
      if (onProgress) {
        onProgress({
          type: 'tool_error',
          toolName: tool.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          progress: {
            current: completedTools,
            total: totalTools,
            percentage: Math.round((completedTools / totalTools) * 100),
          },
          timestamp: Date.now(),
        })
      }

      return { 
        toolName: tool.name, 
        result: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 
        success: false 
      }
    }
  })

  // Wait for all tools to complete
  const toolResults = await Promise.all(promises)

  // Convert to results object
  for (const { toolName, result } of toolResults) {
    results[toolName] = result
  }

  // Notify completion
  if (onProgress) {
    onProgress({
      type: 'workflow_complete',
      data: results,
      progress: {
        current: totalTools,
        total: totalTools,
        percentage: 100,
      },
      timestamp: Date.now(),
    })
  }

  return results
}

/**
 * Create a progress tracker for workflow execution
 */
export class ProgressTracker {
  private updates: ProgressUpdate[] = []
  private callbacks: ProgressCallback[] = []

  /**
   * Subscribe to progress updates
   */
  subscribe(callback: ProgressCallback): () => void {
    this.callbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit a progress update
   */
  emit(update: ProgressUpdate): void {
    this.updates.push(update)
    this.callbacks.forEach(callback => callback(update))
  }

  /**
   * Get all updates
   */
  getUpdates(): ProgressUpdate[] {
    return [...this.updates]
  }

  /**
   * Get current progress percentage
   */
  getProgress(): number {
    if (this.updates.length === 0) return 0
    const latest = this.updates[this.updates.length - 1]
    return latest.progress.percentage
  }

  /**
   * Check if workflow is complete
   */
  isComplete(): boolean {
    if (this.updates.length === 0) return false
    const latest = this.updates[this.updates.length - 1]
    return latest.type === 'workflow_complete' && latest.progress.percentage === 100
  }
}

