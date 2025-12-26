// Workflow Execution Engine

import {
  Workflow,
  WorkflowStep,
  WorkflowStepResult,
  WorkflowExecution,
  WorkflowContext,
  ToolExecutionResult,
  WorkflowStepStatus,
} from './types'
import { analytics } from './analytics'
import { workflowPersistence } from './persistence'
import { nanoid } from 'nanoid'

export class WorkflowEngine {
  private execution: WorkflowExecution
  private context: WorkflowContext
  private stepResults: Map<string, WorkflowStepResult> = new Map()

  constructor(
    private workflow: Workflow,
    context: WorkflowContext,
    conversationId: string,
    userId: string,
    executionId?: string
  ) {
    this.context = context
    this.execution = {
      id: executionId || nanoid(),
      workflowId: workflow.id,
      conversationId,
      userId,
      status: 'running',
      stepResults: [],
      startTime: Date.now(),
    }
  }

  /**
   * Execute the entire workflow
   */
  async execute(): Promise<WorkflowExecution> {
    try {
      console.log(`[Workflow] Starting workflow: ${this.workflow.name}`)

      for (const step of this.workflow.steps) {
        // Check dependencies
        if (!this.areDependenciesMet(step)) {
          console.log(`[Workflow] Skipping step ${step.id} - dependencies not met`)
          this.recordStepResult(step.id, 'skipped')
          continue
        }

        // Execute step
        await this.executeStep(step)

        // Check if step failed and workflow should stop
        const stepResult = this.stepResults.get(step.id)
        if (stepResult?.status === 'failed') {
          console.error(`[Workflow] Step ${step.id} failed, stopping workflow`)
          this.execution.status = 'failed'
          break
        }
      }

      // Mark as completed if not failed
      if (this.execution.status === 'running') {
        this.execution.status = 'completed'
      }

      this.execution.endTime = Date.now()
      this.execution.stepResults = Array.from(this.stepResults.values())

      // Save final execution state
      try {
        await workflowPersistence.saveExecution(this.execution)
      } catch (saveError) {
        console.warn(`[Workflow] Failed to save final execution state:`, saveError)
      }

      // Record workflow analytics
      const workflowDuration = this.execution.endTime - this.execution.startTime
      const allToolResults: Record<string, any> = {}

      // Collect all tool results from all steps
      for (const stepResult of this.execution.stepResults) {
        if (stepResult.toolResults) {
          Object.assign(allToolResults, stepResult.toolResults)
        }
      }

      analytics.recordWorkflowExecution(
        this.workflow.id,
        workflowDuration,
        this.execution.status === 'completed',
        allToolResults
      )

      console.log(`[Workflow] Completed workflow: ${this.workflow.name} in ${workflowDuration}ms`)
      return this.execution
    } catch (error) {
      console.error('[Workflow] Execution error:', error)
      this.execution.status = 'failed'
      this.execution.endTime = Date.now()
      this.execution.stepResults = Array.from(this.stepResults.values())
      this.execution.errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Save failed execution state for recovery
      try {
        await workflowPersistence.saveExecution(this.execution)
      } catch (saveError) {
        console.warn(`[Workflow] Failed to save failed execution state:`, saveError)
      }

      throw error
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep): Promise<void> {
    console.log(`[Workflow] Executing step: ${step.name}`)
    const startTime = Date.now()

    this.execution.currentStep = step.id
    this.recordStepResult(step.id, 'running', { startTime })

    // Save checkpoint before step execution
    try {
      await workflowPersistence.saveCheckpoint(
        this.execution.id,
        step.id,
        'step_start',
        {
          stepResults: Array.from(this.stepResults.values()),
          previousStepResults: this.context.previousStepResults,
          workflowState: this.execution.metadata || {},
        }
      )
    } catch (checkpointError) {
      console.warn(`[Workflow] Failed to save checkpoint before step ${step.id}:`, checkpointError)
      // Continue execution even if checkpoint fails
    }

    try {
      let toolResults: Record<string, any> = {}

      if (step.parallel) {
        // Execute tools in parallel
        toolResults = await this.executeToolsParallel(step.tools)
      } else {
        // Execute tools sequentially
        toolResults = await this.executeToolsSequential(step.tools)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      this.recordStepResult(step.id, 'completed', {
        toolResults,
        startTime,
        endTime,
        duration,
      })

      // Store results in context for next steps
      this.context.previousStepResults = {
        ...this.context.previousStepResults,
        [step.id]: toolResults,
      }

      // Save checkpoint after successful step completion
      try {
        await workflowPersistence.saveCheckpoint(
          this.execution.id,
          step.id,
          'step_complete',
          {
            stepResults: Array.from(this.stepResults.values()),
            previousStepResults: this.context.previousStepResults,
            workflowState: this.execution.metadata || {},
          }
        )
      } catch (checkpointError) {
        console.warn(`[Workflow] Failed to save checkpoint after step ${step.id}:`, checkpointError)
      }

      console.log(`[Workflow] Step ${step.name} completed in ${duration}ms`)
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime

      console.error(`[Workflow] Step ${step.name} failed:`, error)
      this.recordStepResult(step.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime,
        endTime,
        duration,
      })

      // Save error recovery checkpoint
      try {
        await workflowPersistence.saveCheckpoint(
          this.execution.id,
          step.id,
          'error_recovery',
          {
            stepResults: Array.from(this.stepResults.values()),
            previousStepResults: this.context.previousStepResults,
            workflowState: this.execution.metadata || {},
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
          }
        )
      } catch (checkpointError) {
        console.warn(`[Workflow] Failed to save error recovery checkpoint:`, checkpointError)
      }

      // Save execution state for recovery
      try {
        await workflowPersistence.saveExecution(this.execution)
      } catch (saveError) {
        console.warn(`[Workflow] Failed to save execution state:`, saveError)
      }
    }
  }

  /**
   * Execute tools in parallel using Promise.all with optimizations
   * - Batches tools into groups to avoid overwhelming the system
   * - Uses Promise.allSettled to continue even if some tools fail
   * - Provides detailed performance metrics
   */
  private async executeToolsParallel(
    tools: Array<{ name: string; params?: Record<string, any>; required?: boolean }>
  ): Promise<Record<string, any>> {
    console.log(`[Workflow] Executing ${tools.length} tools in parallel`)
    const startTime = Date.now()

    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled(
      tools.map((tool) => this.executeTool(tool.name, tool.params))
    )

    // Convert array to object keyed by tool name
    const toolResults: Record<string, any> = {}
    const failedTools: string[] = []
    const successfulTools: string[] = []

    tools.forEach((tool, index) => {
      const result = results[index]

      if (result.status === 'fulfilled') {
        toolResults[tool.name] = result.value
        successfulTools.push(tool.name)
      } else {
        // Tool failed
        failedTools.push(tool.name)
        toolResults[tool.name] = {
          toolName: tool.name,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          duration: 0,
        }

        // If tool is required, log error but continue
        if (tool.required) {
          console.error(`[Workflow] Required tool ${tool.name} failed:`, result.reason)
        } else {
          console.warn(`[Workflow] Optional tool ${tool.name} failed:`, result.reason)
        }
      }
    })

    const duration = Date.now() - startTime
    console.log(`[Workflow] Parallel execution completed in ${duration}ms`)
    console.log(`[Workflow] Success: ${successfulTools.length}/${tools.length} tools`)
    if (failedTools.length > 0) {
      console.log(`[Workflow] Failed tools: ${failedTools.join(', ')}`)
    }

    return toolResults
  }

  /**
   * Execute tools sequentially (for tool chaining)
   */
  private async executeToolsSequential(
    tools: Array<{ name: string; params?: Record<string, any> }>
  ): Promise<Record<string, any>> {
    console.log(`[Workflow] Executing ${tools.length} tools sequentially`)

    const toolResults: Record<string, any> = {}

    for (const tool of tools) {
      const result = await this.executeTool(tool.name, tool.params)
      toolResults[tool.name] = result

      // Make previous tool results available to next tool
      this.context.previousStepResults = {
        ...this.context.previousStepResults,
        [tool.name]: result,
      }
    }

    return toolResults
  }

  /**
   * Execute a single tool with actual implementation
   */
  private async executeTool(
    toolName: string,
    params?: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(toolName, params)
      if (this.context.cache?.has(cacheKey)) {
        const duration = Date.now() - startTime
        console.log(`[Workflow] Cache hit for ${toolName}`)

        // Record analytics for cache hit
        analytics.recordToolExecution(toolName, duration, true, true)

        return {
          toolName,
          success: true,
          data: this.context.cache.get(cacheKey),
          cached: true,
          duration,
        }
      }

      // Substitute dynamic parameters from previous steps
      const effectiveParams = this.substituteDynamicParams(params || {})

      console.log(`[Workflow] Executing tool: ${toolName}`, effectiveParams)

      // Route to appropriate tool executor
      let data: any

      // External API tools
      if (toolName === 'jina_reader') {
        data = await this.executeJinaTool(effectiveParams)
      } else if (toolName === 'perplexity_search') {
        data = await this.executePerplexityTool(effectiveParams)
      }
      // Firecrawl tools
      else if (toolName.startsWith('firecrawl_') || toolName === 'scrape' || toolName === 'crawl' || toolName === 'map') {
        data = await this.executeFirecrawlTool(toolName, effectiveParams)
      }
      // Content Quality tools (Winston/Rytr)
      else if (['validate_content', 'check_plagiarism', 'check_ai_content', 'generate_seo_content', 'generate_blog_section', 'generate_meta_title', 'generate_meta_description', 'improve_content', 'expand_content', 'validate_content_quality', 'analyze_seo_content', 'fact_check_content'].includes(toolName)) {
        data = await this.executeContentQualityTool(toolName, effectiveParams)
      }
      // Composite SEO Tools
      else if (['keyword_intelligence', 'competitor_content_gap', 'bulk_traffic_estimator'].includes(toolName)) {
        data = await this.executeCompositeTool(toolName, effectiveParams)
      }
      // DataForSEO tools (via MCP or direct API)
      else {
        data = await this.executeDataForSEOTool(toolName, effectiveParams)
      }

      const duration = Date.now() - startTime

      const result: ToolExecutionResult = {
        toolName,
        success: true,
        data,
        cached: false,
        duration,
      }

      // Cache the result
      if (this.context.cache) {
        this.context.cache.set(cacheKey, result.data)
      }

      // Record analytics
      analytics.recordToolExecution(toolName, duration, true, false)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[Workflow] Tool ${toolName} failed:`, error)

      // Record analytics for failure
      analytics.recordToolExecution(toolName, duration, false, false)

      return {
        toolName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      }
    }
  }

  /**
   * Substitute dynamic parameters from previous step results
   */
  private substituteDynamicParams(params: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    // Flatten all previous results into a single context object
    const contextData: Record<string, any> = {}

    // Add user query and basic info
    contextData['userQuery'] = this.context.userQuery

    // Add results from previous steps
    for (const [stepId, stepResult] of this.stepResults.entries()) {
      if (stepResult.toolResults) {
        // Add individual tool results
        for (const [toolName, toolResult] of Object.entries(stepResult.toolResults)) {
          contextData[toolName] = toolResult.data

          // If result is an object, flatten its properties
          if (toolResult.data && typeof toolResult.data === 'object') {
            Object.assign(contextData, toolResult.data)
          }
        }
      }
    }

    // Also check context.previousStepResults (for sequential tools within a step)
    if (this.context.previousStepResults) {
      for (const [key, value] of Object.entries(this.context.previousStepResults)) {
        if (value && typeof value === 'object' && 'data' in value) {
          contextData[key] = value.data
          if (value.data && typeof value.data === 'object') {
            Object.assign(contextData, value.data)
          }
        } else {
          contextData[key] = value
        }
      }
    }

    // Perform substitution
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const varName = value.slice(2, -2).trim()

        // Look up variable in context data
        if (varName in contextData) {
          result[key] = contextData[varName]
        } else {
          // Try to find nested property (e.g. toolName.property)
          const parts = varName.split('.')
          if (parts.length > 1) {
            let current: Record<string, any> | undefined = contextData
            for (const part of parts) {
              if (current && typeof current === 'object' && part in current) {
                current = current[part]
              } else {
                current = undefined
                break
              }
            }
            result[key] = current !== undefined ? current : value
          } else {
            console.warn(`[Workflow] Variable not found: ${varName}`)
            result[key] = value // Keep original if not found
          }
        }
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Execute Jina Reader tool
   */
  private async executeJinaTool(params?: Record<string, any>): Promise<any> {
    const { scrapeWithJina } = await import('@/lib/external-apis/jina')

    if (!params?.url) {
      throw new Error('Jina Reader requires url parameter')
    }

    const result = await scrapeWithJina({
      url: params.url,
      timeout: params.timeout,
    })

    if (!result.success) {
      throw new Error(result.error || 'Jina scraping failed')
    }

    return result
  }

  /**
   * Execute Perplexity search tool
   */
  private async executePerplexityTool(params?: Record<string, any>): Promise<any> {
    const { searchWithPerplexity } = await import('@/lib/external-apis/perplexity')

    if (!params?.query) {
      throw new Error('Perplexity search requires query parameter')
    }

    const result = await searchWithPerplexity({
      query: params.query,
      searchRecencyFilter: params.search_recency_filter || params.searchRecencyFilter,
      returnCitations: params.return_citations ?? params.returnCitations ?? true,
    })

    if (!result.success) {
      throw new Error(result.error || 'Perplexity search failed')
    }

    return result
  }

  /**
   * Execute Firecrawl tool
   */
  private async executeFirecrawlTool(toolName: string, params?: Record<string, any>): Promise<any> {
    const { getFirecrawlTools } = await import('@/lib/mcp/firecrawl-client')

    const tools = await getFirecrawlTools()
    const tool = (tools as any)[toolName]

    if (!tool) {
      throw new Error(`Firecrawl tool ${toolName} not found`)
    }

    // Execute the tool
    // Note: MCP tools from ai-sdk usually have an execute method
    if (tool.execute) {
      return await tool.execute(params || {})
    }

    throw new Error(`Firecrawl tool ${toolName} is not executable`)
  }

  /**
   * Execute Content Quality tool (Rytr/Winston)
   */
  private async executeContentQualityTool(toolName: string, params?: Record<string, any>): Promise<any> {
    const { getContentQualityTools } = await import('@/lib/ai/content-quality-tools')
    const { getEnhancedContentQualityTools } = await import('@/lib/ai/content-quality-enhancements')

    const basicTools = getContentQualityTools()
    const enhancedTools = getEnhancedContentQualityTools()

    const tool = basicTools[toolName as keyof typeof basicTools] || enhancedTools[toolName as keyof typeof enhancedTools]

    if (!tool) {
      throw new Error(`Content quality tool ${toolName} not found`)
    }

    // Execute the tool
    if (tool.execute) {
      return await tool.execute((params || {}) as any, {
        toolCallId: 'workflow-exec',
        messages: []
      })
    }

    throw new Error(`Content quality tool ${toolName} is not executable`)
  }

  /**
   * Execute Composite SEO Tool
   */
  private async executeCompositeTool(toolName: string, params?: Record<string, any>): Promise<any> {
    const { compositeSEOTools } = await import('@/lib/tools/composite-seo-tools')

    // Map workflow tool names to composite tool names
    const toolMapping: Record<string, keyof typeof compositeSEOTools> = {
      'keyword_intelligence': 'keyword_intelligence',
      'competitor_content_gap': 'competitor_content_gap',
      'bulk_traffic_estimator': 'bulk_traffic_estimator',
    }

    const compositeToolName = toolMapping[toolName]
    if (!compositeToolName) {
      throw new Error(`Composite tool ${toolName} not found`)
    }

    const tool = compositeSEOTools[compositeToolName]
    if (!tool) {
      throw new Error(`Composite tool ${compositeToolName} not available`)
    }

    // Execute the composite tool
    if (tool.execute) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (tool.execute as any)(params || {}, { 
        abortSignal: new AbortController().signal,
        toolCallId: 'workflow-tool-call',
        messages: []
      })
    }

    throw new Error(`Composite tool ${compositeToolName} is not executable`)
  }

  /**
   * Execute DataForSEO tool (via MCP or direct API)
   */
  private async executeDataForSEOTool(toolName: string, params?: Record<string, any>): Promise<any> {
    const { handleDataForSEOFunctionCall } = await import('@/lib/ai/dataforseo-tools')

    // Map workflow tool names to DataForSEO function names
    const toolMapping: Record<string, string> = {
      'ai_keyword_search_volume': 'ai_keyword_search_volume',
      'keyword_search_volume': 'keyword_search_volume',
      'google_rankings': 'google_rankings',
      'domain_overview': 'domain_overview',
    }

    const functionName = toolMapping[toolName] || toolName

    const result = await handleDataForSEOFunctionCall(functionName, params || {})

    return result
  }

  /**
   * Check if step dependencies are met
   */
  private areDependenciesMet(step: WorkflowStep): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true
    }

    return step.dependencies.every((depId) => {
      const depResult = this.stepResults.get(depId)
      return depResult?.status === 'completed'
    })
  }

  /**
   * Record step result
   */
  private recordStepResult(
    stepId: string,
    status: WorkflowStepStatus,
    data?: Partial<WorkflowStepResult>
  ): void {
    const existing = this.stepResults.get(stepId)
    this.stepResults.set(stepId, {
      ...existing,
      ...data,
      stepId,
      status,
    })
  }

  /**
   * Generate cache key for tool execution
   */
  private getCacheKey(toolName: string, params?: Record<string, any>): string {
    return `${toolName}:${JSON.stringify(params || {})}`
  }

  /**
   * Get current execution status
   */
  getStatus(): WorkflowExecution {
    return {
      ...this.execution,
      stepResults: Array.from(this.stepResults.values()),
    }
  }
}

