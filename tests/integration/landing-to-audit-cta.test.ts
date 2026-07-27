import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('landing CTA flow', () => {
  it('routes users to /reddit-gap from primary lead magnet CTA', () => {
    const heroPath = path.resolve(process.cwd(), 'components/landing/sections/hero.tsx')
    const finalCtaPath = path.resolve(process.cwd(), 'components/landing/sections/final-cta.tsx')
    const auditLandingPath = path.resolve(process.cwd(), 'components/landing/audit-page-client.tsx')

    const heroSource = fs.readFileSync(heroPath, 'utf8')
    const finalCtaSource = fs.readFileSync(finalCtaPath, 'utf8')
    const auditLandingSource = fs.readFileSync(auditLandingPath, 'utf8')

    expect(heroSource).toContain('href="/reddit-gap"')
    expect(finalCtaSource).toContain('href="/reddit-gap"')
    expect(auditLandingSource).toContain('/reddit-gap')
  })
})
