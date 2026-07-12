import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('chat API mode routing', () => {
  it('routes Social mode to the social agent and context lane', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/api/chat/route.ts'), 'utf8')

    expect(source).toContain("} else if (mode === 'social') {")
    expect(source).toContain("effectiveAgent = 'social'")
    expect(source).toContain("effectiveAgent === 'social'")
  })
})
