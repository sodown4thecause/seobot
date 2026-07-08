import { describe, expect, it } from 'vitest'
import type { Tool } from 'ai'
import {
  ArtifactGenerationContractSchema,
  MAX_MODEL_FACING_FACADE_TOOLS,
  buildHarnessSystemAddendum,
  filterToolsByHarnessContract,
  getHarnessToolNames,
  resolveHarnessMode,
  selectFacadesForHarness,
} from '@/lib/chat/harness-contracts'

describe('harness contracts', () => {
  it('resolves explicit mode before agent fallback', () => {
    expect(resolveHarnessMode('geo', 'seo-aeo')).toBe('geo')
    expect(resolveHarnessMode(undefined, 'content')).toBe('content')
    expect(resolveHarnessMode(undefined, 'seo-aeo')).toBe('seo')
  })

  it('selects bounded static facade tools for GEO mode', () => {
    const toolNames = getHarnessToolNames({
      mode: 'geo',
      intentHints: ['ai_platforms'],
      intentToolNames: [
        'ai_optimization_keyword_data_search_volume',
        'ai_optimization_keyword_data_locations_and_languages',
      ],
    })

    expect(toolNames.length).toBeLessThanOrEqual(MAX_MODEL_FACING_FACADE_TOOLS)
    expect(toolNames).toContain('ai_optimization_keyword_data_search_volume')
    expect(toolNames).toContain('ai_optimization_keyword_data_locations_and_languages')
    expect(toolNames).not.toContain('serp_youtube_video_comments_live_advanced')
  })

  it('keeps a curated DataForSEO slice available to GEO mode', () => {
    const toolNames = getHarnessToolNames({
      mode: 'geo',
      intentHints: ['competitor_analysis'],
    })

    expect(toolNames).toEqual(
      expect.arrayContaining([
        'dataforseo_labs_google_competitors_domain',
        'ai_optimization_keyword_data_search_volume',
      ])
    )
    expect(toolNames).not.toContain('dataforseo_labs_google_historical_serp')
  })

  it('falls back to mode defaults when intent hints are absent', () => {
    const facades = selectFacadesForHarness({ mode: 'content' })

    expect(facades.map((facade) => facade.id)).toEqual(
      expect.arrayContaining(['content-gap-matrix', 'source-pack', 'content-quality'])
    )
  })

  it('filters existing tools without requiring MCP changes', () => {
    const allowedTool = { description: 'allowed' } as Tool
    const excludedTool = { description: 'excluded' } as Tool

    const filtered = filterToolsByHarnessContract(
      {
        content_analysis_search: allowedTool,
        serp_youtube_video_info_live_advanced: excludedTool,
      },
      ['content_analysis_search']
    )

    expect(filtered).toEqual({ content_analysis_search: allowedTool })
  })

  it('validates AI SDK 6 stream UI artifact contracts', () => {
    const contract = ArtifactGenerationContractSchema.parse({
      artifactId: 'geo-visibility-snapshot',
      mode: 'geo',
      intent: 'ai-visibility',
      streamNodes: [
        {
          type: 'data',
          component: 'AIPlatformMetrics',
          purpose: 'Show platform-level visibility and mention metrics',
        },
        {
          type: 'attachment',
          purpose: 'Persist evidence bundle',
        },
      ],
      attachments: [
        {
          name: 'evidence.json',
          contentType: 'application/json',
          storageId: 'artifact_123',
        },
      ],
      evidence: [
        {
          provider: 'Perplexity',
          source: 'answer audit',
          freshness: 'live run',
          confidence: 'medium',
        },
      ],
      persistenceTarget: 'artifact-store',
    })

    expect(contract.streamNodes[0].component).toBe('AIPlatformMetrics')
  })

  it('adds mode, facade, and stream-node guidance to the system prompt', () => {
    const addendum = buildHarnessSystemAddendum({
      mode: 'seo',
      intentHints: ['keyword_research'],
    })

    expect(addendum).toContain('HARNESS RUNTIME MODE: SEO')
    expect(addendum).toContain('Do not ask for or enumerate raw MCP endpoint catalogs')
    expect(addendum).toContain('AI SDK 6 stream parts')
    expect(addendum).toContain('KeywordMetrics')
  })
})
