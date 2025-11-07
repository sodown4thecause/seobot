// Workflow Executor - High-level API for running workflows

import { WorkflowEngine } from './engine'
import { getWorkflow } from './registry'
import { WorkflowContext, WorkflowExecution, WorkflowStep } from './types'

export interface ExecuteWorkflowOptions {
  workflowId: string
  userQuery: string
  conversationId: string
  userId: string
  parameters?: Record<string, any>
  cache?: Map<string, any>
}

/**
 * Execute a workflow with parameter substitution
 */
export async function executeWorkflow(options: ExecuteWorkflowOptions): Promise<WorkflowExecution> {
  const { workflowId, userQuery, conversationId, userId, parameters = {}, cache } = options

  // Get workflow definition
  const workflow = getWorkflow(workflowId)
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`)
  }

  console.log(`[Workflow Executor] Starting workflow: ${workflow.name}`)

  // Extract parameters from user query if not provided
  const extractedParams = parameters.keyword ? parameters : extractParametersFromQuery(userQuery)

  // Substitute parameters in workflow steps
  const processedWorkflow = {
    ...workflow,
    steps: workflow.steps.map((step) => substituteStepParameters(step, extractedParams)),
  }

  // Create workflow context
  const context: WorkflowContext = {
    userQuery,
    previousStepResults: {},
    userPreferences: {},
    cache: cache || new Map(),
  }

  // Create and execute workflow engine
  const engine = new WorkflowEngine(processedWorkflow, context, conversationId, userId)

  const result = await engine.execute()

  console.log(`[Workflow Executor] Workflow completed: ${workflow.name}`)
  console.log(`[Workflow Executor] Status: ${result.status}`)
  console.log(`[Workflow Executor] Steps completed: ${result.stepResults.filter((s) => s.status === 'completed').length}/${result.stepResults.length}`)

  return result
}

/**
 * Extract parameters from user query
 */
function extractParametersFromQuery(query: string): Record<string, any> {
  const params: Record<string, any> = {}

  // Extract keyword (everything in quotes or the main topic)
  const quotedMatch = query.match(/"([^"]+)"/)
  if (quotedMatch) {
    params.keyword = quotedMatch[1]
  } else {
    // Try to extract main topic (words after "about", "for", "on", etc.)
    const topicMatch = query.match(/(?:about|for|on|regarding)\s+([^.?!]+)/i)
    if (topicMatch) {
      params.keyword = topicMatch[1].trim()
    } else {
      // Use the whole query as keyword
      params.keyword = query
    }
  }

  // Extract location if mentioned
  const locationMatch = query.match(/in\s+(United States|United Kingdom|Canada|Australia|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)
  if (locationMatch) {
    params.location_name = locationMatch[1]
  } else {
    params.location_name = 'United States' // Default
  }

  console.log('[Workflow Executor] Extracted parameters:', params)

  return params
}

/**
 * Substitute parameters in workflow step
 */
function substituteStepParameters(step: WorkflowStep, parameters: Record<string, any>): WorkflowStep {
  return {
    ...step,
    tools: step.tools.map((tool) => ({
      ...tool,
      params: tool.params ? substituteParams(tool.params, parameters) : undefined,
    })),
  }
}

/**
 * Substitute {{variable}} placeholders in parameters
 */
function substituteParams(params: Record<string, any>, values: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      // Extract variable name
      const varName = value.slice(2, -2).trim()
      result[key] = values[varName] || value
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Format workflow results for display
 */
export function formatWorkflowResults(execution: WorkflowExecution): {
  summary: string
  components: Array<{
    type: string
    data: any
  }>
  insights: string[]
} {
  const components: Array<{ type: string; data: any }> = []
  const insights: string[] = []

  // Process each step result
  for (const stepResult of execution.stepResults) {
    if (stepResult.status !== 'completed' || !stepResult.toolResults) {
      continue
    }

    // Extract data from tool results
    const toolResults = stepResult.toolResults

    // AI Platform Metrics
    if (toolResults.ai_keyword_search_volume) {
      const aiData = toolResults.ai_keyword_search_volume
      const googleData = toolResults.keyword_search_volume

      components.push({
        type: 'AIPlatformMetrics',
        data: {
          keyword: aiData.keyword || '',
          platforms: {
            chatgpt: aiData.chatgpt_volume || 0,
            claude: aiData.claude_volume || 0,
            perplexity: aiData.perplexity_volume || 0,
          },
          googleVolume: googleData?.search_volume || 0,
          aiVsGoogleRatio: calculateRatio(aiData, googleData),
          trend: determineTrend(aiData),
          opportunity: determineOpportunity(aiData, googleData),
        },
      })
    }

    // Content Strategy (from strategy generation step)
    if (stepResult.stepId === 'strategy-generation') {
      // This would be generated by the AI agent
      // For now, we'll structure it from the analysis
      components.push({
        type: 'ContentStrategy',
        data: {
          keyword: execution.metadata?.keyword || '',
          opportunity: {
            level: 'high',
            reason: 'Strong AI search presence with growing volume',
          },
          contentGaps: extractContentGaps(toolResults),
          eeatStrategy: generateEEATStrategy(toolResults),
          contentStructure: generateContentStructure(toolResults),
          optimizationChecklist: generateOptimizationChecklist(),
          quickWins: generateQuickWins(toolResults),
        },
      })
    }

    // Citation Recommendations (from citation research step)
    if (stepResult.stepId === 'citation-recommendations' && toolResults.perplexity_search) {
      const perplexityData = toolResults.perplexity_search

      components.push({
        type: 'CitationRecommendations',
        data: {
          keyword: execution.metadata?.keyword || '',
          citations: formatCitations(perplexityData),
          citationStrategy: 'Use authoritative sources to strengthen EEAT signals and improve AI search rankings',
          integrationTips: [
            'Place citations near key claims and statistics',
            'Use inline citations with hyperlinks',
            'Include author credentials when citing experts',
            'Update citations regularly to maintain freshness',
          ],
        },
      })
    }
  }

  // Generate summary
  const summary = generateSummary(execution, components)

  return {
    summary,
    components,
    insights,
  }
}

// Helper functions for formatting

function calculateRatio(aiData: any, googleData: any): number {
  const aiTotal = (aiData.chatgpt_volume || 0) + (aiData.claude_volume || 0) + (aiData.perplexity_volume || 0)
  const googleVolume = googleData?.search_volume || 1
  return aiTotal / googleVolume
}

function determineTrend(aiData: any): 'growing' | 'stable' | 'declining' {
  // This would analyze historical data
  return 'growing'
}

function determineOpportunity(aiData: any, googleData: any): 'high' | 'medium' | 'low' {
  const ratio = calculateRatio(aiData, googleData)
  if (ratio > 0.3) return 'high'
  if (ratio > 0.1) return 'medium'
  return 'low'
}

function extractContentGaps(toolResults: any): string[] {
  // This would analyze scraped content
  return [
    'Missing recent statistics and data',
    'Lack of expert quotes and opinions',
    'No clear author credentials',
    'Limited practical examples',
  ]
}

function generateEEATStrategy(toolResults: any): any {
  return {
    expertise: [
      'Add author bio with credentials',
      'Include industry certifications',
      'Reference years of experience',
    ],
    experience: [
      'Share first-hand case studies',
      'Include before/after examples',
      'Add personal insights and lessons learned',
    ],
    authoritativeness: [
      'Cite authoritative sources',
      'Link to published research',
      'Include expert endorsements',
    ],
    trustworthiness: [
      'Add publication and update dates',
      'Include fact-checking sources',
      'Use HTTPS and secure connections',
      'Display privacy policy and terms',
    ],
  }
}

function generateContentStructure(toolResults: any): any {
  return {
    format: 'Comprehensive guide with examples',
    sections: ['Introduction', 'Key Concepts', 'Step-by-Step Guide', 'Examples', 'Expert Tips', 'Conclusion'],
    depth: '2,500-3,500 words',
    multimedia: ['Infographics', 'Screenshots', 'Video tutorials', 'Downloadable templates'],
  }
}

function generateOptimizationChecklist(): any[] {
  return [
    {
      category: 'Technical SEO',
      items: [
        'Add schema markup (Article, FAQPage, HowTo)',
        'Optimize page speed (target <2s)',
        'Ensure mobile responsiveness',
        'Add internal links to related content',
      ],
    },
    {
      category: 'On-Page SEO',
      items: [
        'Include target keyword in H1',
        'Use semantic keywords in H2/H3',
        'Optimize meta description',
        'Add alt text to images',
      ],
    },
    {
      category: 'Content Quality',
      items: [
        'Add 5+ authoritative citations',
        'Include 3+ expert quotes',
        'Add recent statistics (last 6 months)',
        'Include practical examples',
      ],
    },
  ]
}

function generateQuickWins(toolResults: any): string[] {
  return [
    'Add author bio with credentials at the top',
    'Include 3-5 recent statistics with citations',
    'Add FAQ section with schema markup',
    'Update publish date to show freshness',
    'Add expert quotes from industry leaders',
  ]
}

function formatCitations(perplexityData: any): any[] {
  // Format Perplexity citations for display
  return (perplexityData.citations || []).slice(0, 5).map((citation: any, index: number) => ({
    id: `citation-${index}`,
    source: citation.domain || citation.url,
    url: citation.url,
    authorityLevel: 'high',
    type: 'industry',
    dataPoint: citation.snippet || 'Authoritative source for topic research',
    placement: 'Use in introduction or key claims section',
    eeatBenefit: 'Strengthens authoritativeness and trustworthiness',
  }))
}

function generateSummary(execution: WorkflowExecution, components: any[]): string {
  const componentTypes = components.map((c) => c.type).join(', ')
  return `Workflow completed successfully with ${components.length} insights: ${componentTypes}`
}

