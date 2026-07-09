import type { ChatMode } from '@/lib/chat/modes'

export const ARTIFACT_STATUSES = ['loading', 'streaming', 'complete', 'error'] as const
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number]

/** Discriminated artifact types — live + planned (registry marks implementation status). */
export const ARTIFACT_TYPES = [
  // Legacy / live chat artifacts
  'keyword',
  'backlink',
  'serp',
  'blog',
  'social-listening',
  // SEO — keyword intelligence
  'keyword-cluster-map',
  'serp-gap-visualizer',
  'search-intent-matrix',
  'keyword-opportunity-scatter',
  // SEO — technical
  'schema-markup-generator',
  'cwv-diagnosis-card',
  'internal-link-map',
  'robots-sitemap-audit',
  // SEO — on-page
  'page-optimization-scorecard',
  'title-meta-variants',
  'content-brief',
  'faq-schema-builder',
  // GEO — brand visibility
  'citation-tracker',
  'brand-mention-heatmap',
  'ai-answer-accuracy-audit',
  'share-of-voice',
  // GEO — content structure
  'aeo-content-optimizer',
  'answer-ready-paragraph',
  'topical-authority-map',
  'entity-optimization-checklist',
  // GEO — competitive
  'competitor-citation-comparison',
  'geo-content-gap-report',
  'ai-search-result-preview',
] as const

export type ArtifactType = (typeof ARTIFACT_TYPES)[number]

export type ArtifactCategory =
  | 'legacy'
  | 'seo-keyword'
  | 'seo-technical'
  | 'seo-onpage'
  | 'geo-visibility'
  | 'geo-content'
  | 'geo-competitive'
  | 'content'
  | 'social'

export type ArtifactImplementationStatus = 'live' | 'planned'

export interface ArtifactMetadata {
  chatMode?: ChatMode
  sourceQuery?: string
  domain?: string
  conversationId?: string
  messageId?: string
  toolName?: string
  artifactType?: ArtifactType
}

/** Persisted workspace row metadata (stored on library_items.metadata). */
export interface SavedArtifactMetadata extends ArtifactMetadata {
  artifactType: ArtifactType
  artifactVersion: 1
  savedFrom: 'chat-artifact-panel' | 'tool-ui' | 'agent'
}

export interface ArtifactState {
  id: string
  type: ArtifactType
  title: string
  status: ArtifactStatus
  data: unknown
  metadata?: ArtifactMetadata
}

export interface SavedArtifactLibraryItem {
  id: string
  title: string
  itemType: string
  content: string | null
  data: unknown
  imageUrl: string | null
  tags: string[] | null
  metadata: SavedArtifactMetadata | Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  conversationId: string | null
  messageId: string | null
}
