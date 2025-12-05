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

    const conversation = await getConversationForUser(supabase, user.id, conversationId)
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await loadConversationMessages(supabase, conversationId)

    return NextResponse.json({
      conversationId,
      messages,
    })
  } catch (error) {
    console.error('[Conversations Messages API] Unexpected error', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}
