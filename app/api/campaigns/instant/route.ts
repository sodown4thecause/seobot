/**
 * Instant Campaign API
 * 
 * Streamlined endpoint for 3-minute campaigns with SSE progress streaming
 * 
 * POST /api/campaigns/instant
 * - type: 'rank-keyword' | 'beat-competitor' | 'answer-question'
 * - input: string (keyword, URL, or question)
 * - options?: { includeImages?: boolean, contentLength?: string }
 */

import { NextRequest } from 'next/server'
import { executeWorkflow, formatWorkflowResults } from '@/lib/workflows/executor'
import { getWorkflow } from '@/lib/workflows/registry'
import { requireUserId } from '@/lib/auth/clerk'
import { nanoid } from 'nanoid'
import { createSmoothStreamResponse, sendProgressUpdate, sendStepComplete, sendError } from '@/lib/utils/smooth-stream'

export const runtime = 'edge'

// Campaign type to workflow ID mapping
const CAMPAIGN_WORKFLOW_MAP: Record<string, string> = {
  'rank-keyword': 'instant-rank-keyword',
  'beat-competitor': 'instant-beat-competitor',
  'answer-question': 'instant-answer-question',
}

// Campaign type display names
const CAMPAIGN_NAMES: Record<string, string> = {
  'rank-keyword': 'Rank for Keyword',
  'beat-competitor': 'Beat Competitor',
  'answer-question': 'Answer Question (AEO)',
}

interface InstantCampaignRequest {
  type: 'rank-keyword' | 'beat-competitor' | 'answer-question'
  input: string
  options?: {
    includeImages?: boolean
    contentLength?: 'short' | 'medium' | 'long'
  }
}

/**
 * Map user input to workflow parameters based on campaign type
 */
function mapInputToParams(
  type: string,
  input: string,
  options?: InstantCampaignRequest['options']
): Record<string, unknown> {
  const baseParams = {
    includeImages: options?.includeImages ?? true,
  }

  switch (type) {
    case 'rank-keyword':
      return {
        ...baseParams,
        keyword: input,
        contentLength: options?.contentLength || 'medium',
      }
    case 'beat-competitor':
      return {
        ...baseParams,
        competitor_url: input,
      }
    case 'answer-question':
      return {
        ...baseParams,
        question: input,
      }
    default:
      throw new Error(`Unknown campaign type: ${type}`)
  }
}

/**
 * Generate user-friendly query from campaign type and input
 */
function generateUserQuery(type: string, input: string): string {
  switch (type) {
    case 'rank-keyword':
      return `Create ranking content for the keyword: ${input}`
    case 'beat-competitor':
      return `Create content that outranks: ${input}`
    case 'answer-question':
      return `Create AEO-optimized content to answer: ${input}`
    default:
      return input
  }
}

