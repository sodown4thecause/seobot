import { getUserId } from '@/lib/auth'
import {
  getChatModeFromMetadata,
  mergeMetadataWithChatMode,
} from '@/lib/chat/conversation-mode'
import { isChatMode } from '@/lib/chat/modes'
import { db, conversations, messages } from '@/lib/db'
import type { Json } from '@/lib/db/schema'
import { eq, desc, and, inArray, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_BULK_CONVERSATION_IDS = 50

type ParsedBulkBody =
  | { ok: true; conversationIds: string[]; updates: Record<string, unknown> }
  | { ok: false; response: NextResponse }

async function parseBulkConversationBody(
  request: NextRequest
): Promise<ParsedBulkBody> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  if (!body || typeof body !== 'object') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    }
  }

  const record = body as Record<string, unknown>
  const conversationIds = Array.isArray(record.conversationIds)
    ? record.conversationIds.filter((id): id is string => typeof id === 'string')
    : []

  if (conversationIds.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'conversationIds is required' }, { status: 400 }),
    }
  }

  if (conversationIds.length > MAX_BULK_CONVERSATION_IDS) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `conversationIds exceeds limit of ${MAX_BULK_CONVERSATION_IDS}` },
        { status: 400 }
      ),
    }
  }

  const updates =
    record.updates && typeof record.updates === 'object' && !Array.isArray(record.updates)
      ? (record.updates as Record<string, unknown>)
      : {}

  return { ok: true, conversationIds, updates }
}

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

    // Filter by status if specified (pinned threads stay visible in active lists)
    if (status === 'active') {
      conditions.push(inArray(conversations.status, ['active', 'pinned']))
    } else if (status === 'archived' || status === 'pinned') {
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
        const requestedMode =
          chatMode && isChatMode(chatMode) ? chatMode : null
        const storedMode = getChatModeFromMetadata(
          latestConversation.metadata as Record<string, unknown> | null
        )

        if (requestedMode && storedMode !== requestedMode) {
          const [updatedConversation] = await db
            .update(conversations)
            .set({
              metadata: mergeMetadataWithChatMode(
                latestConversation.metadata as Record<string, unknown> | null,
                requestedMode
              ) as Json,
              updatedAt: new Date(),
            })
            .where(eq(conversations.id, latestConversation.id))
            .returning()

          return NextResponse.json({
            conversation: updatedConversation ?? latestConversation,
          })
        }

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

    const parsed = await parseBulkConversationBody(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { conversationIds, updates } = parsed

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
      const chatMode = updates.chatMode
      const updatedRows = await db
        .update(conversations)
        .set({
          ...patchValues,
          metadata: sql`coalesce(${conversations.metadata}, '{}'::jsonb) || jsonb_build_object('chatMode', ${chatMode}::text)`,
        })
        .where(
          and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds))
        )
        .returning({ id: conversations.id })

      return NextResponse.json({ updated: updatedRows.length })
    }

    const updatedRows = await db
      .update(conversations)
      .set(patchValues)
      .where(
        and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds))
      )
      .returning({ id: conversations.id })

    return NextResponse.json({ updated: updatedRows.length })
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

    const parsed = await parseBulkConversationBody(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const { conversationIds } = parsed

    const archivedRows = await db
      .update(conversations)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(
        and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds))
      )
      .returning({ id: conversations.id })

    return NextResponse.json({ archived: archivedRows.length })
  } catch (error) {
    console.error('[Conversations API] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
