import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConversationForUser, loadConversationMessages } from '@/lib/chat/storage'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const conversation = await getConversationForUser(supabase, user.id, conversationId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const allMessages = await loadConversationMessages(supabase, conversationId)

    // Apply pagination (messages are already sorted by created_at ascending)
    const paginatedMessages = allMessages.slice(offset, offset + limit)
    const hasMore = offset + limit < allMessages.length

    return NextResponse.json({
      conversationId,
      messages: paginatedMessages,
      pagination: {
        offset,
        limit,
        hasMore,
        total: allMessages.length,
      },
    })
  } catch (error) {
    console.error('[Conversations Messages API] Unexpected error', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}
