import { describe, expect, it } from 'vitest'
import { CHAT_MODES } from '@/lib/chat/modes'
import { STARTER_PROMPTS_BY_MODE } from '@/lib/chat/starter-prompts'

describe('starter prompts', () => {
  it('provides four prompts for every chat mode', () => {
    for (const mode of CHAT_MODES) {
      expect(STARTER_PROMPTS_BY_MODE[mode]).toHaveLength(4)
      expect(STARTER_PROMPTS_BY_MODE[mode].every((prompt) => prompt.text.length > 0)).toBe(true)
    }
  })

  it('includes a GEO fix-cycle starter prompt', () => {
    expect(STARTER_PROMPTS_BY_MODE.geo.some((prompt) => prompt.text.includes('fix cycle'))).toBe(true)
  })
})
