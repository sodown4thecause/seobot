import { describe, expect, it } from 'vitest'
import { resolveEffectiveAgent, shouldLoadRagContext } from '@/lib/chat/api-routing'

describe('chat API mode routing', () => {
  it('routes Social mode to the social agent and context lane', () => {
    const agent = resolveEffectiveAgent('seo-aeo', 'social')

    expect(agent).toBe('social')
    expect(shouldLoadRagContext(agent)).toBe(true)
  })

  it('keeps image intent ahead of mode-specific routing', () => {
    expect(resolveEffectiveAgent('image', 'social')).toBe('image')
  })
})
