import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('landing CTA flow', () => {
  it('routes users to /reddit-gap from primary lead magnet CTA', () => {
    const landingPath = path.resolve(process.cwd(), 'components/landing/landing-page-client.tsx')
    const auditLandingPath = path.resolve(process.cwd(), 'components/landing/audit-page-client.tsx')

    const landingSource = fs.readFileSync(landingPath, 'utf8')
    const auditLandingSource = fs.readFileSync(auditLandingPath, 'utf8')

    expect(landingSource).toContain('href="/reddit-gap"')
    expect(landingSource).not.toContain('<AEOAuditor />')
    expect(auditLandingSource).toContain('/reddit-gap')
  })
})
