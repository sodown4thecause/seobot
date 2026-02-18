import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import { loadChatMessagesForUser } from '@/lib/chat/persistence'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'

// Node.js runtime required for Drizzle ORM database operations in lib/chat/persistence.
// This is consistent with other DB-heavy routes like app/api/admin/knowledge/upload/route.ts.
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const rateLimitResponse = await rateLimitMiddleware(request, 'CHAT', userId)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { chatId } = await params
    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 })
    }

    const chat = await loadChatMessagesForUser({ userId, chatId })
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error('[Chats API] Failed to load chat:', error)
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 })
  }
}
