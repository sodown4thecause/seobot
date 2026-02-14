import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import { ensureChatForUser, listChatsForSidebar } from '@/lib/chat/persistence'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '50', 10)
    const limit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 100)

    const chats = await listChatsForSidebar(userId, limit)
    return NextResponse.json({ chats })
  } catch (error) {
    console.error('[Chats API] Failed to list chats:', error)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      chatId?: string
      agentType?: string
    }

    const chat = await ensureChatForUser({
      userId,
      requestedChatId: body.chatId ?? null,
      agentType: body.agentType,
    })

    return NextResponse.json({
      chatId: chat.id,
      created: chat.created,
    })
  } catch (error) {
    console.error('[Chats API] Failed to create chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
