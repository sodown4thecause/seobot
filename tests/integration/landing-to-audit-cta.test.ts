import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('landing CTA flow', () => {
  it('routes users to /reddit-gap from primary lead magnet CTA', () => {
    const heroPath = path.resolve(process.cwd(), 'components/landing/sections/hero.tsx')
    const auditLandingPath = path.resolve(process.cwd(), 'components/landing/audit-page-client.tsx')

    const heroSource = fs.readFileSync(heroPath, 'utf8')
    const auditLandingSource = fs.readFileSync(auditLandingPath, 'utf8')

    expect(heroSource).toContain('href="/reddit-gap"')
    expect(heroSource).not.toContain('<AEOAuditor />')
    expect(auditLandingSource).toContain('/reddit-gap')
  })
})
