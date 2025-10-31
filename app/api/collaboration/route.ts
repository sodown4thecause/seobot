import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getContentComments,
  addContentComment,
  getPendingApprovals,
  submitForApproval,
  updateApprovalStatus,
  generateCollaborationInsights
} from '@/lib/collaboration/team-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    let result

    switch (action) {
      case 'add_comment':
        result = await addContentComment({
          contentId: data.contentId,
          userId: user.id,
          teamId: data.teamId,
          commentText: data.commentText,
          commentType: data.commentType,
          parentCommentId: data.parentCommentId
        })
        break

      case 'submit_approval':
        result = await submitForApproval({
          contentId: data.contentId,
          userId: user.id,
          teamId: data.teamId,
          approvalLevel: data.approvalLevel,
          notes: data.notes
        })
        break

      case 'update_approval':
        result = await updateApprovalStatus({
          approvalId: data.approvalId,
          userId: user.id,
          status: data.status,
          notes: data.notes
        })
        break

      case 'generate_insights':
        result = await generateCollaborationInsights(
          data.teamId,
          data.contentData
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Collaboration API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const teamId = searchParams.get('teamId')
    const type = searchParams.get('type') // 'comments' or 'approvals'
    const includeResolved = searchParams.get('includeResolved') === 'true'

    // Verify user is authenticated
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    let result

    if (type === 'comments' && contentId) {
      result = await getContentComments(contentId, teamId || undefined, includeResolved)
    } else if (type === 'approvals') {
      result = await getPendingApprovals(user.id, teamId || undefined)
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Collaboration fetch API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
