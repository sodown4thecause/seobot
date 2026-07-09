import { describe, expect, it, vi } from 'vitest'
import { syncArtifactsFromMessages } from '@/lib/artifacts/sync-from-messages'

const baseOptions = () => ({
  chatMode: 'seo' as const,
  activeArtifactId: null,
  updateArtifact: vi.fn(),
  setActiveArtifactId: vi.fn(),
})

describe('syncArtifactsFromMessages', () => {
  it('hydrates artifacts from AI SDK 6 tool parts', () => {
    const options = baseOptions()
    syncArtifactsFromMessages({
      ...options,
      messages: [
        {
          parts: [
            {
              type: 'tool-n8n_backlinks',
              state: 'output-available',
              toolCallId: 'call-1',
              output: { status: 'success', backlinks: [] },
            },
          ],
        },
      ],
    })

    expect(options.updateArtifact).toHaveBeenCalledWith(
      'backlink-analysis',
      expect.objectContaining({ status: 'complete', type: 'backlink' })
    )
  })

  it('marks streaming artifacts while a tool part is executing', () => {
    const options = baseOptions()
    syncArtifactsFromMessages({
      ...options,
      messages: [
        {
          parts: [
            { type: 'tool-serp_organic_live_advanced', state: 'input-available', toolCallId: 'call-2' },
          ],
        },
      ],
    })

    expect(options.updateArtifact).toHaveBeenCalledWith(
      'serp-analysis',
      expect.objectContaining({ status: 'streaming' })
    )
    expect(options.setActiveArtifactId).toHaveBeenCalledWith('serp-analysis')
  })

  it('does not double-sync a call present in both parts and legacy toolInvocations', () => {
    const options = baseOptions()
    syncArtifactsFromMessages({
      ...options,
      messages: [
        {
          parts: [
            {
              type: 'tool-n8n_backlinks',
              state: 'output-available',
              toolCallId: 'call-3',
              output: { status: 'success' },
            },
          ],
          toolInvocations: [
            { toolName: 'n8n_backlinks', state: 'result', toolCallId: 'call-3', result: { status: 'success' } },
          ],
        },
      ],
    })

    expect(options.updateArtifact).toHaveBeenCalledTimes(1)
  })

  it('still supports legacy toolInvocations-only messages', () => {
    const options = baseOptions()
    syncArtifactsFromMessages({
      ...options,
      messages: [
        {
          toolInvocations: [
            { toolName: 'keywords_data_google_ads_search_volume', state: 'result', result: { keywords: [] } },
          ],
        },
      ],
    })

    expect(options.updateArtifact).toHaveBeenCalledWith(
      'keyword-research',
      expect.objectContaining({ status: 'complete', type: 'keyword' })
    )
  })

  it('marks structured tool errors as error status, not complete', () => {
    const options = baseOptions()
    const onComplete = vi.fn()
    syncArtifactsFromMessages({
      ...options,
      onComplete,
      messages: [
        {
          parts: [
            {
              type: 'tool-serp_organic_live_advanced',
              state: 'output-available',
              toolCallId: 'call-4',
              output: { status: 'error', errorMessage: 'timed out' },
            },
          ],
        },
      ],
    })

    expect(options.updateArtifact).toHaveBeenCalledWith(
      'serp-analysis',
      expect.objectContaining({ status: 'error' })
    )
    expect(onComplete).not.toHaveBeenCalled()
  })
})
