import { describe, expect, it } from 'vitest'
import { GOOGLE_SEARCH_CONSOLE_SCOPE } from '@/lib/search-console/oauth'
import { hasGoogleSearchConsoleScope } from '@/lib/search-console/client'

describe('Search Console client helpers', () => {
  it('detects Search Console scope in comma or space separated OAuth scope strings', () => {
    expect(hasGoogleSearchConsoleScope(`openid,email,${GOOGLE_SEARCH_CONSOLE_SCOPE}`)).toBe(true)
    expect(hasGoogleSearchConsoleScope(`openid email ${GOOGLE_SEARCH_CONSOLE_SCOPE}`)).toBe(true)
    expect(hasGoogleSearchConsoleScope('openid email profile')).toBe(false)
  })
})
