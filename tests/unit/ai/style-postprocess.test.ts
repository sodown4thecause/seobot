import { describe, expect, it, vi } from 'vitest'
import { applyLexicalVariation, applyStylisticPass } from '@/lib/ai/style/postprocess'

// The `compromise` NLP library is a real dependency — we mock it so tests
// stay fast and deterministic while still exercising our own logic.
vi.mock('compromise', () => {
  const makeDoc = (text: string) => ({
    nouns: () => ({ toSingular: () => ({ out: () => [] }) }),
    contractions: () => ({ contract: vi.fn() }),
    text: () => text,
  })
  return { default: makeDoc }
})

describe('applyStylisticPass', () => {
  it('returns the input unchanged when content is empty', () => {
    expect(applyStylisticPass('')).toBe('')
  })

  it('returns null/undefined unchanged', () => {
    // TypeScript callers pass string, but JS consumers may pass falsy values.
    // The guard `if (!content) return content` covers this.
    expect(applyStylisticPass(null as unknown as string)).toBeNull()
    expect(applyStylisticPass(undefined as unknown as string)).toBeUndefined()
  })

  it('returns a non-empty string for typical content', () => {
    const content = 'This is the first paragraph.\n\nThis is the second paragraph.'
    const result = applyStylisticPass(content)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('preserves multi-paragraph structure (double newlines)', () => {
    const content = [
      'First paragraph with a sentence.',
      'Second paragraph with another sentence.',
      'Third paragraph here.',
    ].join('\n\n')
    const result = applyStylisticPass(content)
    // At least two paragraphs should survive
    expect(result.split('\n\n').filter(Boolean).length).toBeGreaterThanOrEqual(2)
  })

  it('filters out blank paragraphs', () => {
    const content = 'First.\n\n   \n\nSecond.'
    const result = applyStylisticPass(content)
    // Blank paragraph should be removed
    expect(result).not.toMatch(/^\s*\n\n\s*$/)
  })

  it('handles a single sentence paragraph without throwing', () => {
    expect(() => applyStylisticPass('Just one sentence.')).not.toThrow()
  })

  it('handles a paragraph with multiple sentences without throwing', () => {
    const para = 'First sentence. Second sentence. Third sentence! Fourth one? Fifth.'
    expect(() => applyStylisticPass(para)).not.toThrow()
  })

  it('output does not start or end with extra whitespace', () => {
    const result = applyStylisticPass('  Hello world.  \n\n  Another line.  ')
    expect(result).toBe(result.trim())
  })
})

describe('applyLexicalVariation', () => {
  it('returns the input unchanged when content is empty', () => {
    expect(applyLexicalVariation('')).toBe('')
  })

  it('returns null/undefined unchanged (guard branch)', () => {
    expect(applyLexicalVariation(null as unknown as string)).toBeNull()
    expect(applyLexicalVariation(undefined as unknown as string)).toBeUndefined()
  })

  it('returns a string for typical content', () => {
    const result = applyLexicalVariation('We need to optimize our SEO strategy.')
    expect(typeof result).toBe('string')
  })

  it('replaces "leverage" with one of its synonyms (case-insensitive)', () => {
    // Run multiple times to improve the chance we see a swap (random choice).
    const synonyms = ['use', 'lean on', 'double down on', 'leverage']
    let saw_swap = false
    for (let i = 0; i < 20; i++) {
      const result = applyLexicalVariation('You can leverage this feature.')
      const lower = result.toLowerCase()
      if (!lower.includes('leverage')) {
        saw_swap = true
        break
      }
    }
    // At least one of the 20 runs should have swapped the word
    expect(saw_swap).toBe(true)
  })

  it('does not change words that are not in the swap map', () => {
    const content = 'The quick brown fox jumps over the lazy dog.'
    const result = applyLexicalVariation(content)
    // None of the words in that sentence are in the swap map, so it should
    // come back unaltered.
    expect(result).toBe(content)
  })

  it('preserves uppercase for all-caps matches', () => {
    // "AI" is in the swap map — uppercase preservation should keep it upper.
    // We run many times because the replacement is random.
    for (let i = 0; i < 10; i++) {
      const result = applyLexicalVariation('Using AI in production.')
      // Any replacement of "AI" should remain uppercase
      const aiLike = /\b(AI|MACHINE INTELLIGENCE|AUTOMATION STACK)\b/.test(result)
      expect(aiLike).toBe(true)
    }
  })

  it('replaces "ensure" with one of its synonyms', () => {
    const synonyms = ['make certain', 'lock in', 'guarantee', 'ensure']
    let saw_swap = false
    for (let i = 0; i < 20; i++) {
      const result = applyLexicalVariation('Please ensure quality.')
      if (!result.toLowerCase().includes('ensure')) {
        saw_swap = true
        break
      }
    }
    expect(saw_swap).toBe(true)
  })

  it('replaces "strategy" with one of its synonyms', () => {
    let saw_swap = false
    for (let i = 0; i < 20; i++) {
      const result = applyLexicalVariation('Our strategy is solid.')
      if (!/\bstrategy\b/i.test(result)) {
        saw_swap = true
        break
      }
    }
    expect(saw_swap).toBe(true)
  })

  it('replaces "framework" with one of its synonyms', () => {
    let saw_swap = false
    for (let i = 0; i < 20; i++) {
      const result = applyLexicalVariation('Use this framework.')
      if (!/\bframework\b/i.test(result)) {
        saw_swap = true
        break
      }
    }
    expect(saw_swap).toBe(true)
  })
})
