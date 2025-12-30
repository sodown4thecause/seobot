import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { db, libraryItems } from '@/lib/db'

export const runtime = 'edge'

interface SaveLibraryItemRequest {
  content?: string
  data?: any
  imageUrl?: string
  title: string
  itemType: 'response' | 'image' | 'data' | 'component'
  conversationId?: string
  messageId?: string
  metadata?: Record<string, any>
  tags?: string[]
}

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const userId = await requireUserId()

    const body: SaveLibraryItemRequest = await req.json()
    const {
      content,
      data,
      imageUrl,
      title,
      itemType,
      conversationId,
      messageId,
      metadata = {},
      tags = [],
    } = body

    // Validate required fields
    if (!title || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields: title and itemType' },
        { status: 400 }
      )
    }

    // Insert library item
    const [libraryItem] = await db
      .insert(libraryItems)
      .values({
        userId,
        conversationId: conversationId || null,
        messageId: messageId || null,
        itemType,
        title,
        content: content || null,
        data: data || null,
        imageUrl: imageUrl || null,
        tags,
        metadata,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: libraryItem,
    })
  } catch (error) {
    console.error('Error in library save endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

