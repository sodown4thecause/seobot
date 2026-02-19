import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/auth/clerk'
import { ensureChatForUser, listChatsForSidebar } from '@/lib/chat/persistence'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'

export const runtime = 'nodejs'

const chatInputSchema = z.object({
  chatId: z.string().uuid().optional(),
  agentType: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const rateLimitResponse = await rateLimitMiddleware(request, 'CHAT', userId)
    if (rateLimitResponse) {
      return rateLimitResponse
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

    const rateLimitResponse = await rateLimitMiddleware(request, 'CHAT', userId)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json().catch(() => ({}))
    const parseResult = chatInputSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.issues },
        { status: 400 },
      )
    }

    const chat = await ensureChatForUser({
      userId,
      requestedChatId: parseResult.data.chatId ?? null,
      agentType: parseResult.data.agentType,
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
