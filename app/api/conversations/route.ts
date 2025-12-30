import { requireUserId } from '@/lib/auth/clerk'
import { db, conversations } from '@/lib/db'
import { eq, desc, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * GET /api/conversations
 * List conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = await requireUserId()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where conditions
    const conditions = [eq(conversations.userId, userId)]
    
    // Filter by status if specified
    if (status === 'active' || status === 'archived') {
      conditions.push(eq(conversations.status, status))
    }

    // Query conversations
    const conversationList = await db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)

    return NextResponse.json({ conversations: conversationList })
  } catch (error) {
    console.error('[Conversations API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const userId = await requireUserId()

    // Parse request body
    const body = await request.json()
    const { agentId, title } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    // Create conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        userId,
        agentType: agentId,
        title: title || 'New Conversation',
        status: 'active',
      })
      .returning()

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('[Conversations API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

