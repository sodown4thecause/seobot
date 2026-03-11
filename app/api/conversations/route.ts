import { getUserId } from '@/lib/auth/clerk'
import { db, conversations, messages } from '@/lib/db'
import { eq, desc, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * GET /api/conversations
 * List conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (optional to avoid throwing)
    const userIdPromise = getUserId()

    const userId = await userIdPromise

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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
    const conversationListPromise = db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
    const conversationList = await conversationListPromise

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
    // Get authenticated user (optional to avoid throwing)
    const userIdPromise = getUserId()

    const userId = await userIdPromise

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const bodyPromise = request.json()
    const body = await bodyPromise
    const { agentId, title } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    const [latestConversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.status, 'active')))
      .orderBy(desc(conversations.updatedAt))
      .limit(1)

    if (latestConversation) {
      const latestConversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, latestConversation.id))

      if (latestConversationMessages.length === 0) {
        return NextResponse.json({ conversation: latestConversation })
      }
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

