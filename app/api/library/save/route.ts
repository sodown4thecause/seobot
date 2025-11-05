import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
    const { data: libraryItem, error: insertError } = await supabase
      .from('library_items')
      .insert({
        user_id: user.id,
        conversation_id: conversationId || null,
        message_id: messageId || null,
        item_type: itemType,
        title,
        content: content || null,
        data: data || null,
        image_url: imageUrl || null,
        tags,
        metadata,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving library item:', insertError)
      return NextResponse.json(
        { error: 'Failed to save library item' },
        { status: 500 }
      )
    }

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

