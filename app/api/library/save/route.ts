import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth'
import { db, libraryItems, type Json } from '@/lib/db'
import { isArtifactType } from '@/lib/artifacts/registry'
import { buildArtifactTags } from '@/lib/artifacts/build-save-payload'
import { CHAT_MODES, type ChatMode } from '@/lib/chat/modes'

export const runtime = 'nodejs'

const saveLibraryItemSchema = z.object({
  content: z.string().optional(),
  data: z.unknown().optional(),
  imageUrl: z.string().optional(),
  title: z.string().min(1),
  itemType: z.enum(['response', 'image', 'data', 'component']),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
})

type SaveLibraryItemRequest = z.infer<typeof saveLibraryItemSchema>

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const userId = await requireUserId()

    const parsed = saveLibraryItemSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

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
    } = parsed.data

    const artifactTypeRaw = metadata.artifactType
    if (typeof artifactTypeRaw === 'string') {
      if (!isArtifactType(artifactTypeRaw)) {
        return NextResponse.json(
          { error: `Unknown artifactType: ${artifactTypeRaw}` },
          { status: 400 }
        )
      }
      if (itemType !== 'component') {
        return NextResponse.json(
          { error: 'Artifact saves require itemType "component"' },
          { status: 400 }
        )
      }
    }

    const chatModeRaw = metadata.chatMode
    const chatMode: ChatMode | undefined =
      typeof chatModeRaw === 'string' &&
      (CHAT_MODES as readonly string[]).includes(chatModeRaw)
        ? (chatModeRaw as ChatMode)
        : undefined
    const domain =
      typeof metadata.domain === 'string' ? metadata.domain : undefined

    const resolvedTags =
      typeof artifactTypeRaw === 'string' && isArtifactType(artifactTypeRaw)
        ? [...new Set([...tags, ...buildArtifactTags(artifactTypeRaw, chatMode, domain)])]
        : tags

    const resolvedMetadata =
      typeof artifactTypeRaw === 'string' && isArtifactType(artifactTypeRaw)
        ? {
            ...metadata,
            artifactType: artifactTypeRaw,
            artifactVersion: metadata.artifactVersion ?? 1,
          }
        : metadata

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
        data: (data ?? null) as Json,
        imageUrl: imageUrl || null,
        tags: resolvedTags,
        metadata: resolvedMetadata as Json,
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
