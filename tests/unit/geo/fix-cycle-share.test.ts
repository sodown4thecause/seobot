import { describe, expect, it } from 'vitest'
import { generateFixCycleShareToken } from '@/lib/geo/fix-cycle'

describe('fix cycle share tokens', () => {
  it('generates unguessable URL-safe tokens', () => {
    const token = generateFixCycleShareToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeGreaterThanOrEqual(40)
  })

  it('generates unique tokens for separate shares', () => {
    expect(generateFixCycleShareToken()).not.toBe(generateFixCycleShareToken())
  })
})
