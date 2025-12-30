// Workflow Execution API Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { executeWorkflow, formatWorkflowResults } from '@/lib/workflows/executor'
import { requireUserId } from '@/lib/auth/clerk'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { workflowId, userQuery, conversationId, parameters } = await req.json()

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    if (!userQuery) {
      return NextResponse.json(
        { error: 'User query is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const userId = await requireUserId()

    console.log('[Workflow API] Executing workflow:', {
      workflowId,
      userId,
      conversationId,
      query: userQuery.substring(0, 100),
    })

    // Execute workflow
    const execution = await executeWorkflow({
      workflowId,
      userQuery,
      conversationId: conversationId || crypto.randomUUID(),
      userId,
      parameters,
      cache: new Map(), // Fresh cache for each execution
    })

    // Format results for display
    const formattedResults = formatWorkflowResults(execution)

    console.log('[Workflow API] Workflow completed:', {
      workflowId,
      status: execution.status,
      stepsCompleted: execution.stepResults.filter((s) => s.status === 'completed').length,
      totalSteps: execution.stepResults.length,
      duration: execution.endTime ? execution.endTime - execution.startTime : 0,
    })

    return NextResponse.json({
      success: true,
      execution,
      results: formattedResults,
    })
  } catch (error) {
    console.error('[Workflow API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to execute workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

