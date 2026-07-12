import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('Task 7 security regressions', () => {
  it('requires verified local email while preserving trusted Google linking', () => {
    const source = readSource('lib/auth-config.ts')

    expect(source).toContain("trustedProviders: ['google']")
    expect(source).toContain('requireLocalEmailVerified: true')
    expect(source).not.toContain('requireLocalEmailVerified: false')
  })

  it('uses conflict-safe scoped message persistence for every save path', () => {
    const source = readSource('lib/chat/persistence.ts')

    expect(source).toContain('async function persistMessagePayload')
    expect(source).toContain('.onConflictDoNothing()')
    expect(source).toContain('eq(messages.conversationId, candidate.conversationId)')
    expect(source).not.toContain('.onConflictDoUpdate({')
    expect(source.match(/persistMessagePayload\(/g)).toHaveLength(4)
  })
})
