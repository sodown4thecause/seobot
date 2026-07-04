import { describe, expect, it } from 'vitest'
import {
  ARTIFACT_REGISTRY,
  TOOL_TO_ARTIFACT,
  getArtifactDefinition,
  listLiveArtifacts,
} from '@/lib/artifacts/registry'

describe('artifact registry', () => {
  it('maps live SEO tools to artifact definitions', () => {
    expect(TOOL_TO_ARTIFACT.get('suggest_keywords')?.type).toBe('keyword')
    expect(TOOL_TO_ARTIFACT.get('n8n_backlinks')?.type).toBe('backlink')
    expect(TOOL_TO_ARTIFACT.get('serp_organic_live_advanced')?.type).toBe('serp')
  })

  it('registers planned GEO artifacts with geo mode', () => {
    const citation = getArtifactDefinition('citation-tracker')
    expect(citation.status).toBe('planned')
    expect(citation.modes).toContain('geo')
  })

  it('maps new GEO execution tools to live artifacts', () => {
    expect(TOOL_TO_ARTIFACT.get('generate_schema_markup')?.type).toBe('schema-markup-generator')
    expect(TOOL_TO_ARTIFACT.get('ai_crawlability_audit')?.type).toBe('robots-sitemap-audit')
    expect(TOOL_TO_ARTIFACT.get('geo_generate_fix')?.type).toBe('geo-content-gap-report')
    expect(getArtifactDefinition('schema-markup-generator').status).toBe('live')
  })

  it('includes every artifact type in the registry', () => {
    const types = Object.keys(ARTIFACT_REGISTRY)
    expect(types.length).toBeGreaterThanOrEqual(20)
    expect(listLiveArtifacts().map((d) => d.type)).toEqual(
      expect.arrayContaining(['keyword', 'backlink', 'serp', 'blog'])
    )
  })
})
