import { getArtifactDefinition } from '@/lib/artifacts/registry'
import type { ArtifactType, SavedArtifactLibraryItem } from '@/lib/artifacts/types'

export interface ArtifactPreviewSummary {
  artifactType: ArtifactType
  label: string
  chatMode?: string
  sourceQuery?: string
  domain?: string
  statusLine: string
  metric?: string
}

function readMetadata(item: SavedArtifactLibraryItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object') {
    return item.metadata as Record<string, unknown>
  }
  return {}
}

export function getArtifactTypeFromLibraryItem(
  item: SavedArtifactLibraryItem
): ArtifactType | null {
  const meta = readMetadata(item)
  const artifactType = meta.artifactType
  if (typeof artifactType === 'string') {
    return artifactType as ArtifactType
  }
  return null
}

function summarizeKeywordData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { keywords?: Array<{ keyword?: string }>; topic?: string }
  const count = record.keywords?.length ?? 0
  if (count > 0) return `${count} keywords`
  if (record.topic) return `Topic: ${record.topic}`
  return undefined
}

function summarizeBacklinkData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as {
    referringDomainsCount?: number
    backlinksCount?: number
    summary?: { referringDomains?: number; backlinks?: number }
  }
  if (typeof record.referringDomainsCount === 'number') {
    return `${record.referringDomainsCount.toLocaleString()} referring domains`
  }
  if (typeof record.summary?.referringDomains === 'number') {
    return `${record.summary.referringDomains.toLocaleString()} referring domains`
  }
  if (typeof record.backlinksCount === 'number') {
    return `${record.backlinksCount.toLocaleString()} backlinks`
  }
  if (typeof record.summary?.backlinks === 'number') {
    return `${record.summary.backlinks.toLocaleString()} backlinks`
  }
  return undefined
}

function summarizeBlogData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { wordCount?: number; title?: string }
  if (typeof record.wordCount === 'number') {
    return `${record.wordCount.toLocaleString()} words`
  }
  return undefined
}

function summarizeSocialData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as { count?: number; items?: unknown[] }
  if (typeof record.count === 'number') return `${record.count.toLocaleString()} social results`
  if (Array.isArray(record.items)) return `${record.items.length.toLocaleString()} social results`
  return undefined
}

function summarizeCitationData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as {
    summary?: {
      shareOfVoice?: number
      mentionedOn?: number
      totalPlatforms?: number
    }
  }
  if (typeof record.summary?.shareOfVoice === 'number') {
    return `${record.summary.shareOfVoice}% share of voice`
  }
  if (
    typeof record.summary?.mentionedOn === 'number' &&
    typeof record.summary.totalPlatforms === 'number'
  ) {
    return `${record.summary.mentionedOn}/${record.summary.totalPlatforms} engines`
  }
  return undefined
}

export function summarizeArtifactData(
  artifactType: ArtifactType,
  data: unknown
): string | undefined {
  switch (artifactType) {
    case 'keyword':
      return summarizeKeywordData(data)
    case 'backlink':
      return summarizeBacklinkData(data)
    case 'blog':
      return summarizeBlogData(data)
    case 'social-listening':
      return summarizeSocialData(data)
    case 'citation-tracker':
      return summarizeCitationData(data)
    default:
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const keys = Object.keys(data as object).length
        if (keys > 0) return `${keys} data fields`
      }
      return undefined
  }
}

export function buildArtifactPreviewSummary(
  item: SavedArtifactLibraryItem
): ArtifactPreviewSummary {
  const meta = readMetadata(item)
  const artifactType =
    (typeof meta.artifactType === 'string'
      ? (meta.artifactType as ArtifactType)
      : null) ?? 'keyword'
  const definition = getArtifactDefinition(artifactType)

  const chatMode = typeof meta.chatMode === 'string' ? meta.chatMode : undefined
  const sourceQuery =
    typeof meta.sourceQuery === 'string' ? meta.sourceQuery : undefined
  const domain = typeof meta.domain === 'string' ? meta.domain : undefined

  const metric = summarizeArtifactData(artifactType, item.data)
  const statusLine =
    metric ??
    definition.description.slice(0, 80) + (definition.description.length > 80 ? '…' : '')

  return {
    artifactType,
    label: item.title || definition.label,
    chatMode,
    sourceQuery,
    domain,
    statusLine,
    metric,
  }
}

export function isSavedArtifactItem(item: SavedArtifactLibraryItem): boolean {
  if (item.itemType === 'component') return true
  const meta = readMetadata(item)
  return typeof meta.artifactType === 'string'
}
