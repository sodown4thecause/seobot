// Workflow Execution API Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { executeWorkflow, formatWorkflowResults } from '@/lib/workflows/executor'
import { createClient } from '@/lib/supabase/server'

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

    // Get user from Supabase
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Workflow API] Executing workflow:', {
      workflowId,
      userId: user.id,
      conversationId,
      query: userQuery.substring(0, 100),
    })

    // Execute workflow
    const execution = await executeWorkflow({
      workflowId,
      userQuery,
      conversationId: conversationId || crypto.randomUUID(),
      userId: user.id,
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

