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

export class WorkflowEngine {
  private execution: WorkflowExecution
  private context: WorkflowContext
  private stepResults: Map<string, WorkflowStepResult> = new Map()

  constructor(
    private workflow: Workflow,
    context: WorkflowContext,
    conversationId: string,
    userId: string
  ) {
    this.context = context
    this.execution = {
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

      console.log(`[Workflow] Completed workflow: ${this.workflow.name}`)
      return this.execution
    } catch (error) {
      console.error('[Workflow] Execution error:', error)
      this.execution.status = 'failed'
      this.execution.endTime = Date.now()
      this.execution.stepResults = Array.from(this.stepResults.values())
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
    }
  }

  /**
   * Execute tools in parallel using Promise.all
   */
  private async executeToolsParallel(
    tools: Array<{ name: string; params?: Record<string, any> }>
  ): Promise<Record<string, any>> {
    console.log(`[Workflow] Executing ${tools.length} tools in parallel`)

    const results = await Promise.all(
      tools.map((tool) => this.executeTool(tool.name, tool.params))
    )

    // Convert array to object keyed by tool name
    const toolResults: Record<string, any> = {}
    tools.forEach((tool, index) => {
      toolResults[tool.name] = results[index]
    })

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
        console.log(`[Workflow] Cache hit for ${toolName}`)
        return {
          toolName,
          success: true,
          data: this.context.cache.get(cacheKey),
          cached: true,
          duration: Date.now() - startTime,
        }
      }

      console.log(`[Workflow] Executing tool: ${toolName}`, params)

      // Route to appropriate tool executor
      let data: any

      // External API tools
      if (toolName === 'jina_reader') {
        data = await this.executeJinaTool(params)
      } else if (toolName === 'perplexity_search') {
        data = await this.executePerplexityTool(params)
      }
      // DataForSEO tools (via MCP or direct API)
      else {
        data = await this.executeDataForSEOTool(toolName, params)
      }

      const result: ToolExecutionResult = {
        toolName,
        success: true,
        data,
        cached: false,
        duration: Date.now() - startTime,
      }

      // Cache the result
      if (this.context.cache) {
        this.context.cache.set(cacheKey, result.data)
      }

      return result
    } catch (error) {
      console.error(`[Workflow] Tool ${toolName} failed:`, error)
      return {
        toolName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }
    }
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
      stepId,
      status,
      ...existing,
      ...data,
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

