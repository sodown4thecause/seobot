import { describe, expect, it } from 'vitest'
import {
  buildArtifactPreviewSummary,
  isSavedArtifactItem,
  summarizeArtifactData,
} from '@/lib/artifacts/preview'
import type { SavedArtifactLibraryItem } from '@/lib/artifacts/types'

describe('artifact preview', () => {
  it('detects saved artifact library rows', () => {
    expect(
      isSavedArtifactItem({
        id: '1',
        title: 'Test',
        itemType: 'component',
        content: null,
        data: {},
        imageUrl: null,
        tags: null,
        metadata: { artifactType: 'keyword' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        conversationId: null,
        messageId: null,
      })
    ).toBe(true)
  })

  it('summarizes keyword artifact metrics', () => {
    const summary = summarizeArtifactData('keyword', {
      keywords: [{ keyword: 'ai seo' }, { keyword: 'geo tools' }],
    })
    expect(summary).toBe('2 keywords')
  })

  it('builds preview card copy from library metadata', () => {
    const item: SavedArtifactLibraryItem = {
      id: '1',
      title: 'Backlinks for example.com',
      itemType: 'component',
      content: null,
      data: { referringDomainsCount: 42 },
      imageUrl: null,
      tags: ['artifact', 'backlink'],
      metadata: {
        artifactType: 'backlink',
        chatMode: 'seo',
        sourceQuery: 'analyze backlinks',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationId: null,
      messageId: null,
    }

    const preview = buildArtifactPreviewSummary(item)
    expect(preview.label).toBe('Backlinks for example.com')
    expect(preview.chatMode).toBe('seo')
    expect(preview.metric).toBe('42 referring domains')
  })
})
