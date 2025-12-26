import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/clerk'
import { eq, and, desc } from 'drizzle-orm'
import { conversations } from '@/lib/db/schema'

export const runtime = 'nodejs'

/**
 * GET /api/conversations
 * List conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Query conversations with Drizzle
    let data
    if (status === 'all') {
      data = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, user.id))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
    } else {
      data = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.userId, user.id),
          eq(conversations.status, status)
        ))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
    }

    return NextResponse.json({ conversations: data || [] })
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
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { agentId, title } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    // Create conversation with Drizzle
    const [conversation] = await db
      .insert(conversations)
      .values({
        userId: user.id,
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
