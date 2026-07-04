import { getUserId } from '@/lib/auth'
import { mergeMetadataWithChatMode } from '@/lib/chat/conversation-mode'
import { isChatMode } from '@/lib/chat/modes'
import { db, conversations, messages } from '@/lib/db'
import type { Json } from '@/lib/db/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

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
    const { agentId, title, chatMode } = body

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
    const metadata: Json | undefined =
      chatMode && isChatMode(chatMode)
        ? (mergeMetadataWithChatMode(null, chatMode) as Json)
        : undefined

    const [conversation] = await db
      .insert(conversations)
      .values({
        userId,
        agentType: agentId,
        title: title || 'New Conversation',
        status: 'active',
        ...(metadata ? { metadata } : {}),
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

/**
 * PATCH /api/conversations
 * Update one or more conversations (title, status, chatMode in metadata).
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const conversationIds: string[] = Array.isArray(body.conversationIds)
      ? body.conversationIds
      : []
    const updates = body.updates ?? {}

    if (conversationIds.length === 0) {
      return NextResponse.json({ error: 'conversationIds is required' }, { status: 400 })
    }

    const patchValues: {
      title?: string
      status?: string
      updatedAt: Date
    } = { updatedAt: new Date() }

    if (typeof updates.title === 'string') {
      patchValues.title = updates.title
    }
    if (updates.status === 'active' || updates.status === 'archived' || updates.status === 'pinned') {
      patchValues.status = updates.status
    }

    if (updates.chatMode && isChatMode(updates.chatMode)) {
      const existing = await db
        .select({ id: conversations.id, metadata: conversations.metadata })
        .from(conversations)
        .where(
          and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds))
        )

      await Promise.all(
        existing.map((row) =>
          db
            .update(conversations)
            .set({
              ...patchValues,
              metadata: mergeMetadataWithChatMode(
                row.metadata as Record<string, unknown> | null,
                updates.chatMode
              ) as Json,
            })
            .where(eq(conversations.id, row.id))
        )
      )

      return NextResponse.json({ updated: existing.length })
    }

    await db
      .update(conversations)
      .set(patchValues)
      .where(
        and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds))
      )

    return NextResponse.json({ updated: conversationIds.length })
  } catch (error) {
    console.error('[Conversations API] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/conversations
 * Archive conversations by id list.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const conversationIds: string[] = Array.isArray(body.conversationIds)
      ? body.conversationIds
      : []

    if (conversationIds.length === 0) {
      return NextResponse.json({ error: 'conversationIds is required' }, { status: 400 })
    }

    await db
      .update(conversations)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(
        and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds))
      )

    return NextResponse.json({ archived: conversationIds.length })
  } catch (error) {
    console.error('[Conversations API] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