/**
 * POST handler with SSE streaming for progress updates
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse and validate request
    const body = await req.json() as InstantCampaignRequest
    const { type, input, options } = body

    if (!type || !CAMPAIGN_WORKFLOW_MAP[type]) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid campaign type',
          validTypes: Object.keys(CAMPAIGN_WORKFLOW_MAP),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get authenticated user
    const userId = await requireUserId()
    
    // Get workflow
    const workflowId = CAMPAIGN_WORKFLOW_MAP[type]
    const workflow = getWorkflow(workflowId)
    
    if (!workflow) {
      return new Response(
        JSON.stringify({ error: `Workflow not found: ${workflowId}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate execution context
    const conversationId = nanoid()
    const parameters = mapInputToParams(type, input.trim(), options)
    const userQuery = generateUserQuery(type, input.trim())

    console.log('[Instant Campaign] Starting:', {
      type,
      workflowId,
      userId,
      input: input.substring(0, 50),
      campaignName: CAMPAIGN_NAMES[type],
    })

    // Create smooth streaming response
    const { response, send, close } = createSmoothStreamResponse({
      chunkDelay: 30, // 30ms delay between chunks for smooth animation
      debug: false,
    })

    // Start workflow execution in background
    ;(async () => {
      try {
        // Send initial start event
        await send({
          event: 'start',
          data: {
            type,
            campaignName: CAMPAIGN_NAMES[type],
            workflowId,
            steps: workflow.steps.map(s => ({ id: s.id, name: s.name })),
            estimatedTime: workflow.estimatedTime,
            timestamp: Date.now(),
          },
        })

        // Send progress updates for estimated completion
        const totalSteps = workflow.steps.length
        for (let i = 0; i < totalSteps; i++) {
          const step = workflow.steps[i]
          await sendProgressUpdate(send, {
            step: step.name,
            message: `Processing: ${step.name}`,
            progress: Math.round((i / totalSteps) * 100),
            metadata: { stepId: step.id },
          })
        }

        // Execute workflow
        const execution = await executeWorkflow({
          workflowId,
          userQuery,
          conversationId,
          userId,
          parameters,
          cache: new Map(),
        })

        // Calculate duration
        const duration = Date.now() - startTime
        const durationSeconds = (duration / 1000).toFixed(1)

        // Format results
        const formattedResults = formatWorkflowResults(execution)

        // Send completion event
        await send({
          event: 'complete',
          data: {
            success: execution.status === 'completed',
            duration,
            durationFormatted: `${durationSeconds}s`,
            execution: {
              id: execution.id,
              status: execution.status,
              stepsCompleted: execution.stepResults.filter(s => s.status === 'completed').length,
              totalSteps: execution.stepResults.length,
            },
            results: formattedResults,
            outputs: extractOutputs(execution),
            timestamp: Date.now(),
          },
        })

        console.log('[Instant Campaign] Completed:', {
          type,
          status: execution.status,
          duration: `${durationSeconds}s`,
          stepsCompleted: execution.stepResults.filter(s => s.status === 'completed').length,
        })
      } catch (error) {
        // Send error event
        await sendError(send, {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'WORKFLOW_ERROR',
          details: { duration: Date.now() - startTime },
        })

        console.error('[Instant Campaign] Error:', error)
      } finally {
        // Close stream
        close()
      }
    })()

    return response
  } catch (error) {
    console.error('[Instant Campaign] Request error:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Failed to start campaign',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Extract key outputs from workflow execution for easy access
 */
function extractOutputs(execution: Awaited<ReturnType<typeof executeWorkflow>>) {
  const outputs: Record<string, unknown> = {}
  
  for (const stepResult of execution.stepResults) {
    if (stepResult.status !== 'completed' || !stepResult.toolResults) {
      continue
    }
    
    const toolResults = stepResult.toolResults
    
    // Extract content
    if (toolResults.generate_researched_content?.data?.content) {
      outputs.content = toolResults.generate_researched_content.data.content
    }
    
    // Extract direct answer (for AEO)
    if (toolResults.generate_direct_answer?.data?.answer) {
      outputs.directAnswer = toolResults.generate_direct_answer.data.answer
    }
    
    // Extract hero image
    if (toolResults.generate_hero_image?.data) {
      outputs.heroImage = toolResults.generate_hero_image.data
    }
    
    // Extract schema
    if (toolResults.generate_schema_markup?.data) {
      outputs.schema = toolResults.generate_schema_markup.data
    }
    
    // Extract meta tags
    if (toolResults.generate_meta_tags?.data) {
      outputs.meta = toolResults.generate_meta_tags.data
    }
    
    // Extract optimization score
    if (toolResults.calculate_optimization_score?.data?.score) {
      outputs.optimizationScore = toolResults.calculate_optimization_score.data.score
    }
    
    // Extract comparison (for beat competitor)
    if (toolResults.generate_comparison_summary?.data) {
      outputs.comparison = toolResults.generate_comparison_summary.data
    }
    
    // Extract citation readiness (for AEO)
    if (toolResults.validate_citation_readiness?.data) {
      outputs.citationReadiness = toolResults.validate_citation_readiness.data
    }
  }
  
  return outputs
}

/**
 * GET handler to list available instant campaigns
 */
export async function GET() {
  const campaigns = Object.entries(CAMPAIGN_WORKFLOW_MAP).map(([type, workflowId]) => {
    const workflow = getWorkflow(workflowId)
    return {
      type,
      name: CAMPAIGN_NAMES[type],
      description: workflow?.description || '',
      estimatedTime: workflow?.estimatedTime || 'Unknown',
      icon: workflow?.icon || '⚡',
    }
  })

  return new Response(
    JSON.stringify({ campaigns }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}
