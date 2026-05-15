import 'server-only'

import { generateText } from 'ai'
import { db, libraryItems, type Json } from '@/lib/db'
import { generateImageKey, uploadToR2 } from '@/lib/storage/r2-client'
import { vercelGateway } from '@/lib/ai/gateway-provider'

export const CONTENT_IMAGE_MODEL = 'google/gemini-3-pro-image'
const FAST_TEXT_MODEL = 'google/gemini-3-flash'
const IMAGE_GENERATION_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.CONTENT_IMAGE_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000
})()

export type ContentImageAssetType = 'main' | 'thumbnail'

export interface ContentImageAssetInput {
  userId: string
  conversationId?: string
  messageId?: string
  contentId?: string
  title: string
  content: string
  topic: string
  keywords: string[]
  assetType: ContentImageAssetType
  aspectRatio: '16:9' | '1:1' | '1200x630'
  prompt?: string
}

export interface ContentImageAsset {
  id: string
  type: ContentImageAssetType
  url: string
  previewUrl: string
  storageKey?: string
  saveStatus: 'saved' | 'preview_only'
  saveError?: string
  mediaType: string
  prompt: string
  altText: string
  caption: string
  model: string
  aspectRatio: string
  libraryItemId?: string
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'content'
}

function stripDataPrefix(base64: string): string {
  const commaIndex = base64.indexOf(',')
  return base64.startsWith('data:') && commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64
}

function toDataUrl(base64: string, mediaType: string): string {
  return base64.startsWith('data:') ? base64 : `data:${mediaType};base64,${base64}`
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function extractBase64Image(file: unknown): { base64: string; mediaType: string } | null {
  if (!file || typeof file !== 'object') return null

  const record = file as {
    base64?: string
    uint8Array?: Uint8Array
    data?: Uint8Array
    mediaType?: string
    mimeType?: string
  }
  const mediaType = record.mediaType || record.mimeType || 'image/png'

  if (typeof record.base64 === 'string' && record.base64.length > 0) {
    return { base64: stripDataPrefix(record.base64), mediaType }
  }

  const bytes = record.uint8Array || record.data
  if (bytes instanceof Uint8Array) {
    return { base64: bytesToBase64(bytes), mediaType }
  }

  return null
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout))
  })
}

function buildImagePrompt(input: ContentImageAssetInput): string {
  if (input.prompt?.trim()) return input.prompt.trim()

  const assetLabel = input.assetType === 'main' ? 'main hero image' : 'thumbnail/social preview image'
  const formatGuidance = input.aspectRatio === '16:9'
    ? 'wide 16:9 hero composition with a clear focal point'
    : input.aspectRatio === '1200x630'
      ? 'Open Graph style composition, readable at small preview sizes'
      : 'square thumbnail composition, instantly legible in a content library'

  return `Create a professional ${assetLabel} for this content.

Title: ${input.title}
Topic: ${input.topic}
Keywords: ${input.keywords.slice(0, 8).join(', ') || 'none provided'}
Format: ${formatGuidance}

Visual direction:
- Sophisticated SaaS/content marketing editorial style
- Concrete visual metaphor for the topic
- No text overlays unless the words are short, accurate, and highly legible
- Avoid generic stock-photo staging
- Use balanced contrast and leave clean negative space for cropping

Content excerpt:
${input.content.slice(0, 1800)}`
}

function buildFallbackAlt(input: ContentImageAssetInput): string {
  const label = input.assetType === 'main' ? 'Hero image' : 'Thumbnail image'
  return `${label} for ${input.title}`.slice(0, 125)
}

async function generateAltText(input: ContentImageAssetInput, prompt: string): Promise<string> {
  try {
    const result = await generateText({
      model: vercelGateway.languageModel(FAST_TEXT_MODEL),
      prompt: `Write concise image alt text under 125 characters.

Content title: ${input.title}
Image prompt: ${prompt}
Keywords: ${input.keywords.slice(0, 5).join(', ') || 'none'}

Return only the alt text.`,
      providerOptions: {
        gateway: {
          tags: ['feature:content-images', `asset:${input.assetType}`, 'mode:content'],
        },
      },
    })

    return (result.text || buildFallbackAlt(input)).replace(/^["']|["']$/g, '').slice(0, 125)
  } catch {
    return buildFallbackAlt(input)
  }
}

async function generateImageBase64(prompt: string, assetType: ContentImageAssetType): Promise<{ base64: string; mediaType: string }> {
  const textResult = await generateText({
    model: vercelGateway.languageModel(CONTENT_IMAGE_MODEL),
    prompt,
    providerOptions: {
      google: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
      gateway: {
        tags: ['feature:content-images', `asset:${assetType}`, 'mode:content'],
      },
    },
  })

  const fileImage = textResult.files
    ?.filter(file => file.mediaType?.startsWith('image/'))
    .map(file => extractBase64Image(file))
    .find((file): file is { base64: string; mediaType: string } => !!file)

  if (fileImage) return fileImage

  throw new Error('Image model did not return an image file')
}

export async function generateAndSaveContentImageAsset(input: ContentImageAssetInput): Promise<ContentImageAsset> {
  const prompt = buildImagePrompt(input)
  const { base64, mediaType } = await withTimeout(
    generateImageBase64(prompt, input.assetType),
    IMAGE_GENERATION_TIMEOUT_MS,
    `${input.assetType} image generation`,
  )
  const previewUrl = toDataUrl(base64, mediaType)
  const altText = await generateAltText(input, prompt)
  const caption = input.assetType === 'main'
    ? `Featured image for ${input.title}`
    : `Thumbnail for ${input.title}`

  const storageKey = generateImageKey(`content/${input.userId}/${input.assetType}-${slugify(input.title)}`)
  const upload = await uploadToR2(storageKey, base64, {
    contentType: mediaType,
    cacheControl: 'public, max-age=31536000, immutable',
    metadata: {
      userId: input.userId,
      assetType: input.assetType,
      model: CONTENT_IMAGE_MODEL,
    },
  })

  const url = upload.success ? upload.url : previewUrl
  const saveStatus = upload.success ? 'saved' : 'preview_only'

  const [libraryItem] = await db.insert(libraryItems).values({
    userId: input.userId,
    conversationId: input.conversationId || null,
    messageId: input.messageId || null,
    itemType: 'image',
    title: `${input.title} ${input.assetType === 'main' ? 'main image' : 'thumbnail'}`,
    content: null,
    data: ({
      url,
      previewUrl: undefined,
      storageKey: upload.success ? storageKey : undefined,
      altText,
      caption,
      prompt,
      model: CONTENT_IMAGE_MODEL,
      aspectRatio: input.aspectRatio,
      contentId: input.contentId,
      saveStatus,
      saveError: upload.error,
    } as unknown) as Json,
    imageUrl: upload.success ? url : null,
    tags: ['content', input.assetType, 'ai-image'],
    metadata: ({
      contentId: input.contentId,
      assetType: input.assetType,
      model: CONTENT_IMAGE_MODEL,
      aspectRatio: input.aspectRatio,
      storageKey: upload.success ? storageKey : undefined,
      saveStatus,
      saveError: upload.error,
    } as unknown) as Json,
  }).returning()

  return {
    id: `${input.assetType}-${Date.now()}`,
    type: input.assetType,
    url,
    previewUrl,
    storageKey: upload.success ? storageKey : undefined,
    saveStatus,
    saveError: upload.error,
    mediaType,
    prompt,
    altText,
    caption,
    model: CONTENT_IMAGE_MODEL,
    aspectRatio: input.aspectRatio,
    libraryItemId: libraryItem?.id,
  }
}
