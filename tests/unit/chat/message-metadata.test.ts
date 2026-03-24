import { describe, expect, it } from 'vitest'
import { extractCitations, extractReasoning, extractSources } from '@/lib/chat/message-metadata'

describe('message metadata helpers', () => {
  it('creates stable source ids without Math.random', () => {
    const message = {
      metadata: {
        sources: [
          { url: 'https://example.com', title: 'Example' },
          { title: 'Fallback title' },
        ],
      },
    }

    expect(extractSources(message)).toEqual([
      {
        id: 'https://example.com',
        title: 'Example',
        url: 'https://example.com',
        description: undefined,
        type: 'website',
      },
      {
        id: 'Fallback title',
        title: 'Fallback title',
        url: undefined,
        description: undefined,
        type: 'website',
      },
    ])
  })

  it('guards non-array reasoning.steps payloads', () => {
    const message = {
      metadata: {
        reasoning: {
          steps: { title: 'invalid' },
        },
      },
    }

    expect(extractReasoning(message)).toEqual([])
  })

  it('normalizes citations and assigns fallback numbering', () => {
    const message = {
      metadata: {
        citations: [
          'https://example.com',
          { title: 'Example 2', url: 'https://example.org', description: 'Summary' },
        ],
      },
    }

    expect(extractCitations(message)).toEqual([
      {
        number: 1,
        title: 'https://example.com',
        url: 'https://example.com',
      },
      {
        number: 2,
        title: 'Example 2',
        url: 'https://example.org',
        description: 'Summary',
      },
    ])
  })
})
