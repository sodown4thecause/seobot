import { describe, expect, it } from 'vitest'
import { buildArtifactSavePayload } from '@/lib/artifacts/build-save-payload'
import type { ArtifactState } from '@/lib/artifacts/types'

describe('buildArtifactSavePayload', () => {
  it('builds workspace save payload with artifact metadata', () => {
    const artifact: ArtifactState = {
      id: 'keyword-research',
      type: 'keyword',
      title: 'Keyword Research',
      status: 'complete',
      data: { topic: 'ai seo', keywords: [] },
      metadata: {
        chatMode: 'seo',
        sourceQuery: 'best ai seo tools',
        domain: 'flowintent.com',
        conversationId: '00000000-0000-4000-8000-000000000001',
      },
    }

    const payload = buildArtifactSavePayload(artifact)

    expect(payload.itemType).toBe('component')
    expect(payload.metadata.artifactType).toBe('keyword')
    expect(payload.metadata.artifactVersion).toBe(1)
    expect(payload.metadata.savedFrom).toBe('chat-artifact-panel')
    expect(payload.tags).toContain('seo')
    expect(payload.tags).toContain('keyword')
    expect(payload.tags).toContain('flowintent.com')
  })
})
