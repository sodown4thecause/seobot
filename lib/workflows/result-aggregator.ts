/**
 * Intelligent Result Aggregation for Workflows
 * 
 * Aggregates results from parallel tool executions into meaningful insights.
 * Handles partial failures, deduplication, and smart summarization.
 */

export interface AggregatedResult {
  summary: string
  insights: string[]
  data: Record<string, any>
  metrics: {
    totalTools: number
    successfulTools: number
    failedTools: number
    cachedTools: number
    totalDuration: number
    averageDuration: number
  }
  recommendations: string[]
}

/**
 * Aggregate results from multiple tool executions
 */
export function aggregateToolResults(
  toolResults: Record<string, any>,
  options: {
    includeMetrics?: boolean
    includeSummary?: boolean
    includeRecommendations?: boolean
  } = {}
): AggregatedResult {
  const {
    includeMetrics = true,
    includeSummary = true,
    includeRecommendations = true,
  } = options

  const insights: string[] = []
  const recommendations: string[] = []
  const data: Record<string, any> = {}
  
  let totalTools = 0
  let successfulTools = 0
  let failedTools = 0
  let cachedTools = 0
  let totalDuration = 0

  // Process each tool result
  for (const [toolName, result] of Object.entries(toolResults)) {
    totalTools++
    
    if (result.success) {
      successfulTools++
      
      // Track cached results
      if (result.cached || result._cached) {
        cachedTools++
      }
      
      // Accumulate duration
      if (result.duration) {
        totalDuration += result.duration
      }
      
      // Extract insights from result
      if (result.insights) {
        insights.push(...(Array.isArray(result.insights) ? result.insights : [result.insights]))
      }
      
      // Extract recommendations
      if (result.recommendations) {
        recommendations.push(...(Array.isArray(result.recommendations) ? result.recommendations : [result.recommendations]))
      }
      
      // Store data
      data[toolName] = result.data || result
    } else {
      failedTools++
    }
  }

  // Calculate metrics
  const averageDuration = totalTools > 0 ? Math.round(totalDuration / totalTools) : 0
  const cacheHitRate = totalTools > 0 ? Math.round((cachedTools / totalTools) * 100) : 0

  // Generate summary
  let summary = ''
  if (includeSummary) {
    summary = `Executed ${totalTools} tools: ${successfulTools} successful, ${failedTools} failed. `
    if (cachedTools > 0) {
      summary += `Cache hit rate: ${cacheHitRate}%. `
    }
    summary += `Average execution time: ${averageDuration}ms.`
  }

  // Deduplicate insights and recommendations
  const uniqueInsights = Array.from(new Set(insights))
  const uniqueRecommendations = Array.from(new Set(recommendations))

  return {
    summary,
    insights: uniqueInsights,
    data,
    metrics: {
      totalTools,
      successfulTools,
      failedTools,
      cachedTools,
      totalDuration,
      averageDuration,
    },
    recommendations: uniqueRecommendations,
  }
}

/**
 * Merge results from multiple workflow steps
 */
export function mergeStepResults(
  stepResults: Array<{ stepId: string; results: Record<string, any> }>
): AggregatedResult {
  const allToolResults: Record<string, any> = {}
  
  // Flatten all tool results from all steps
  for (const step of stepResults) {
    for (const [toolName, result] of Object.entries(step.results)) {
      // Prefix with step ID to avoid collisions
      allToolResults[`${step.stepId}:${toolName}`] = result
    }
  }
  
  return aggregateToolResults(allToolResults)
}

/**
 * Extract key metrics from aggregated results
 */
export function extractKeyMetrics(aggregated: AggregatedResult): Record<string, number> {
  return {
    totalTools: aggregated.metrics.totalTools,
    successRate: aggregated.metrics.totalTools > 0 
      ? Math.round((aggregated.metrics.successfulTools / aggregated.metrics.totalTools) * 100)
      : 0,
    cacheHitRate: aggregated.metrics.totalTools > 0
      ? Math.round((aggregated.metrics.cachedTools / aggregated.metrics.totalTools) * 100)
      : 0,
    averageDuration: aggregated.metrics.averageDuration,
    totalDuration: aggregated.metrics.totalDuration,
  }
}

/**
 * Format aggregated results for display
 */
export function formatAggregatedResults(aggregated: AggregatedResult): string {
  const lines: string[] = []
  
  // Summary
  if (aggregated.summary) {
    lines.push(aggregated.summary)
    lines.push('')
  }
  
  // Key insights
  if (aggregated.insights.length > 0) {
    lines.push('**Key Insights:**')
    aggregated.insights.slice(0, 5).forEach((insight, i) => {
      lines.push(`${i + 1}. ${insight}`)
    })
    lines.push('')
  }
  
  // Recommendations
  if (aggregated.recommendations.length > 0) {
    lines.push('**Recommendations:**')
    aggregated.recommendations.slice(0, 5).forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`)
    })
    lines.push('')
  }
  
  // Metrics
  const metrics = extractKeyMetrics(aggregated)
  lines.push('**Performance:**')
  lines.push(`- Success Rate: ${metrics.successRate}%`)
  lines.push(`- Cache Hit Rate: ${metrics.cacheHitRate}%`)
  lines.push(`- Total Duration: ${metrics.totalDuration}ms`)
  lines.push(`- Average Tool Duration: ${metrics.averageDuration}ms`)
  
  return lines.join('\n')
}

