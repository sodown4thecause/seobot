import { describe, expect, it } from 'vitest'
import { workspaceThemeTokens } from '@/components/dashboard/analytics/theme-tokens'

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap((item) => collectStrings(item))
  }

  return []
}

describe('workspaceThemeTokens', () => {
  it('defines expected semantic token groups', () => {
    expect(workspaceThemeTokens).toHaveProperty('surface')
    expect(workspaceThemeTokens).toHaveProperty('text')
  })

  it('uses grayscale-only color families', () => {
    const allowedFamilies = new Set(['black', 'white', 'zinc', 'neutral', 'gray', 'slate'])
    const values = collectStrings(workspaceThemeTokens)

    for (const className of values) {
      const colorUtilities = [...className.matchAll(/(?:^|:)(?:bg|text|border|ring|stroke|fill)-([a-z]+)/g)]

      for (const [, family] of colorUtilities) {
        expect(allowedFamilies.has(family)).toBe(true)
      }
    }
  })
})
