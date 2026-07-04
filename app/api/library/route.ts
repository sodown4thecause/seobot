import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { getLibraryItems } from '@/lib/db/queries'
import {
  buildArtifactPreviewSummary,
  getArtifactTypeFromLibraryItem,
  isSavedArtifactItem,
} from '@/lib/artifacts/preview'
import type { SavedArtifactLibraryItem } from '@/lib/artifacts/types'
import type { ChatMode } from '@/lib/chat/modes'
import { CHAT_MODES } from '@/lib/chat/modes'

export const runtime = 'nodejs'

function isChatMode(value: string | null): value is ChatMode {
  return value !== null && (CHAT_MODES as readonly string[]).includes(value)
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const { searchParams } = req.nextUrl

    const itemType = searchParams.get('itemType') ?? undefined
    const chatModeParam = searchParams.get('chatMode')
    const artifactTypeParam = searchParams.get('artifactType')
    const artifactsOnly = searchParams.get('artifactsOnly') === 'true'

    const items = await getLibraryItems(userId, itemType)

    const toLibraryItem = (item: (typeof items)[number]): SavedArtifactLibraryItem => ({
      id: item.id,
      title: item.title,
      itemType: item.itemType,
      content: item.content,
      data: item.data,
      imageUrl: item.imageUrl,
      tags: item.tags,
      metadata: item.metadata as SavedArtifactLibraryItem['metadata'],
      conversationId: item.conversationId,
      messageId: item.messageId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })

    let serialized = items.map(toLibraryItem)

    if (artifactsOnly) {
      serialized = serialized.filter((item) => isSavedArtifactItem(item))
    }

    if (isChatMode(chatModeParam)) {
      serialized = serialized.filter((item) => {
        const meta = item.metadata as Record<string, unknown> | null
        return meta?.chatMode === chatModeParam
      })
    }

    if (artifactTypeParam) {
      serialized = serialized.filter(
        (item) => getArtifactTypeFromLibraryItem(item) === artifactTypeParam
      )
    }

    const data = serialized.map((item) => ({
      ...item,
      preview: buildArtifactPreviewSummary(item),
    }))

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    })
  } catch (error) {
    console.error('Error listing library items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
